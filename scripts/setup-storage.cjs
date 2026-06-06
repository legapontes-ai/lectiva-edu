// Cria os buckets de Storage no Supabase (idempotente). Roda com env via dotenv.
const { createClient } = require("@supabase/supabase-js");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const BUCKETS = [
  { id: "documentos", public: false, fileSizeLimit: "10MB" }, // docs de matrícula, comprovantes
  { id: "materiais", public: false, fileSizeLimit: "50MB" },  // biblioteca/materiais de apoio
  { id: "certificados", public: false, fileSizeLimit: "5MB" }, // PDFs de certificado
];

(async () => {
  const { data: existentes, error: e1 } = await admin.storage.listBuckets();
  if (e1) throw e1;
  const nomes = new Set((existentes || []).map((b) => b.id));
  for (const b of BUCKETS) {
    if (nomes.has(b.id)) {
      console.log(`= bucket "${b.id}" já existe`);
      continue;
    }
    const { error } = await admin.storage.createBucket(b.id, {
      public: b.public,
      fileSizeLimit: b.fileSizeLimit,
    });
    if (error) {
      console.log(`ERR criar "${b.id}": ${error.message}`);
    } else {
      console.log(`+ bucket "${b.id}" criado (public=${b.public})`);
    }
  }
  console.log("Storage pronto.");
})();
