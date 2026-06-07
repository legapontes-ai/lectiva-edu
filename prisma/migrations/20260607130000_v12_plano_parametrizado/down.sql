-- ROLLBACK do v1.2 (plano parametrizado / execução por aula).
ALTER TABLE "aula_planejada"
  DROP COLUMN IF EXISTS "execucao",
  DROP COLUMN IF EXISTS "motivo_execucao",
  DROP COLUMN IF EXISTS "docente_tipo",
  DROP COLUMN IF EXISTS "docente_nome";
ALTER TABLE "plano_aula"
  DROP COLUMN IF EXISTS "periodicidade",
  DROP COLUMN IF EXISTS "data_inicio";
DROP TYPE IF EXISTS "TipoDocente";
DROP TYPE IF EXISTS "StatusExecucaoAula";
DROP TYPE IF EXISTS "PeriodicidadePlano";
