-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Vinculo" AS ENUM ('Aluno', 'Professor', 'Coordenacao', 'Secretaria', 'Admin');

-- CreateEnum
CREATE TYPE "SituacaoUsuario" AS ENUM ('Ativo', 'Inativo', 'Bloqueado');

-- CreateEnum
CREATE TYPE "TipoCurso" AS ENUM ('MBA', 'PosLatoSensu', 'Capacitacao', 'Extensao', 'Livre');

-- CreateEnum
CREATE TYPE "ModalidadeCurso" AS ENUM ('Presencial', 'Hibrida', 'Online', 'EAD');

-- CreateEnum
CREATE TYPE "SituacaoCurso" AS ENUM ('Ativo', 'EmFormacaoDeTurma', 'Encerrado');

-- CreateEnum
CREATE TYPE "SituacaoTurma" AS ENUM ('EmFormacao', 'EmAndamento', 'Concluida');

-- CreateEnum
CREATE TYPE "StatusGrade" AS ENUM ('EmElaboracao', 'Validada', 'Publicada');

-- CreateEnum
CREATE TYPE "SituacaoProfessor" AS ENUM ('Ativo', 'Inativo');

-- CreateEnum
CREATE TYPE "SituacaoAcademica" AS ENUM ('Ativo', 'Concluinte', 'Inativo');

-- CreateEnum
CREATE TYPE "SituacaoMatricula" AS ENUM ('PreMatricula', 'Ativa', 'Trancada', 'Cancelada', 'Concluida');

-- CreateEnum
CREATE TYPE "StatusDisciplina" AS ENUM ('Programada', 'EmAndamento', 'Concluida');

-- CreateEnum
CREATE TYPE "TipoMaterial" AS ENUM ('Livro', 'Artigo', 'Apostila', 'Video', 'Link');

-- CreateEnum
CREATE TYPE "Bibliografia" AS ENUM ('Basica', 'Complementar');

-- CreateEnum
CREATE TYPE "NivelAcesso" AS ENUM ('Publico', 'Restrito');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('Aula', 'Avaliacao', 'Encontro', 'Palestra', 'Recesso', 'Prazo', 'Encerramento');

-- CreateEnum
CREATE TYPE "ModalidadeEvento" AS ENUM ('Presencial', 'Online');

-- CreateEnum
CREATE TYPE "PublicoAlvo" AS ENUM ('Todos', 'Turma', 'Professores', 'Secretaria', 'Coordenacao');

-- CreateEnum
CREATE TYPE "Urgencia" AS ENUM ('Normal', 'Urgente');

-- CreateEnum
CREATE TYPE "SituacaoComunicado" AS ENUM ('Publicado', 'Arquivado');

-- CreateEnum
CREATE TYPE "SituacaoFrequencia" AS ENUM ('Presente', 'Ausente', 'Justificado');

-- CreateEnum
CREATE TYPE "TipoEncontro" AS ENUM ('Presencial', 'Online');

-- CreateEnum
CREATE TYPE "TipoAvaliacao" AS ENUM ('Curso', 'Disciplina', 'Professor');

-- CreateEnum
CREATE TYPE "FormaColeta" AS ENUM ('Identificada', 'Anonima');

-- CreateEnum
CREATE TYPE "SituacaoAvaliacao" AS ENUM ('Aprovado', 'Reprovado', 'Recuperacao');

-- CreateEnum
CREATE TYPE "TipoCertificado" AS ENUM ('Conclusao', 'Modulo', 'Disciplina', 'Evento', 'Participacao');

-- CreateEnum
CREATE TYPE "SituacaoModeloCertificado" AS ENUM ('Ativo', 'Inativo');

-- CreateEnum
CREATE TYPE "SituacaoCertificado" AS ENUM ('Emitido', 'Cancelado', 'Reemitido');

-- CreateEnum
CREATE TYPE "SituacaoPlano" AS ENUM ('Adimplente', 'Inadimplente');

-- CreateEnum
CREATE TYPE "SituacaoParcela" AS ENUM ('Paga', 'EmAberto', 'Vencida');

-- CreateEnum
CREATE TYPE "TipoMensagem" AS ENUM ('Mensagem', 'Duvida', 'Solicitacao', 'Requerimento');

-- CreateEnum
CREATE TYPE "StatusMensagem" AS ENUM ('Aberta', 'EmAndamento', 'Respondida', 'Encerrada');

-- CreateEnum
CREATE TYPE "SituacaoConsentimento" AS ENUM ('Ativo', 'Revogado');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "senha_hash" TEXT,
    "email" TEXT NOT NULL,
    "id_perfil" UUID NOT NULL,
    "vinculo" "Vinculo" NOT NULL,
    "situacao" "SituacaoUsuario" NOT NULL DEFAULT 'Ativo',
    "ultimo_acesso" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_permissao" (
    "id_perfil" UUID NOT NULL,
    "permissao" TEXT NOT NULL,

    CONSTRAINT "perfil_permissao_pkey" PRIMARY KEY ("id_perfil","permissao")
);

-- CreateTable
CREATE TABLE "curso" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoCurso" NOT NULL,
    "area_conhecimento" TEXT,
    "carga_horaria" INTEGER NOT NULL,
    "duracao_meses" INTEGER,
    "valor_investimento" DECIMAL(10,2),
    "forma_pagamento" TEXT,
    "objetivos" TEXT,
    "modalidade" "ModalidadeCurso" NOT NULL,
    "metodologia" TEXT,
    "requisitos_conclusao" TEXT,
    "id_coordenador" UUID,
    "situacao" "SituacaoCurso" NOT NULL DEFAULT 'Ativo',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma" (
    "id" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ano_periodo" TEXT NOT NULL,
    "data_inicio" DATE,
    "data_termino" DATE,
    "id_coordenador" UUID,
    "situacao" "SituacaoTurma" NOT NULL DEFAULT 'EmFormacao',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modulo_eixo" (
    "id" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 1,
    "carga_horaria" INTEGER,
    "descricao" TEXT,

    CONSTRAINT "modulo_eixo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_curricular" (
    "id" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "carga_horaria_total" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusGrade" NOT NULL DEFAULT 'EmElaboracao',
    "data_validacao" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_curricular_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_disciplina" (
    "id_grade" UUID NOT NULL,
    "id_disciplina" UUID NOT NULL,
    "periodo" INTEGER,
    "pre_requisito" TEXT,

    CONSTRAINT "grade_disciplina_pkey" PRIMARY KEY ("id_grade","id_disciplina")
);

-- CreateTable
CREATE TABLE "professor" (
    "id" UUID NOT NULL,
    "id_usuario" UUID,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "titulacao" TEXT,
    "area_atuacao" TEXT,
    "mini_curriculo" TEXT,
    "foto_url" TEXT,
    "lattes" TEXT,
    "situacao" "SituacaoProfessor" NOT NULL DEFAULT 'Ativo',

    CONSTRAINT "professor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aluno" (
    "id" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "data_nascimento" DATE,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "situacao_academica" "SituacaoAcademica" NOT NULL DEFAULT 'Ativo',

    CONSTRAINT "aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matricula" (
    "id" UUID NOT NULL,
    "protocolo" TEXT NOT NULL,
    "id_aluno" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "id_turma" UUID,
    "filiacao" TEXT,
    "nacionalidade" TEXT,
    "estado_civil" TEXT,
    "formacao_graduacao" TEXT,
    "instituicao_anterior" TEXT,
    "ano_conclusao" INTEGER,
    "numero_diploma" TEXT,
    "documentos_anexos" JSONB,
    "contrato_aceito" BOOLEAN NOT NULL DEFAULT false,
    "data_aceite" TIMESTAMP(3),
    "id_consentimento" UUID,
    "situacao" "SituacaoMatricula" NOT NULL DEFAULT 'PreMatricula',
    "data_matricula" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplina" (
    "id" UUID NOT NULL,
    "id_modulo" UUID,
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "ementa" TEXT,
    "objetivos" TEXT,
    "conteudo_programatico" TEXT,
    "carga_horaria" INTEGER NOT NULL,
    "id_professor" UUID,
    "atividades_avaliativas" TEXT,
    "datas_importantes" TEXT,
    "status" "StatusDisciplina" NOT NULL DEFAULT 'Programada',

    CONSTRAINT "disciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_biblioteca" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoMaterial" NOT NULL,
    "autor" TEXT,
    "categoria" TEXT,
    "id_disciplina" UUID,
    "arquivo_url" TEXT,
    "bibliografia" "Bibliografia",
    "nivel_acesso" "NivelAcesso" NOT NULL DEFAULT 'Restrito',
    "data_inclusao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_biblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3),
    "modalidade" "ModalidadeEvento" NOT NULL DEFAULT 'Presencial',
    "id_turma" UUID,
    "id_disciplina" UUID,
    "descricao" TEXT,
    "notificar" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicado" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "publico_alvo" "PublicoAlvo" NOT NULL DEFAULT 'Todos',
    "id_turma" UUID,
    "urgencia" "Urgencia" NOT NULL DEFAULT 'Normal',
    "data_publicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_autor" UUID NOT NULL,
    "anexos" JSONB,
    "situacao" "SituacaoComunicado" NOT NULL DEFAULT 'Publicado',

    CONSTRAINT "comunicado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicado_leitura" (
    "id_comunicado" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "data_leitura" TIMESTAMP(3),

    CONSTRAINT "comunicado_leitura_pkey" PRIMARY KEY ("id_comunicado","id_usuario")
);

-- CreateTable
CREATE TABLE "frequencia" (
    "id" UUID NOT NULL,
    "id_aluno" UUID NOT NULL,
    "id_disciplina" UUID NOT NULL,
    "id_turma" UUID,
    "data_aula" DATE NOT NULL,
    "tipo_encontro" "TipoEncontro" NOT NULL DEFAULT 'Presencial',
    "situacao" "SituacaoFrequencia" NOT NULL DEFAULT 'Presente',
    "justificativa" TEXT,
    "percentual_acumulado" DECIMAL(5,2),

    CONSTRAINT "frequencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacao" (
    "id" UUID NOT NULL,
    "id_aluno" UUID,
    "id_disciplina" UUID,
    "id_turma" UUID,
    "id_professor" UUID,
    "tipo" "TipoAvaliacao" NOT NULL,
    "data_aplicacao" TIMESTAMP(3),
    "nota" DECIMAL(4,2),
    "respostas_questionario" JSONB,
    "forma_coleta" "FormaColeta" NOT NULL DEFAULT 'Identificada',
    "percentual_frequencia" DECIMAL(5,2),
    "situacao" "SituacaoAvaliacao",

    CONSTRAINT "avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelo_certificado" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoCertificado" NOT NULL,
    "layout" TEXT,
    "texto_padrao" TEXT,
    "requisitos" TEXT,
    "situacao" "SituacaoModeloCertificado" NOT NULL DEFAULT 'Ativo',

    CONSTRAINT "modelo_certificado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificado" (
    "id" UUID NOT NULL,
    "id_aluno" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "id_modelo" UUID,
    "carga_horaria" INTEGER,
    "data_emissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoCertificado" NOT NULL,
    "codigo_autenticacao" TEXT NOT NULL,
    "arquivo_pdf" TEXT,
    "situacao" "SituacaoCertificado" NOT NULL DEFAULT 'Emitido',

    CONSTRAINT "certificado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano_pagamento" (
    "id" UUID NOT NULL,
    "id_matricula" UUID NOT NULL,
    "id_aluno" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "num_parcelas" INTEGER NOT NULL DEFAULT 1,
    "descontos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldo_devedor" DECIMAL(10,2) NOT NULL,
    "situacao" "SituacaoPlano" NOT NULL DEFAULT 'Adimplente',

    CONSTRAINT "plano_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcela" (
    "id" UUID NOT NULL,
    "id_plano" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "vencimento" DATE NOT NULL,
    "data_pagamento" TIMESTAMP(3),
    "forma_pagamento" TEXT,
    "comprovante" TEXT,
    "situacao" "SituacaoParcela" NOT NULL DEFAULT 'EmAberto',

    CONSTRAINT "parcela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagem_solicitacao" (
    "id" UUID NOT NULL,
    "id_remetente" UUID NOT NULL,
    "id_destinatario" UUID NOT NULL,
    "id_disciplina" UUID,
    "tipo" "TipoMensagem" NOT NULL DEFAULT 'Mensagem',
    "assunto" TEXT,
    "conteudo" TEXT NOT NULL,
    "data_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resposta" TEXT,
    "status" "StatusMensagem" NOT NULL DEFAULT 'Aberta',

    CONSTRAINT "mensagem_solicitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_auditoria" (
    "id" UUID NOT NULL,
    "id_usuario" UUID,
    "perfil" TEXT,
    "acao" TEXT NOT NULL,
    "modulo" TEXT,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "resultado" TEXT,

    CONSTRAINT "log_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentimento" (
    "id" UUID NOT NULL,
    "id_titular" UUID NOT NULL,
    "finalidade" TEXT NOT NULL,
    "data_consentimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "versao_politica" TEXT NOT NULL,
    "canal_coleta" TEXT,
    "situacao" "SituacaoConsentimento" NOT NULL DEFAULT 'Ativo',
    "data_revogacao" TIMESTAMP(3),

    CONSTRAINT "consentimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_login_key" ON "usuario"("login");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_id_perfil_idx" ON "usuario"("id_perfil");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_nome_key" ON "perfil"("nome");

-- CreateIndex
CREATE INDEX "curso_id_coordenador_idx" ON "curso"("id_coordenador");

-- CreateIndex
CREATE INDEX "turma_id_curso_idx" ON "turma"("id_curso");

-- CreateIndex
CREATE INDEX "modulo_eixo_id_curso_idx" ON "modulo_eixo"("id_curso");

-- CreateIndex
CREATE UNIQUE INDEX "grade_curricular_id_curso_versao_key" ON "grade_curricular"("id_curso", "versao");

-- CreateIndex
CREATE UNIQUE INDEX "professor_id_usuario_key" ON "professor"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "professor_cpf_key" ON "professor"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "aluno_id_usuario_key" ON "aluno"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "aluno_cpf_key" ON "aluno"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "matricula_protocolo_key" ON "matricula"("protocolo");

-- CreateIndex
CREATE INDEX "matricula_id_aluno_idx" ON "matricula"("id_aluno");

-- CreateIndex
CREATE INDEX "matricula_id_curso_idx" ON "matricula"("id_curso");

-- CreateIndex
CREATE INDEX "disciplina_id_modulo_idx" ON "disciplina"("id_modulo");

-- CreateIndex
CREATE INDEX "disciplina_id_professor_idx" ON "disciplina"("id_professor");

-- CreateIndex
CREATE INDEX "material_biblioteca_id_disciplina_idx" ON "material_biblioteca"("id_disciplina");

-- CreateIndex
CREATE INDEX "evento_id_turma_idx" ON "evento"("id_turma");

-- CreateIndex
CREATE INDEX "comunicado_id_turma_idx" ON "comunicado"("id_turma");

-- CreateIndex
CREATE INDEX "frequencia_id_aluno_idx" ON "frequencia"("id_aluno");

-- CreateIndex
CREATE INDEX "frequencia_id_disciplina_idx" ON "frequencia"("id_disciplina");

-- CreateIndex
CREATE INDEX "avaliacao_id_aluno_idx" ON "avaliacao"("id_aluno");

-- CreateIndex
CREATE INDEX "avaliacao_id_disciplina_idx" ON "avaliacao"("id_disciplina");

-- CreateIndex
CREATE UNIQUE INDEX "certificado_codigo_autenticacao_key" ON "certificado"("codigo_autenticacao");

-- CreateIndex
CREATE INDEX "certificado_id_aluno_idx" ON "certificado"("id_aluno");

-- CreateIndex
CREATE INDEX "plano_pagamento_id_aluno_idx" ON "plano_pagamento"("id_aluno");

-- CreateIndex
CREATE INDEX "parcela_id_plano_idx" ON "parcela"("id_plano");

-- CreateIndex
CREATE INDEX "mensagem_solicitacao_id_destinatario_idx" ON "mensagem_solicitacao"("id_destinatario");

-- CreateIndex
CREATE INDEX "log_auditoria_id_usuario_idx" ON "log_auditoria"("id_usuario");

-- CreateIndex
CREATE INDEX "log_auditoria_data_hora_idx" ON "log_auditoria"("data_hora");

-- CreateIndex
CREATE INDEX "consentimento_id_titular_idx" ON "consentimento"("id_titular");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_perfil_fkey" FOREIGN KEY ("id_perfil") REFERENCES "perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_permissao" ADD CONSTRAINT "perfil_permissao_id_perfil_fkey" FOREIGN KEY ("id_perfil") REFERENCES "perfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso" ADD CONSTRAINT "curso_id_coordenador_fkey" FOREIGN KEY ("id_coordenador") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma" ADD CONSTRAINT "turma_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma" ADD CONSTRAINT "turma_id_coordenador_fkey" FOREIGN KEY ("id_coordenador") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modulo_eixo" ADD CONSTRAINT "modulo_eixo_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_curricular" ADD CONSTRAINT "grade_curricular_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_disciplina" ADD CONSTRAINT "grade_disciplina_id_grade_fkey" FOREIGN KEY ("id_grade") REFERENCES "grade_curricular"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_disciplina" ADD CONSTRAINT "grade_disciplina_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professor" ADD CONSTRAINT "professor_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aluno" ADD CONSTRAINT "aluno_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matricula" ADD CONSTRAINT "matricula_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matricula" ADD CONSTRAINT "matricula_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matricula" ADD CONSTRAINT "matricula_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matricula" ADD CONSTRAINT "matricula_id_consentimento_fkey" FOREIGN KEY ("id_consentimento") REFERENCES "consentimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplina" ADD CONSTRAINT "disciplina_id_modulo_fkey" FOREIGN KEY ("id_modulo") REFERENCES "modulo_eixo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplina" ADD CONSTRAINT "disciplina_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_biblioteca" ADD CONSTRAINT "material_biblioteca_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicado" ADD CONSTRAINT "comunicado_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicado" ADD CONSTRAINT "comunicado_id_autor_fkey" FOREIGN KEY ("id_autor") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicado_leitura" ADD CONSTRAINT "comunicado_leitura_id_comunicado_fkey" FOREIGN KEY ("id_comunicado") REFERENCES "comunicado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicado_leitura" ADD CONSTRAINT "comunicado_leitura_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencia" ADD CONSTRAINT "frequencia_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencia" ADD CONSTRAINT "frequencia_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencia" ADD CONSTRAINT "frequencia_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificado" ADD CONSTRAINT "certificado_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificado" ADD CONSTRAINT "certificado_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificado" ADD CONSTRAINT "certificado_id_modelo_fkey" FOREIGN KEY ("id_modelo") REFERENCES "modelo_certificado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_pagamento" ADD CONSTRAINT "plano_pagamento_id_matricula_fkey" FOREIGN KEY ("id_matricula") REFERENCES "matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_pagamento" ADD CONSTRAINT "plano_pagamento_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_pagamento" ADD CONSTRAINT "plano_pagamento_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcela" ADD CONSTRAINT "parcela_id_plano_fkey" FOREIGN KEY ("id_plano") REFERENCES "plano_pagamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem_solicitacao" ADD CONSTRAINT "mensagem_solicitacao_id_remetente_fkey" FOREIGN KEY ("id_remetente") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem_solicitacao" ADD CONSTRAINT "mensagem_solicitacao_id_destinatario_fkey" FOREIGN KEY ("id_destinatario") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem_solicitacao" ADD CONSTRAINT "mensagem_solicitacao_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_auditoria" ADD CONSTRAINT "log_auditoria_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimento" ADD CONSTRAINT "consentimento_id_titular_fkey" FOREIGN KEY ("id_titular") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

