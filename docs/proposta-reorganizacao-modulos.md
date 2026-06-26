# Proposta — Reorganização dos Módulos do Painel (IA / Navegação) — **v3**

> **Status:** rascunho para aprovação. **Nada foi aplicado ao sistema.**
> v3 adiciona o **módulo Coordenação** e detalha o **Portal do Aluno** (decisões desta rodada).
> Base: `src/lib/painel/nav.ts`, `src/lib/auth/permissions.ts`, rotas `src/app/painel/*` e `src/app/aluno/*`.
> Data: 26/06/2026.

---

## 1. Evolução da proposta

- **v1:** 5 módulos genéricos.
- **v2 (suas decisões A–E):** comunicação/relatórios por teor; Alunos = Portal do Aluno; gestão de alunos → Secretaria.
- **v3 (esta rodada):** **manter e enriquecer o Portal do Aluno** + **novo módulo Coordenação**.

---

## 2. Arquitetura proposta (v3)

### Painel administrativo
| Atalho | Módulos |
|---|---|
| 🏠 **Início** | 📋 Cadastros · 🎓 Acadêmico · 🧭 Coordenação · 🗂️ Secretaria · ⚙️ Configurações |

- **📋 Cadastros** — criar/editar os registros base (CRUD de estrutura).
- **🎓 Acadêmico** — trabalho de ensino do docente (turma/matéria).
- **🧭 Coordenação** — **supervisão acadêmica e qualidade** (acompanhar, validar, consolidar).
- **🗂️ Secretaria** — burocrático/transacional + comunicação geral.
- **⚙️ Configurações** — administração, segurança e LGPD.

### Fora do painel
- **👤 Portal do Aluno** (`/aluno`) — área do próprio aluno (ver seção 5).
- **🌐 Matrícula pública** (`/matricula`) — aberta a qualquer pessoa.

---

## 3. O módulo 🧭 Coordenação (novo)

Princípio: Coordenação não é "entrada de dados" (isso é Cadastros) nem "dar aula" (isso é Acadêmico/docente) — é **acompanhar e decidir sobre a qualidade acadêmica**.

**Composição recomendada:**
| Ferramenta | Origem | Papel da coordenação |
|---|---|---|
| Conformidade | (era Acadêmico) | analisar conformidade dos planos de aula |
| Acompanhamento de planos | compartilhada com Acadêmico | visão geral do andamento dos planos |
| Validação de certificados | parte de Certificados (`certificados.validar`) | aprovar/validar emissão |
| Relatórios do curso (consolidado) | parte de Relatórios | desempenho/indicadores por curso |
| Acompanhamento de turmas/alunos do curso | visão sobre alunos/turmas (`alunos.ver`) | monitorar a vida acadêmica do curso |

> **Planos de aula:** o docente **elabora** (fica em 🎓 Acadêmico); a coordenação **acompanha/analisa conformidade** (fica em 🧭 Coordenação). É a mesma base de dados, vistas por intenção diferente.

### ⚠️ Decisão central (preciso da sua escolha)
Onde fica a **estrutura acadêmica** — Cursos, Turmas, Matriz curricular, Disciplinas, Docentes?

- **Opção 1 (recomendada):** **criar/editar em Cadastros**; **acompanhar em Coordenação**. Mantém "criar" separado de "supervisionar". Cadastros fica reaproveitável por Secretaria/Admin também.
- **Opção 2:** mover a **gestão da estrutura acadêmica para dentro de Coordenação** (Coordenação vira o "centro de comando" do coordenador). Cadastros ficaria só com registros muito básicos. Mais alinhado ao perfil, porém mistura "criar" com "supervisionar".

---

## 4. Mapa completo — cada ferramenta no seu módulo (v3, Opção 1)

| Ferramenta | → Módulo |
|---|---|
| Visão geral | 🏠 Início |
| Cursos · Disciplinas · Matriz curricular · Turmas · Docentes | 📋 Cadastros |
| Planos de aula (elaborar) | 🎓 Acadêmico |
| Frequência · Avaliação | 🎓 Acadêmico |
| Biblioteca · Calendário | 🎓 Acadêmico |
| Comunicados do curso (teor acadêmico) | 🎓 Acadêmico |
| Relatórios da matéria (escopo do professor) | 🎓 Acadêmico |
| Conformidade | 🧭 Coordenação |
| Acompanhamento de planos | 🧭 Coordenação |
| Validação de certificados | 🧭 Coordenação |
| Relatórios do curso (consolidado) | 🧭 Coordenação |
| Acompanhamento de turmas/alunos do curso | 🧭 Coordenação |
| Alunos (gestão/lista) | 🗂️ Secretaria |
| Matrículas · Autocadastros | 🗂️ Secretaria |
| Financeiro | 🗂️ Secretaria |
| Certificados (emissão) | 🗂️ Secretaria |
| Comunicados gerais (institucionais) | 🗂️ Secretaria |
| Mensagens (Atendimento) | 🗂️ Secretaria |
| Relatórios institucionais | 🗂️ Secretaria |
| Usuários · Parâmetros · Consentimentos · Auditoria · Segurança (MFA) | ⚙️ Configurações |
| Meus dados · curso · material · comunicação · meus relatórios | 👤 Portal do Aluno |

---

## 5. 👤 Portal do Aluno (mantido e enriquecido)

O aluno acessa, num portal próprio e leve:

- **Minhas informações** — dados pessoais, situação, matrícula.
- **Meu curso** — disciplinas, matriz/grade, frequência, notas, situação acadêmica.
- **Material** — biblioteca/materiais de apoio do curso.
- **Comunicação (multi-área)** — um canal único onde o aluno fala com **Secretaria**, **Coordenação** e **Docentes**, e **recebe comunicados** dessas áreas:
  - escolhe o destino (Secretaria / Coordenação / Docente da disciplina);
  - os comunicados e respostas vêm das áreas de **Secretaria** e **Acadêmico**, reunidos aqui — o aluno não precisa saber "onde" a informação nasce.
- **Financeiro** — boletos/parcelas, situação.
- **Certificados** — baixar os seus.
- **Meus relatórios** — relatórios com seus dados pessoais (decisão D).

```
👤 PORTAL DO ALUNO
   Início · Meu curso (disciplinas · frequência · notas) · Material
   Comunicação (Secretaria · Coordenação · Docentes) · Financeiro
   Certificados · Meus relatórios
```

> Implementação da "comunicação multi-área": evolui o que já existe (`/aluno/mensagens` roteia para coordenação→curso→admin; `/aluno/comunicacoes` lista comunicados) para deixar o **destino selecionável** e reunir comunicados de Secretaria + Acadêmico na mesma tela.

---

## 6. Mockup do menu (painel administrativo)

```
LECTIVA                         [ ⌘K  Buscar ferramenta ]
──────────────────────────────────────────────────────
🏠 Início
──────────────────────────────────────────────────────
📋 CADASTROS                                          ▾
     Cursos · Disciplinas · Matriz curricular
     Turmas · Docentes
🎓 ACADÊMICO                                          ▸
🧭 COORDENAÇÃO                                        ▸
🗂️ SECRETARIA                                         ▸
⚙️ CONFIGURAÇÕES                                      ▸
```

Secretaria segue com subseções (para não pesar):
```
🗂️ SECRETARIA                                         ▾
   Pessoas & Ingresso   → Alunos · Matrículas · Autocadastros
   Financeiro & Documentos → Financeiro · Certificados
   Comunicação & Relatórios → Comunicados gerais · Mensagens · Relatórios
```

---

## 7. Como fica por perfil (com "esconder grupo vazio")

**Professor:**
```
🏠 Início
📋 CADASTROS  → Disciplinas
🎓 ACADÊMICO  → Planos de aula · Frequência · Avaliação · Biblioteca
                Comunicados do curso · Relatórios da matéria
🗂️ SECRETARIA → Mensagens
```

**Coordenação Acadêmica:**
```
🏠 Início
📋 CADASTROS   → Cursos · Disciplinas · Matriz curricular · Turmas · Docentes
🎓 ACADÊMICO   → Planos · Frequência · Avaliação · Calendário · Comunicados do curso
🧭 COORDENAÇÃO → Conformidade · Acompanhamento de planos · Validação de certificados
                 Relatórios do curso · Acompanhamento de turmas
🗂️ SECRETARIA  → Alunos · Comunicados gerais · Mensagens
⚙️ CONFIG.     → Auditoria
```

**Secretaria Acadêmica:**
```
🏠 Início
📋 CADASTROS  → Cursos · Turmas
🎓 ACADÊMICO  → Calendário
🗂️ SECRETARIA → Alunos · Matrículas · Autocadastros · Financeiro
                Certificados · Comunicados gerais · Mensagens · Relatórios
```

**Gestor do Sistema:**
```
🏠 Início
🧭 COORDENAÇÃO → Conformidade · Acompanhamento de planos
🗂️ SECRETARIA  → Autocadastros · Relatórios
⚙️ CONFIG.     → Usuários · Parâmetros · Auditoria · Segurança (MFA)
```

**Aluno:** ver seção 5. **Administrador Geral:** vê os 5 módulos completos.

---

## 8. O que é "só menu" × o que precisa de incremento

**Só reagrupar (baixo risco):** todos os módulos com as telas atuais, subseções, esconder grupo vazio, atalho Início, novo agrupamento "Coordenação" reusando as telas que já existem (Conformidade, Certificados/validação, Planos).

**Pede incremento:**
- **A) Comunicados por teor** (geral vs curso): mesma tela com filtro `?escopo=` (simples) ou tipo de comunicado (separação real).
- **D) Relatórios por escopo** (institucional / curso-matéria / pessoal): filtrar o relatório pelo contexto/perfil.
- **Portal do Aluno — comunicação multi-área:** destino selecionável + reunir comunicados de Secretaria + Acadêmico.
- **Coordenação:** se algumas vistas (ex.: "Acompanhamento de planos", "Acompanhamento de turmas") não existirem como tela própria, podem começar como **filtros/visões** das telas atuais.

> Sugestão de faseamento: **(1)** reorganização do menu + módulo Coordenação reusando telas atuais → entrega rápida e visível; **(2)** incrementos A/D + comunicação multi-área do aluno.

---

## 9. Impacto técnico e risco

- **Muda:** `nav.ts` (grupos/subseções, módulo Coordenação) + Sidebar (colapsável, esconder vazio). Fase 2: filtros por escopo e canal do aluno.
- **NÃO muda:** páginas, URLs, permissões, schema, backend.
- **Risco:** baixo e reversível no menu; incrementos controlados na fase 2.

---

## 10. Confirmação pendente antes de implementar

1. **Estrutura acadêmica (seção 3):** **Opção 1** (criar em Cadastros, acompanhar em Coordenação) ou **Opção 2** (gestão da estrutura dentro de Coordenação)?
2. **Composição do módulo Coordenação:** a lista da seção 3 cobre o que você espera? Falta algo (ex.: aprovação de algo específico)?
3. **Comunicados (A) e Relatórios (D):** filtro por contexto resolve, ou quer separação real?
4. **Faseamento:** menu+Coordenação primeiro, incrementos depois — ok?
5. **Portal do Aluno:** a composição da seção 5 está completa?

Com seu aval, implemento a fase 1.
