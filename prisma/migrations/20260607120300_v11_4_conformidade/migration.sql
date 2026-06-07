-- Incremento v1.1.4 — Conformidade dos planos de aula (5.11.12). Aditivo/reversível.

CREATE TYPE "StatusConformidade" AS ENUM ('Pendente', 'Conforme', 'NaoConforme');

CREATE TABLE "analise_conformidade" (
  "id" UUID NOT NULL,
  "id_plano" UUID NOT NULL,
  "status" "StatusConformidade" NOT NULL DEFAULT 'Pendente',
  "observacoes" TEXT,
  "analisado_por" UUID,
  "data_analise" TIMESTAMP(3),
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "analise_conformidade_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "analise_conformidade_id_plano_key" ON "analise_conformidade"("id_plano");

ALTER TABLE "analise_conformidade" ADD CONSTRAINT "analise_conformidade_id_plano_fkey" FOREIGN KEY ("id_plano") REFERENCES "plano_aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "analise_conformidade" ADD CONSTRAINT "analise_conformidade_analisado_por_fkey" FOREIGN KEY ("analisado_por") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "analise_conformidade" ENABLE ROW LEVEL SECURITY;
