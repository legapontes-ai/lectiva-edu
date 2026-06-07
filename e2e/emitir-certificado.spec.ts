import { test, expect } from "@playwright/test";

/**
 * ESQUELETO — Emissão de certificado no painel.
 *
 * ATENÇÃO: este teste MUTA DADOS (cria um certificado com código de
 * autenticação). Deve rodar SOMENTE contra um banco de TESTE com seed conhecido
 * (aluno aprovado/concluído em um curso e um modelo de certificado ativo).
 * Por isso está marcado com test.fixme() — não executa até ser implementado e
 * apontado para um ambiente descartável.
 *
 * Pré-requisitos:
 * - Login como administrador (E2E_ADMIN_EMAIL / E2E_ADMIN_SENHA).
 * - Permissão certificados.gerenciar.
 * - Modelo de certificado cadastrado (/painel/certificados/modelos).
 * - Aluno elegível (curso concluído/aprovado).
 *
 * Passo a passo sugerido:
 *  1. Autenticar via /login (reaproveitar helper de login).
 *  2. Acessar /painel/certificados.
 *  3. Acionar a emissão de um novo certificado (selecionar aluno, curso, tipo
 *     e modelo).
 *  4. Confirmar a emissão.
 *  5. Capturar o código de autenticação gerado.
 *  6. Abrir /validar-certificado?codigo=<codigo> e assertar
 *     "Certificado válido" + dados do aluno/curso.
 *  7. (Opcional) Verificar registro em /painel/auditoria.
 */
test.fixme("emitir certificado e validá-lo publicamente", async ({ page }) => {
  // TODO: implementar contra banco de teste.
  await page.goto("/painel/certificados");
  expect(true).toBe(true);
});
