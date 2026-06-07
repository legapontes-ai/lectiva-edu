// Cria os buckets de Storage no Supabase (idempotente). Roda com env via dotenv.
const { createClient } = require("@supabase/supabase-js");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function transitorio(err) {
  if (!err) return false;
  const s = err.status ?? err.statusCode;
  const msg = String(err.message || "");
  return s === 429 || (typeof s === "number" && s >= 500) || /rate.?limit|too many|timeout|network|fetch failed/i.test(msg);
}
// Retry com backoff + jitter para limitação temporária do servidor (429/5xx/rede).
async function comRetry(fn, rotulo) {
  const N = 4;
  let res = await fn();
  for (let i = 1; i < N; i++) {
    if (!res.error || !transitorio(res.error)) return res;
    const teto = Math.min(8000, 300 * 2 ** (i - 1));
    const espera = Math.round(teto / 2 + Math.random() * (teto / 2));
    console.warn(`[resiliencia] ${rotulo}: transitório. Retry ${i}/${N - 1} em ${espera}ms.`);
    await sleep(espera);
    res = await fn();
  }
  return res;
}

const BUCKETS = [
  { id: "documentos", public: false, fileSizeLimit: "10MB" }, // docs de matrícula, comprovantes
  { id: "materiais", public: false, fileSizeLimit: "50MB" },  // biblioteca/materiais de apoio
  { id: "certificados", public: false, fileSizeLimit: "5MB" }, // PDFs de certificado
];

(async () => {
  const { data: existentes, error: e1 } = await comRetry(() => admin.storage.listBuckets(), "listBuckets");
  if (e1) throw e1;
  const nomes = new Set((existentes || []).map((b) => b.id));
  for (const b of BUCKETS) {
    if (nomes.has(b.id)) {
      console.log(`= bucket "${b.id}" já existe`);
      continue;
    }
    const { error } = await comRetry(
      () => admin.storage.createBucket(b.id, { public: b.public, fileSizeLimit: b.fileSizeLimit }),
      `createBucket:${b.id}`,
    );
    if (error) {
      console.log(`ERR criar "${b.id}": ${error.message}`);
    } else {
      console.log(`+ bucket "${b.id}" criado (public=${b.public})`);
    }
  }
  console.log("Storage pronto.");
})();
