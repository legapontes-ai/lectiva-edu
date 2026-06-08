-- INC-MELH-1 — Índices de performance (aditivos, sem mudança de dados/comportamento).
-- Volume atual pequeno; criados sem CONCURRENTLY (dentro da transação da migração).
CREATE INDEX "professor_situacao_idx" ON "professor"("situacao");
CREATE INDEX "matricula_id_turma_idx" ON "matricula"("id_turma");
CREATE INDEX "matricula_situacao_idx" ON "matricula"("situacao");
CREATE INDEX "frequencia_data_aula_idx" ON "frequencia"("data_aula");
CREATE INDEX "mensagem_solicitacao_id_remetente_idx" ON "mensagem_solicitacao"("id_remetente");
CREATE INDEX "mensagem_solicitacao_status_idx" ON "mensagem_solicitacao"("status");
CREATE INDEX "log_auditoria_acao_idx" ON "log_auditoria"("acao");
CREATE INDEX "log_auditoria_modulo_idx" ON "log_auditoria"("modulo");
CREATE INDEX "consentimento_situacao_idx" ON "consentimento"("situacao");
CREATE INDEX "plano_aula_status_idx" ON "plano_aula"("status");
CREATE INDEX "aula_planejada_data_prevista_idx" ON "aula_planejada"("data_prevista");
CREATE INDEX "nota_atividade_id_atividade_idx" ON "nota_atividade"("id_atividade");
