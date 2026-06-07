-- ROLLBACK do Incremento v1.1.2 (autocadastro).
DROP TABLE IF EXISTS "autocadastro";
DROP TABLE IF EXISTS "politica_senha_temporaria";
DROP TYPE IF EXISTS "SituacaoAutocadastro";
ALTER TABLE "usuario"
  DROP COLUMN IF EXISTS "senha_provisoria",
  DROP COLUMN IF EXISTS "senha_expira_em",
  DROP COLUMN IF EXISTS "deve_trocar_senha";
