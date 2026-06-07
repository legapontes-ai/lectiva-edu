-- Incremento v1.1.2 — Autocadastro (5.13). Aditivo/reversível.

CREATE TYPE "SituacaoAutocadastro" AS ENUM ('Pendente', 'Aprovado', 'Rejeitado', 'Expirado');

-- Colunas de senha temporária no usuário (com defaults: seguro para linhas existentes)
ALTER TABLE "usuario"
  ADD COLUMN "senha_provisoria" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "senha_expira_em" TIMESTAMP(3),
  ADD COLUMN "deve_trocar_senha" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "politica_senha_temporaria" (
  "id_perfil" UUID NOT NULL,
  "dias_validade" INTEGER NOT NULL DEFAULT 7,
  "atualizado_em" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "politica_senha_temporaria_pkey" PRIMARY KEY ("id_perfil")
);

CREATE TABLE "autocadastro" (
  "id" UUID NOT NULL,
  "nome" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "cpf" TEXT,
  "telefone" TEXT,
  "id_perfil" UUID NOT NULL,
  "status" "SituacaoAutocadastro" NOT NULL DEFAULT 'Pendente',
  "id_usuario" UUID,
  "senha_expira_em" TIMESTAMP(3),
  "motivo_rejeicao" TEXT,
  "revisado_por" UUID,
  "data_revisao" TIMESTAMP(3),
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "autocadastro_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "autocadastro_id_usuario_key" ON "autocadastro"("id_usuario");
CREATE INDEX "autocadastro_status_idx" ON "autocadastro"("status");
CREATE INDEX "autocadastro_email_idx" ON "autocadastro"("email");

ALTER TABLE "politica_senha_temporaria"
  ADD CONSTRAINT "politica_senha_temporaria_id_perfil_fkey"
  FOREIGN KEY ("id_perfil") REFERENCES "perfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "autocadastro"
  ADD CONSTRAINT "autocadastro_id_perfil_fkey"
  FOREIGN KEY ("id_perfil") REFERENCES "perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "autocadastro"
  ADD CONSTRAINT "autocadastro_id_usuario_fkey"
  FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "autocadastro"
  ADD CONSTRAINT "autocadastro_revisado_por_fkey"
  FOREIGN KEY ("revisado_por") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS deny-by-default: o app acessa via Prisma (owner) / service_role, que fazem
-- bypass de RLS; PostgREST (anon/authenticated) fica bloqueado por não haver policy.
ALTER TABLE "autocadastro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "politica_senha_temporaria" ENABLE ROW LEVEL SECURITY;
