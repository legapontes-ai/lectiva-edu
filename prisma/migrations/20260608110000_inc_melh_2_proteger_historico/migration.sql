-- INC-MELH-2 (Fase B) — Protege histórico: troca ON DELETE CASCADE por RESTRICT
-- nas FKs ancoradas em Aluno/Usuario. Assim, excluir fisicamente um aluno/usuário
-- com histórico é recusado pelo banco (a aplicação usa soft-delete). Reversível.
ALTER TABLE "aluno" DROP CONSTRAINT "aluno_id_usuario_fkey",
  ADD CONSTRAINT "aluno_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "matricula" DROP CONSTRAINT "matricula_id_aluno_fkey",
  ADD CONSTRAINT "matricula_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "frequencia" DROP CONSTRAINT "frequencia_id_aluno_fkey",
  ADD CONSTRAINT "frequencia_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "certificado" DROP CONSTRAINT "certificado_id_aluno_fkey",
  ADD CONSTRAINT "certificado_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nota_atividade" DROP CONSTRAINT "nota_atividade_id_aluno_fkey",
  ADD CONSTRAINT "nota_atividade_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ocorrencia" DROP CONSTRAINT "ocorrencia_id_aluno_fkey",
  ADD CONSTRAINT "ocorrencia_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "consentimento" DROP CONSTRAINT "consentimento_id_titular_fkey",
  ADD CONSTRAINT "consentimento_id_titular_fkey" FOREIGN KEY ("id_titular") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "comunicado_leitura" DROP CONSTRAINT "comunicado_leitura_id_usuario_fkey",
  ADD CONSTRAINT "comunicado_leitura_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
