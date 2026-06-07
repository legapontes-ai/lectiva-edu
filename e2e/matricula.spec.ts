import { test, expect } from "@playwright/test";

/**
 * Fluxo crítico: wizard de matrícula pública.
 *
 * NÃO submete o formulário — apenas verifica que a etapa 1 (dados pessoais)
 * é renderizada, evitando criar dados no banco.
 *
 * Opcionalmente, defina E2E_CURSO_ID para pré-selecionar um curso via query.
 */
const CURSO_ID = process.env.E2E_CURSO_ID;

test.describe("Matrícula", () => {
  test("o wizard renderiza a etapa 1 (dados pessoais)", async ({ page }) => {
    const url = CURSO_ID
      ? `/matricula?curso=${encodeURIComponent(CURSO_ID)}`
      : "/matricula";
    await page.goto(url);

    await expect(
      page.getByRole("heading", { name: "Matrícula online" }),
    ).toBeVisible();

    // Caso não haja cursos com inscrições abertas, o wizard não é exibido.
    const semCursos = page.getByText("No momento não há cursos com inscrições abertas.");
    if (await semCursos.isVisible().catch(() => false)) {
      test.skip(true, "Sem cursos com inscrições abertas no ambiente atual.");
    }

    // Indicador de etapas e campos de dados pessoais da etapa 1.
    await expect(page.getByLabel("Etapas da matrícula")).toBeVisible();
    await expect(page.getByLabel("Curso", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Nome completo")).toBeVisible();
    await expect(page.getByLabel("E-mail (será seu login)")).toBeVisible();
    await expect(page.getByLabel("CPF")).toBeVisible();

    // Botão de avanço da etapa 1.
    await expect(page.getByRole("button", { name: "Próximo" })).toBeVisible();

    // Importante: não clicamos em "Concluir matrícula" para não criar dados.
  });
});
