# Lectiva Edu — Documentação Funcional v1.1

> Especificação funcional versionada do Sistema Lectiva Edu, refletindo o estado
> implantado em produção (`lectiva-edu.vercel.app`). Documento vivo: atualizar a
> cada incremento. Última revisão: 2026-06-08.

## 1. Visão geral

Plataforma de gestão acadêmica para instituições de ensino (MBA, pós lato sensu,
capacitação, extensão e cursos livres). Cobre estrutura acadêmica, pessoas,
conteúdo, avaliação, plano de aulas, financeiro, certificação, comunicação,
área do aluno, autocadastro e conformidade/LGPD.

- **Stack:** Next.js 16 (App Router) + Prisma + Supabase (Postgres, Auth, Storage).
- **Acesso a dados:** sempre no servidor, via Prisma (RBAC server-side). A chave
  pública (anon) **não** tem acesso a tabelas (ver §9).
- **Identidade visual:** padrão institucional único (sidebar com gradiente, botões
  pill); a mesma linguagem visual no Painel e na Área do Aluno.

## 2. Perfis e controle de acesso (RBAC)

Seis perfis (enum `Vinculo`), cada um com um conjunto de permissões
(`perfil_permissao`). A checagem é server-side (`requirePermission`); o menu é
filtrado por permissão. Regra: `<modulo>.gerenciar` implica `<modulo>.ver`.

| Perfil | Resumo do acesso |
|---|---|
| **Administrador Geral** | `admin.full` — acesso total |
| **Gestor do Sistema** | Usuários, perfis, autocadastro, parâmetros, conformidade, relatórios, logs |
| **Coordenação Acadêmica** | Estrutura acadêmica, frequência, avaliação, comunicados, conformidade, mensagens |
| **Secretaria Acadêmica** | Alunos, matrículas, turmas, certificados, comunicados, financeiro (ver) |
| **Professor** | Disciplinas (ver), biblioteca, frequência, avaliação, planos de aula, diário, mensagens |
| **Aluno** | Área do Aluno, materiais, certificados (baixar), financeiro (ver), mensagens (enviar) |

## 3. Área do Aluno

Área dedicada (`/aluno`) com **barra lateral** e seções (somente leitura, exceto
o envio de mensagens):

- **Visão geral** — dados cadastrais, cursos/turmas e resumo financeiro.
- **Minhas disciplinas** — disciplinas da grade do curso com situação
  *Cumprida / A cursar*.
- **Frequência** — presença acumulada por disciplina (alerta abaixo da frequência
  mínima do curso).
- **Notas** — avaliações e atividades do plano; e **situação por curso** segundo as
  regras parametrizadas (apto à certificação / pendências por disciplina).
- **Comunicações** — comunicados destinados a *Todos* ou à *Turma* do aluno.
- **Atendimento** — envio de mensagens/dúvidas/solicitações e acompanhamento das
  respostas (ver §7).
- **Financeiro** — planos e parcelas, 2ª via de cobrança.
- **Certificados** — certificados emitidos, com download.

Acesso exige vínculo Aluno e permissão `area_aluno.acessar`. Senha provisória
bloqueia o uso até a troca (ver §6).

## 4. Plano de Aulas

Planejamento e execução por disciplina/turma/professor:

- **Cronograma** parametrizável (Mensal, Bimestral, Semestral, Anual) com data de
  início; aulas planejadas com conteúdo, data prevista e carga horária — incl.
  mais de uma aula por semana.
- **Execução por aula:** *Integral / Parcial / Não dado* (sem métrica percentual —
  contagem); motivo obrigatório quando não integral.
- **Docente da aula:** Titular ou Substituto (com nome do substituto).
- **Diário de classe** (conteúdo ministrado), **ocorrências**, **atividades
  avaliativas** e **notas**, **materiais** por aula.
- **Conformidade:** análise do plano (Pendente/Conforme/Não conforme).

Permissões: `planos.elaborar` (professor), `planos.ver`, `planos.conformidade`.

## 5. Estrutura acadêmica, conteúdo, financeiro e certificação

- **Cursos / Turmas / Disciplinas / Matriz curricular** (grade versionada, CH
  automática).
- **Biblioteca** (materiais com upload), **Calendário**, **Comunicados** segmentados.
- **Frequência** e **Avaliação** com indicadores.
- **Financeiro:** planos de pagamento, parcelas, baixa, inadimplência (gateway via
  adaptador; resiliência a limitações temporárias do provedor).
- **Certificados:** emissão em PDF, código de autenticação, validação pública,
  cancelamento/reemissão. Download é registrado em auditoria. Regras de emissão em §8.

## 6. Autocadastro e senha provisória

- Solicitação pública (`/autocadastro`) com rate-limit por IP; cria conta
  **inativa** pendente de aprovação.
- Aprovação/rejeição pelo Gestor/Admin (`/painel/autocadastros`), com registro e
  motivo; geração de **senha temporária** com validade configurável por perfil
  (Parâmetros).
- **Troca de senha obrigatória no 1º acesso:** enquanto `deveTrocarSenha` for
  verdadeiro, qualquer acesso protegido redireciona para `/trocar-senha`
  (validado em todo acesso, não apenas no login).

## 7. Mensagens / solicitações (aluno ↔ instituição)

- Aluno abre **Mensagem / Dúvida / Solicitação / Requerimento** (disciplina
  opcional) em `/aluno/mensagens` e acompanha status e resposta.
- A mensagem é encaminhada ao coordenador da turma → do curso → ou a um
  Admin/Gestor.
- A equipe (`mensagens.responder`) atende em `/painel/mensagens` (caixa
  compartilhada): responder e encerrar. Estados: Aberta → Em andamento →
  Respondida → Encerrada. Todas as ações são logadas.

## 8. Regras de aprovação e certificação (parametrizáveis por curso)

O **administrador parametriza por curso** (sem cálculo de média automático):

- **Nota mínima de aprovação** (default 7,0)
- **Frequência mínima (%)** (default 75)
- **Fonte da nota:** *Avaliação oficial* ou *Notas do plano de aula*
- **Aprovação exige:** todas as disciplinas da grade **ou** ao menos uma

Na **emissão de certificado**:
1. Regularidade financeira (nenhuma parcela vencida).
2. Aprovação acadêmica conforme as regras do curso: por disciplina da grade,
   a nota (na fonte escolhida) ≥ nota mínima **e** a frequência ≥ frequência
   mínima; respeita a exigência de todas/uma disciplina. Bloqueio traz as
   pendências (ex.: "Disciplina X: frequência 60% < 75%").
3. Fallback: curso sem grade cadastrada usa a regra legada (≥1 avaliação
   "Aprovado").

A **Área do Aluno > Notas** exibe essa situação por disciplina/curso.

## 9. Segurança e LGPD

- **RLS (Row Level Security):** habilitado em **todas** as tabelas do schema
  `public` (deny-by-default, sem políticas permissivas). Privilégios de `anon`/
  `authenticated` revogados; a aplicação acessa como owner via Prisma. A chave
  pública não lê nem escreve em tabelas.
- **Autenticação:** Supabase Auth (e-mail/senha) + MFA TOTP opcional; expiração
  por inatividade; proteção de rotas no servidor.
- **Consentimento (LGPD):** registro de finalidade, **base legal** (Art. 7º;
  default *Consentimento*), versão de política, canal de coleta; revogação/
  reativação rastreadas. Tela `/painel/consentimentos`.
- **Auditoria:** ações sensíveis registradas em `log_auditoria` (usuário, perfil,
  ação, módulo, IP, data/hora), incluindo download de certificado.

## 10. Integrações entre módulos

- Matrícula → Financeiro (planos/parcelas) e Consentimento.
- Frequência + Avaliação/Notas → **Certificação** (via regras do curso, §8).
- Plano de Aulas → Diário, Ocorrências, Atividades/Notas, Materiais.
- Comunicação: Comunicados (broadcast) e Mensagens (bidirecional aluno↔equipe).

## 11. Histórico de incrementos (v1.1+)

| ID | Entrega |
|---|---|
| INC1 | Perfil "Gestor do Sistema" |
| INC2 | Autocadastro (senha temporária, aprovação, expiração, logs) |
| INC3 | Plano de Aulas (cronograma, execução, diário, ocorrências, notas) |
| INC4 | Conformidade |
| v1.2 | Plano de aulas parametrizado (periodicidade, execução Integral/Parcial/Não dado, titular/substituto, >1 aula/semana) |
| INC-SEG-1 | Hardening RLS/LGPD (deny-by-default em todas as tabelas) |
| INC-SEG-2 | Troca de senha provisória forçada em todo acesso |
| INC-ALU-1 | Área do Aluno com barra lateral (disciplinas, frequência, notas, comunicações) |
| INC-MSG-1 | Mensagens/solicitações aluno↔admin |
| INC-MELH-1 | Log de download de certificado + índices de performance |
| INC-ACAD-1 | Regras de aprovação/certificação parametrizáveis por curso |
| INC-LGPD-1 | Base legal do consentimento |

## 12. Itens em aberto / próximos

- **INC-MELH-2** — Cascades/soft-delete para proteger histórico acadêmico
  (exclusão de usuário/aluno hoje depende de cascata): exige redesenho com plano
  e testes dedicados.
