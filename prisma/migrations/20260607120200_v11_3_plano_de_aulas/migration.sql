-- Incremento v1.1.3 — Plano de Aulas (5.14). Aditivo/reversível.

CREATE TYPE "StatusPlanoAula" AS ENUM ('EmElaboracao', 'EmAndamento', 'Concluido');

CREATE TABLE "plano_aula" (
  "id" UUID NOT NULL,
  "id_disciplina" UUID NOT NULL,
  "id_turma" UUID NOT NULL,
  "id_professor" UUID NOT NULL,
  "objetivos" TEXT,
  "metodologia" TEXT,
  "status" "StatusPlanoAula" NOT NULL DEFAULT 'EmElaboracao',
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plano_aula_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "plano_aula_id_disciplina_id_turma_key" ON "plano_aula"("id_disciplina", "id_turma");
CREATE INDEX "plano_aula_id_professor_idx" ON "plano_aula"("id_professor");

CREATE TABLE "aula_planejada" (
  "id" UUID NOT NULL,
  "id_plano" UUID NOT NULL,
  "ordem" INTEGER NOT NULL DEFAULT 1,
  "titulo" TEXT NOT NULL,
  "conteudo" TEXT,
  "objetivos" TEXT,
  "data_prevista" DATE,
  "carga_horaria" INTEGER,
  "concluida" BOOLEAN NOT NULL DEFAULT false,
  "data_conclusao" TIMESTAMP(3),
  CONSTRAINT "aula_planejada_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "aula_planejada_id_plano_idx" ON "aula_planejada"("id_plano");

CREATE TABLE "aula_material" (
  "id" UUID NOT NULL,
  "id_aula" UUID NOT NULL,
  "titulo" TEXT NOT NULL,
  "arquivo_url" TEXT,
  "id_material" UUID,
  CONSTRAINT "aula_material_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "aula_material_id_aula_idx" ON "aula_material"("id_aula");

CREATE TABLE "atividade_avaliativa" (
  "id" UUID NOT NULL,
  "id_plano" UUID NOT NULL,
  "nome" TEXT NOT NULL,
  "peso" DECIMAL(5,2) NOT NULL DEFAULT 1,
  "escala_max" DECIMAL(4,2) NOT NULL DEFAULT 10,
  "data" DATE,
  CONSTRAINT "atividade_avaliativa_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "atividade_avaliativa_id_plano_idx" ON "atividade_avaliativa"("id_plano");

CREATE TABLE "nota_atividade" (
  "id" UUID NOT NULL,
  "id_atividade" UUID NOT NULL,
  "id_aluno" UUID NOT NULL,
  "nota" DECIMAL(4,2),
  CONSTRAINT "nota_atividade_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "nota_atividade_id_atividade_id_aluno_key" ON "nota_atividade"("id_atividade", "id_aluno");
CREATE INDEX "nota_atividade_id_aluno_idx" ON "nota_atividade"("id_aluno");

CREATE TABLE "diario_classe" (
  "id" UUID NOT NULL,
  "id_plano" UUID NOT NULL,
  "id_aula" UUID,
  "data" DATE NOT NULL,
  "conteudo_ministrado" TEXT,
  "observacoes" TEXT,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "diario_classe_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "diario_classe_id_plano_idx" ON "diario_classe"("id_plano");

CREATE TABLE "ocorrencia" (
  "id" UUID NOT NULL,
  "id_aluno" UUID NOT NULL,
  "id_turma" UUID,
  "id_aula" UUID,
  "tipo" TEXT,
  "descricao" TEXT NOT NULL,
  "data" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "registrado_por" UUID,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ocorrencia_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ocorrencia_id_aluno_idx" ON "ocorrencia"("id_aluno");

ALTER TABLE "plano_aula" ADD CONSTRAINT "plano_aula_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plano_aula" ADD CONSTRAINT "plano_aula_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plano_aula" ADD CONSTRAINT "plano_aula_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "aula_planejada" ADD CONSTRAINT "aula_planejada_id_plano_fkey" FOREIGN KEY ("id_plano") REFERENCES "plano_aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aula_material" ADD CONSTRAINT "aula_material_id_aula_fkey" FOREIGN KEY ("id_aula") REFERENCES "aula_planejada"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aula_material" ADD CONSTRAINT "aula_material_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "material_biblioteca"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "atividade_avaliativa" ADD CONSTRAINT "atividade_avaliativa_id_plano_fkey" FOREIGN KEY ("id_plano") REFERENCES "plano_aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "nota_atividade" ADD CONSTRAINT "nota_atividade_id_atividade_fkey" FOREIGN KEY ("id_atividade") REFERENCES "atividade_avaliativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "nota_atividade" ADD CONSTRAINT "nota_atividade_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "diario_classe" ADD CONSTRAINT "diario_classe_id_plano_fkey" FOREIGN KEY ("id_plano") REFERENCES "plano_aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "diario_classe" ADD CONSTRAINT "diario_classe_id_aula_fkey" FOREIGN KEY ("id_aula") REFERENCES "aula_planejada"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_id_aula_fkey" FOREIGN KEY ("id_aula") REFERENCES "aula_planejada"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS deny-by-default (acesso via Prisma/owner e service_role).
ALTER TABLE "plano_aula" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "aula_planejada" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "aula_material" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "atividade_avaliativa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "nota_atividade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "diario_classe" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ocorrencia" ENABLE ROW LEVEL SECURITY;
