-- INC-ACAD-1 — Regras de aprovação/certificação parametrizáveis por curso.
-- Aditivo: colunas com DEFAULT (linhas existentes recebem os defaults). Reversível.
CREATE TYPE "OrigemNota" AS ENUM ('Avaliacao', 'PlanoDeAula');

ALTER TABLE "curso"
  ADD COLUMN "nota_minima_aprovacao" DECIMAL(4,2) NOT NULL DEFAULT 7.00,
  ADD COLUMN "frequencia_minima" INTEGER NOT NULL DEFAULT 75,
  ADD COLUMN "origem_nota" "OrigemNota" NOT NULL DEFAULT 'Avaliacao',
  ADD COLUMN "exige_todas_disciplinas" BOOLEAN NOT NULL DEFAULT true;
