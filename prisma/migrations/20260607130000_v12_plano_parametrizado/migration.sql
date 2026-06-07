-- v1.2 — Plano de aulas parametrizado: periodicidade, execução por aula
-- (integral/parcial/não dado + motivo) e docente (titular/substituto). Aditivo/reversível.

CREATE TYPE "PeriodicidadePlano" AS ENUM ('Mensal', 'Bimestral', 'Semestral', 'Anual');
CREATE TYPE "StatusExecucaoAula" AS ENUM ('Pendente', 'Integral', 'Parcial', 'NaoDado');
CREATE TYPE "TipoDocente" AS ENUM ('Titular', 'Substituto');

ALTER TABLE "plano_aula"
  ADD COLUMN "periodicidade" "PeriodicidadePlano",
  ADD COLUMN "data_inicio" DATE;

ALTER TABLE "aula_planejada"
  ADD COLUMN "execucao" "StatusExecucaoAula" NOT NULL DEFAULT 'Pendente',
  ADD COLUMN "motivo_execucao" TEXT,
  ADD COLUMN "docente_tipo" "TipoDocente",
  ADD COLUMN "docente_nome" TEXT;

-- Backfill: aulas já marcadas como concluídas passam a execução Integral (consistência).
UPDATE "aula_planejada" SET "execucao" = 'Integral' WHERE "concluida" = true;
