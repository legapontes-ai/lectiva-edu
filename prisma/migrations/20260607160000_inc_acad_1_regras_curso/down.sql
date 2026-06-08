-- Reverte INC-ACAD-1.
ALTER TABLE "curso"
  DROP COLUMN "nota_minima_aprovacao",
  DROP COLUMN "frequencia_minima",
  DROP COLUMN "origem_nota",
  DROP COLUMN "exige_todas_disciplinas";
DROP TYPE "OrigemNota";
