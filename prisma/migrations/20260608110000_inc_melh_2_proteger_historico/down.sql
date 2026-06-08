-- Reverte INC-MELH-2 (Fase B): volta as FKs para ON DELETE CASCADE.
ALTER TABLE "aluno" DROP CONSTRAINT "aluno_id_usuario_fkey",
  ADD CONSTRAINT "aluno_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "matricula" DROP CONSTRAINT "matricula_id_aluno_fkey",
  ADD CONSTRAINT "matricula_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "frequencia" DROP CONSTRAINT "frequencia_id_aluno_fkey",
  ADD CONSTRAINT "frequencia_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "certificado" DROP CONSTRAINT "certificado_id_aluno_fkey",
  ADD CONSTRAINT "certificado_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "nota_atividade" DROP CONSTRAINT "nota_atividade_id_aluno_fkey",
  ADD CONSTRAINT "nota_atividade_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ocorrencia" DROP CONSTRAINT "ocorrencia_id_aluno_fkey",
  ADD CONSTRAINT "ocorrencia_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consentimento" DROP CONSTRAINT "consentimento_id_titular_fkey",
  ADD CONSTRAINT "consentimento_id_titular_fkey" FOREIGN KEY ("id_titular") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comunicado_leitura" DROP CONSTRAINT "comunicado_leitura_id_usuario_fkey",
  ADD CONSTRAINT "comunicado_leitura_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
