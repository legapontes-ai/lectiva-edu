# Lectiva Edu

> **Gestão educacional integrada e inteligente.**
> Plataforma de gestão acadêmica para cursos de pós-graduação, MBA, capacitação,
> extensão e cursos livres — apresentação institucional, vida acadêmica,
> certificação, financeiro e gestão administrativa, em conformidade com a LGPD.

[![CI](https://github.com/legapontes-ai/lectiva-edu/actions/workflows/ci.yml/badge.svg)](https://github.com/legapontes-ai/lectiva-edu/actions/workflows/ci.yml)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui (base-ui) + lucide-react |
| Banco | Supabase Postgres (região `sa-east-1`) |
| Auth | Supabase Auth (e-mail/senha) |
| Storage | Supabase Storage (buckets `documentos`, `materiais`, `certificados`) |
| ORM | Prisma (migrations versionadas) |
| Validação / Forms | Zod + React Hook Form |
| PDF | @react-pdf/renderer (certificados) |
| Gráficos | Recharts |
| E-mail | Resend (via adaptador) |
| Pagamento | Adaptador de gateway (impl. `mock` + reais plugáveis) |
| Testes | Vitest (unit) + Playwright (E2E) |
| Deploy | Vercel |

Interface em **pt-BR**, moeda **BRL**, datas **pt-BR**, fuso **America/Sao_Paulo**.

---

## Setup local

```bash
# 1. Dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env.local   # preencha com as credenciais do Supabase/Resend

# 3. Prisma client
npm run prisma:generate

# 4. Aplicar migrations (banco já provisionado no Supabase)
npm run db:deploy

# 5. Seed (perfis, usuários de teste, cursos, turmas, financeiro…)
npm run db:seed

# 6. Rodar
npm run dev      # http://localhost:3000
```

### Scripts úteis

| Script | Ação |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | `prisma generate` + build de produção |
| `npm run lint` / `npm run typecheck` | Qualidade |
| `npm test` | Testes unitários (Vitest) |
| `npm run e2e` | Testes E2E (Playwright) |
| `npm run db:migrate` | Criar/aplicar migration em dev |
| `npm run db:deploy` | Aplicar migrations (prod/CI) |
| `npm run db:seed` | Popular o banco |
| `npm run db:studio` | Prisma Studio |

> Os scripts de banco usam `dotenv -e .env.local` para carregar as credenciais.

---

## Variáveis de ambiente

Ver `.env.example`. Resumo:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — cliente Supabase (browser).
- `SUPABASE_SERVICE_ROLE_KEY` — somente servidor (criação de usuários no Auth, Storage admin). **Nunca** expor no client.
- `DATABASE_URL` — pooler Supavisor porta **6543** (`?pgbouncer=true`), usado em runtime.
- `DIRECT_URL` — pooler porta **5432**, usado pelo Prisma para migrations.
- `RESEND_API_KEY`, `EMAIL_FROM` — e-mail transacional.
- `PAYMENT_PROVIDER` (`mock` | `asaas` | `pagarme` | `stripe`), `PAYMENT_API_KEY` — gateway.
- `NEXT_PUBLIC_APP_URL`, `SESSION_INACTIVITY_MINUTES`, `TZ`.

> Conexões diretas `db.<ref>.supabase.co` são IPv6-only; por isso usamos o **pooler** (`aws-1-sa-east-1.pooler.supabase.com`, usuário `postgres.<ref>`), que aceita IPv4.

---

## Arquitetura

Organização **por feature** com **camadas de serviço** e **adaptadores** para integrações externas (gateway de pagamento, e-mail), permitindo troca sem tocar nas regras de negócio.

```
src/
  app/                  # rotas (App Router) — públicas, área restrita, /api
    api/health/         # health check (app + banco)
  components/
    brand/              # logo e identidade visual
    ui/                 # componentes shadcn/ui
  lib/
    auth/               # permissões/RBAC (checagem sempre no servidor)
    supabase/           # clients browser / server / admin
    prisma.ts           # singleton do Prisma Client
prisma/
  schema.prisma         # 25 tabelas + ENUMs
  migrations/           # migrations versionadas
  seed.ts               # seed completo
scripts/                # utilitários de provisionamento (storage, etc.)
```

### Identidade visual

Tokens da marca centralizados em `src/app/globals.css` (paleta) e fontes em
`src/app/layout.tsx` (Montserrat para títulos, Inter para texto).

| Token | Cor |
|---|---|
| Azul institucional (primária) | `#003B73` |
| Azul profundo (texto/headers) | `#00264A` |
| Azul tecnológico (links/ações) | `#0067B1` |
| Verde validação (sucesso/CTA) | `#43A047` |
| Verde segurança (confirmações) | `#1B7F2A` |
| Fundo claro | `#F7FAFC` |

### Perfis de acesso (RBAC)

Administrador Geral · Coordenação Acadêmica · Professor · Secretaria Acadêmica · Aluno.
A checagem de permissão acontece **sempre no servidor** (`src/lib/auth/`).

---

## Modelo de dados (25 tabelas)

```
SEGURANÇA      Usuario · Perfil · PerfilPermissao
ESTRUTURA      Curso · Turma · ModuloEixo · GradeCurricular · GradeDisciplina
PESSOAS        Professor · Aluno · Matricula
CONTEÚDO       Disciplina · MaterialBiblioteca
COMUNICAÇÃO    Evento · Comunicado · ComunicadoLeitura
AVALIAÇÃO      Frequencia · Avaliacao
CERTIFICADOS   ModeloCertificado · Certificado
FINANCEIRO     PlanoPagamento · Parcela
ATEND./LGPD    MensagemSolicitacao · LogAuditoria · Consentimento
```

`Usuario.id` espelha `auth.users.id` (mesmo uuid). O diagrama completo está em
`prisma/schema.prisma`.

---

## Usuários de teste (após o seed)

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador Geral | `admin@lectiva.edu` | `Admin@2026` |
| Coordenação Acadêmica | `coordenacao@lectiva.edu` | `Coord@2026` |
| Secretaria Acadêmica | `secretaria@lectiva.edu` | `Secret@2026` |
| Professor | `professor1@lectiva.edu` | `Prof@2026` |
| Professor | `professor2@lectiva.edu` | `Prof@2026` |
| Aluno | `aluno1@lectiva.edu` | `Aluno@2026` |
| Aluno | `aluno2@lectiva.edu` | `Aluno@2026` |
| Aluno | `aluno3@lectiva.edu` | `Aluno@2026` |

> Credenciais apenas para ambiente de testes.

---

## Deploy (Vercel)

```bash
vercel link                       # projeto "lectiva-edu"
# configurar as env vars (Production + Preview):
#   DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL,
#   NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#   RESEND_API_KEY, EMAIL_FROM, PAYMENT_PROVIDER, NEXT_PUBLIC_APP_URL, TZ
npm run db:deploy                 # migrations no banco de produção
vercel --prod                     # publicar
```

Backups: habilitar Point-in-Time Recovery / backups diários no painel do Supabase.

---

## Conformidade LGPD — checklist

- [x] Registro de **consentimento** por titular (`Consentimento`) com finalidade, versão da política e canal de coleta.
- [x] Revogação/reativação de consentimento (painel LGPD, `lgpd.gerenciar`).
- [x] Política de privacidade e termo de uso publicados (`/politica-de-privacidade`, `/termos-de-uso`).
- [x] **MFA (TOTP)** disponível para as contas (recomendado a administradores) em `/painel/seguranca`.
- [x] **Trilha de auditoria** de ações críticas (`LogAuditoria`), com visualização no painel.
- [x] Segredos apenas em variáveis de ambiente (`.env` fora do versionamento; `.env.example` versionado).
- [x] Controle de acesso a documentos no Storage (buckets **privados** + **URLs assinadas** em biblioteca/certificados).
- [x] Minimização: dados sensíveis acessíveis somente aos perfis autorizados (RBAC server-side).
- [x] Cabeçalhos de segurança (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

> O checklist evolui a cada fase; itens marcados já estão implementados na base.

---

## Testes

```bash
npm test          # Vitest (unit) — 61 testes (RBAC, gateway, formatação, validações Zod)
npm run e2e       # Playwright (E2E) — requer: npx playwright install chromium
```

E2E (Playwright) cobre os fluxos críticos em `e2e/`: **login**, **validação de certificado** e
**matrícula** (ativos); **baixa de parcela** e **emissão de certificado** estão como esqueleto
(`test.fixme`, mutam dados — rodar contra banco de teste). Veja `e2e/README.md`.

---

## Roadmap por fases — todas concluídas ✅

- **Fase 0 — Setup** ✅ scaffolding, tema/tokens, Prisma+Supabase, migration+seed, CI, deploy.
- **Fase 1 — Núcleo** ✅ Segurança/Permissões (auth, sessão, MFA), LGPD/Logs, cadastros base, painel admin.
- **Fase 2 — Ingresso** ✅ Home, Cursos, Corpo Docente, Matrícula, Área do Aluno.
- **Fase 3 — Acadêmico** ✅ Disciplinas, Grade, Biblioteca, Calendário, Comunicados, Avaliação/Frequência.
- **Fase 4 — Financeiro & Certificação** ✅ Pagamentos (gateway adapter), certificados em PDF + validação pública.
- **Fase 5 — Gestão & qualidade** ✅ Dashboards, relatórios, testes (Vitest+Playwright), hardening de segurança.
