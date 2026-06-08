-- Reverte INC-MELH-1: remove os índices criados.
DROP INDEX "professor_situacao_idx";
DROP INDEX "matricula_id_turma_idx";
DROP INDEX "matricula_situacao_idx";
DROP INDEX "frequencia_data_aula_idx";
DROP INDEX "mensagem_solicitacao_id_remetente_idx";
DROP INDEX "mensagem_solicitacao_status_idx";
DROP INDEX "log_auditoria_acao_idx";
DROP INDEX "log_auditoria_modulo_idx";
DROP INDEX "consentimento_situacao_idx";
DROP INDEX "plano_aula_status_idx";
DROP INDEX "aula_planejada_data_prevista_idx";
DROP INDEX "nota_atividade_id_atividade_idx";
