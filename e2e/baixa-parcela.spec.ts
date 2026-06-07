import { test, expect } from "@playwright/test";

/**
 * ESQUELETO — Baixa (recebimento) de uma parcela no painel financeiro.
 *
 * ATENÇÃO: este teste MUTA DADOS. Deve rodar SOMENTE contra um banco de TESTE
 * com seed conhecido (um plano financeiro com ao menos uma parcela em aberto).
 * Por isso está marcado com test.fixme() — não executa até ser implementado e
 * apontado para um ambiente descartável.
 *
 * Pré-requisitos:
 * - Login como administrador (E2E_ADMIN_EMAIL / E2E_ADMIN_SENHA).
 * - Permissão financeiro.gerenciar.
 * - Um plano financeiro com parcela "Pendente"/"Atrasada".
 *
 * Passo a passo sugerido:
 *  1. Autenticar via /login (reaproveitar helper de login).
 *  2. Acessar /painel/financeiro e abrir um plano: /painel/financeiro/<idPlano>.
 *  3. Localizar a parcela em aberto e acionar a ação de baixa
 *     (ex.: page.getByRole("button", { name: /receber|dar baixa|baixar/i })).
 *  4. Preencher a data de pagamento / valor recebido no diálogo, se houver.
 *  5. Confirmar e assertar que a situação da parcela mudou para "Pago".
 *  6. (Opcional) Verificar registro em /painel/auditoria.
 */
test.fixme("dar baixa em uma parcela em aberto", async ({ page }) => {
  // TODO: implementar contra banco de teste.
  await page.goto("/painel/financeiro");
  expect(true).toBe(true);
});
