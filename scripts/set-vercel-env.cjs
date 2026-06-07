/**
 * Configura as variáveis de ambiente do projeto na Vercel via API REST.
 * - Lê o token salvo do CLI (não imprime o valor).
 * - Define production + preview + development de uma vez (evita o bug do CLI
 *   que pede git branch no preview).
 * - Idempotente: remove entradas existentes da mesma chave antes de recriar.
 *
 * Uso: node scripts/set-vercel-env.cjs
 */
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const AUTH_PATH = path.join(os.homedir(), "AppData", "Roaming", "com.vercel.cli", "Data", "auth.json");
const PROJECT_PATH = path.join(process.cwd(), ".vercel", "project.json");
const ENV_PATH = path.join(process.cwd(), ".env.local");

const token = JSON.parse(fs.readFileSync(AUTH_PATH, "utf8")).token;
if (!token) throw new Error("Token da Vercel não encontrado no auth.json");
const { projectId, orgId: teamId } = JSON.parse(fs.readFileSync(PROJECT_PATH, "utf8"));

// Parse .env.local
const map = {};
for (const raw of fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  map[k] = v;
}
map["NEXT_PUBLIC_APP_URL"] = "https://lectiva-edu.vercel.app";

const WANTED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "DIRECT_URL",
  "EMAIL_FROM",
  "PAYMENT_PROVIDER",
  "SESSION_INACTIVITY_MINUTES",
  "TZ",
  "NEXT_PUBLIC_APP_URL",
];
const TARGETS = ["production", "preview", "development"];

const base = `https://api.vercel.com`;
const qs = teamId ? `?teamId=${teamId}` : "";
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, url, body) {
  const TENTATIVAS = 4;
  for (let i = 0; i < TENTATIVAS; i++) {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    // 429/5xx = limitação temporária do servidor: backoff + jitter (respeita Retry-After).
    if ((res.status === 429 || res.status >= 500) && i < TENTATIVAS - 1) {
      const ra = Number(res.headers.get("retry-after"));
      const teto = Math.min(8000, 300 * 2 ** i);
      const espera = ra > 0 ? ra * 1000 : Math.round(teto / 2 + Math.random() * (teto / 2));
      console.warn(`[resiliencia] vercel-api ${res.status} transitório. Retry ${i + 1}/${TENTATIVAS - 1} em ${espera}ms.`);
      await sleep(espera);
      continue;
    }
    if (!res.ok) throw new Error(`${method} ${url.replace(token, "***")} -> ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
    return json;
  }
}

(async () => {
  // 1. Lista env existentes
  const list = await api("GET", `${base}/v9/projects/${projectId}/env${qs}`);
  const existentes = list.envs || [];

  for (const key of WANTED) {
    const value = map[key];
    if (!value) { console.log(`skip ${key} (vazio)`); continue; }

    // 2. Remove entradas existentes da mesma chave
    for (const e of existentes.filter((e) => e.key === key)) {
      await api("DELETE", `${base}/v9/projects/${projectId}/env/${e.id}${qs}`);
    }

    // 3. Cria nova entrada para todos os targets
    await api("POST", `${base}/v10/projects/${projectId}/env${qs}`, {
      key,
      value,
      type: "encrypted",
      target: TARGETS,
    });
    console.log(`✓ ${key} -> [${TARGETS.join(", ")}]`);
  }

  console.log("\nEnv vars configuradas via API.");
})().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
