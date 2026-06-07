import { test, expect } from "@playwright/test";

/**
 * Fluxo crítico: autenticação de um usuário administrador.
 *
 * Não muta dados — apenas autentica com credenciais existentes.
 * Configure E2E_ADMIN_EMAIL / E2E_ADMIN_SENHA para o seu ambiente.
 */
const EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@lectiva.edu";
const SENHA = process.env.E2E_ADMIN_SENHA || "Admin@2026";

test.describe("Login", () => {
  test("a página de login renderiza o formulário", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Acessar a plataforma" }),
    ).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Senha", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("administrador entra e chega ao painel", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("E-mail").fill(EMAIL);
    await page.getByLabel("Senha", { exact: true }).fill(SENHA);
    await page.getByRole("button", { name: "Entrar" }).click();

    // A server action redireciona para o painel após autenticar.
    await page.waitForURL(/\/painel(\/|$|\?)/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/painel/);
  });
});
