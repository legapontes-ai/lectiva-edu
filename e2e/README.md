# Testes E2E (Playwright)

Testes ponta a ponta dos fluxos críticos do Lectiva Edu.

## Pré-requisitos

```bash
npx playwright install chromium
```

A aplicação precisa estar no ar na `E2E_BASE_URL` (por padrão `http://localhost:3000`).
Em outro terminal: `npm run dev`.

## Executar

```bash
npm run e2e                 # roda todos os specs
npm run e2e -- login        # roda apenas o spec de login
npm run e2e -- --ui         # modo interativo
```

## Variáveis de ambiente

| Variável           | Padrão                    | Uso                                              |
| ------------------ | ------------------------- | ------------------------------------------------ |
| `E2E_BASE_URL`     | `http://localhost:3000`   | URL base da aplicação                            |
| `E2E_ADMIN_EMAIL`  | `admin@lectiva.edu`       | E-mail do administrador (login)                  |
| `E2E_ADMIN_SENHA`  | `Admin@2026`              | Senha do administrador (login)                   |
| `E2E_CURSO_ID`     | —                         | (opcional) pré-seleciona curso em `/matricula`   |

## Specs

| Spec                          | Muta dados? | Status                                   |
| ----------------------------- | ----------- | ---------------------------------------- |
| `login.spec.ts`               | Não         | Ativo                                    |
| `validar-certificado.spec.ts` | Não         | Ativo                                    |
| `matricula.spec.ts`           | Não         | Ativo (para antes de submeter)           |
| `baixa-parcela.spec.ts`       | **Sim**     | `test.fixme()` — esqueleto               |
| `emitir-certificado.spec.ts`  | **Sim**     | `test.fixme()` — esqueleto               |

> Os specs marcados com `test.fixme()` **alteram o banco** (baixa de parcela,
> emissão de certificado). Implemente-os e rode **somente contra um banco de
> teste** com seed conhecido — nunca em produção.
