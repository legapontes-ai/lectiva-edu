import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração do Playwright para os testes E2E do Lectiva Edu.
 *
 * Variáveis de ambiente reconhecidas (todas opcionais):
 * - E2E_BASE_URL     URL base da aplicação (padrão: http://localhost:3000)
 * - E2E_ADMIN_EMAIL  E-mail do administrador (padrão: admin@lectiva.edu)
 * - E2E_ADMIN_SENHA  Senha do administrador (padrão: Admin@2026)
 *
 * Os specs que mutam dados (baixa de parcela, emissão de certificado) estão
 * marcados com test.fixme()/test.skip() e DEVEM rodar contra um banco de teste.
 */
export default defineConfig({
  testDir: "e2e",
  // Falha o CI caso alguém deixe um test.only commitado.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Execução serial em CI para previsibilidade; paralelo em ambiente local.
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Para subir a aplicação automaticamente antes dos testes, descomente abaixo.
  // Requer build/seed de um banco de TESTE antes de rodar specs que mutam dados.
  // webServer: {
  //   command: "npm run dev",
  //   url: process.env.E2E_BASE_URL || "http://localhost:3000",
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120_000,
  // },
});
