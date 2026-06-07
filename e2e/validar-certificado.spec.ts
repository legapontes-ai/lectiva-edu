import { test, expect } from "@playwright/test";

/**
 * Fluxo crítico: validação pública de certificado.
 *
 * Não muta dados — apenas consulta um código inexistente.
 */
test.describe("Validar certificado", () => {
  test("código inexistente exibe mensagem de não encontrado", async ({ page }) => {
    await page.goto("/validar-certificado");

    await expect(
      page.getByRole("heading", { name: "Validação de certificados" }),
    ).toBeVisible();

    // Código que não deve existir no banco.
    const codigoInexistente = "ZZZZ00INVALIDO";
    await page
      .getByLabel("Código de autenticação")
      .fill(codigoInexistente);
    await page.getByRole("button", { name: "Validar" }).click();

    // A consulta usa GET (?codigo=...); aguarda a navegação.
    await page.waitForURL(/codigo=/, { timeout: 15_000 });

    await expect(
      page.getByText("Certificado não encontrado"),
    ).toBeVisible();
  });
});
