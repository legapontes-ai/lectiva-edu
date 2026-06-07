/**
 * Seed completo do Lectiva Edu.
 *
 * - Cria os usuários no Supabase Auth (service_role) e espelha cada um na
 *   tabela `usuario` pelo MESMO id (uuid).
 * - Popula perfis + permissões, cursos, turmas, módulos, grade publicada,
 *   disciplinas, professores, alunos com matrícula ativa, planos de pagamento
 *   com parcelas, modelos de certificado, comunicados e eventos.
 *
 * Idempotente: usa upsert com IDs fixos e reusa usuários de Auth já existentes.
 * Rodar:  npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import {
  PERFIS,
  PERMISSOES_POR_PERFIL,
  VINCULO_POR_PERFIL,
} from "../src/lib/auth/permissions";
import { retrySupabase } from "../src/lib/resiliencia";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.");
}
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// IDs fixos (idempotência)
// ---------------------------------------------------------------------------
const ID = {
  cursoMba: "c0000000-0000-4000-8000-000000000001",
  cursoLato: "c0000000-0000-4000-8000-000000000002",
  cursoCap: "c0000000-0000-4000-8000-000000000003",
  turmaMba: "70000000-0000-4000-8000-000000000001",
  turmaLato: "70000000-0000-4000-8000-000000000002",
  prof1: "b0000000-0000-4000-8000-000000000001",
  prof2: "b0000000-0000-4000-8000-000000000002",
  aluno1: "a0000000-0000-4000-8000-000000000001",
  aluno2: "a0000000-0000-4000-8000-000000000002",
  aluno3: "a0000000-0000-4000-8000-000000000003",
  modeloConclusao: "d0000000-0000-4000-8000-000000000001",
  modeloParticipacao: "d0000000-0000-4000-8000-000000000002",
  gradeMba: "e0000000-0000-4000-8000-000000000001",
};

type SeedUser = {
  key: string;
  email: string;
  senha: string;
  nome: string;
  perfil: string;
};

const USERS: SeedUser[] = [
  { key: "admin", email: "admin@lectiva.edu", senha: "Admin@2026", nome: "Administrador Geral", perfil: PERFIS.ADMIN },
  { key: "gestor", email: "gestor@lectiva.edu", senha: "Gestor@2026", nome: "Gestor do Sistema", perfil: PERFIS.GESTOR },
  { key: "coord", email: "coordenacao@lectiva.edu", senha: "Coord@2026", nome: "Carla Menezes", perfil: PERFIS.COORDENACAO },
  { key: "secretaria", email: "secretaria@lectiva.edu", senha: "Secret@2026", nome: "Sandra Lima", perfil: PERFIS.SECRETARIA },
  { key: "prof1", email: "professor1@lectiva.edu", senha: "Prof@2026", nome: "Prof. Dr. Ricardo Alves", perfil: PERFIS.PROFESSOR },
  { key: "prof2", email: "professor2@lectiva.edu", senha: "Prof@2026", nome: "Profa. Dra. Helena Souza", perfil: PERFIS.PROFESSOR },
  { key: "aluno1", email: "aluno1@lectiva.edu", senha: "Aluno@2026", nome: "João Pedro Martins", perfil: PERFIS.ALUNO },
  { key: "aluno2", email: "aluno2@lectiva.edu", senha: "Aluno@2026", nome: "Mariana Costa", perfil: PERFIS.ALUNO },
  { key: "aluno3", email: "aluno3@lectiva.edu", senha: "Aluno@2026", nome: "Bruno Ferreira", perfil: PERFIS.ALUNO },
];

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------
async function carregarUsuariosAuth(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let page = 1;
  // paginação simples (suficiente para o volume do seed)
  for (;;) {
    const { data, error } = await retrySupabase(
      () => supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 }),
      { rotulo: "seed.listUsers" },
    );
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users) if (u.email) map.set(u.email, u.id);
    if (data.users.length < 1000) break;
    page++;
  }
  return map;
}

async function ensureAuthUser(
  byEmail: Map<string, string>,
  u: SeedUser,
): Promise<string> {
  const existing = byEmail.get(u.email);
  if (existing) {
    await retrySupabase(
      () =>
        supabaseAdmin.auth.admin.updateUserById(existing, {
          password: u.senha,
          email_confirm: true,
          user_metadata: { nome: u.nome },
        }),
      { rotulo: "seed.updateUserById" },
    );
    return existing;
  }
  const { data, error } = await retrySupabase(
    () =>
      supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.senha,
        email_confirm: true,
        user_metadata: { nome: u.nome },
      }),
    { rotulo: "seed.createUser" },
  );
  if (error || !data.user) throw new Error(`createUser ${u.email}: ${error?.message}`);
  byEmail.set(u.email, data.user.id);
  return data.user.id;
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
async function main() {
  console.log("→ Perfis e permissões…");
  const perfilIdPorNome = new Map<string, string>();
  for (const nome of Object.values(PERFIS)) {
    const perfil = await prisma.perfil.upsert({
      where: { nome },
      update: {},
      create: { nome, descricao: `Perfil ${nome}` },
    });
    perfilIdPorNome.set(nome, perfil.id);
    const permissoes = PERMISSOES_POR_PERFIL[nome] ?? [];
    await prisma.perfilPermissao.deleteMany({ where: { idPerfil: perfil.id } });
    if (permissoes.length) {
      await prisma.perfilPermissao.createMany({
        data: permissoes.map((permissao) => ({ idPerfil: perfil.id, permissao })),
        skipDuplicates: true,
      });
    }
  }

  console.log("→ Usuários (Auth + tabela usuario)…");
  const byEmail = await carregarUsuariosAuth();
  const userIdPorKey = new Map<string, string>();
  for (const u of USERS) {
    const authId = await ensureAuthUser(byEmail, u);
    userIdPorKey.set(u.key, authId);
    const idPerfil = perfilIdPorNome.get(u.perfil)!;
    await prisma.usuario.upsert({
      where: { id: authId },
      update: {
        nome: u.nome,
        email: u.email,
        login: u.email,
        idPerfil,
        vinculo: VINCULO_POR_PERFIL[u.perfil],
        situacao: "Ativo",
      },
      create: {
        id: authId,
        nome: u.nome,
        email: u.email,
        login: u.email,
        idPerfil,
        vinculo: VINCULO_POR_PERFIL[u.perfil],
        situacao: "Ativo",
      },
    });
  }

  const idCoord = userIdPorKey.get("coord")!;

  console.log("→ Cursos…");
  await prisma.curso.upsert({
    where: { id: ID.cursoMba },
    update: {},
    create: {
      id: ID.cursoMba,
      nome: "MBA em Gestão Estratégica de Negócios",
      tipo: "MBA",
      areaConhecimento: "Administração e Negócios",
      cargaHoraria: 432,
      duracaoMeses: 18,
      valorInvestimento: 18900.0,
      formaPagamento: "À vista ou em até 18x",
      objetivos:
        "Formar líderes capazes de tomar decisões estratégicas, integrando finanças, marketing, pessoas e tecnologia para a competitividade organizacional.",
      modalidade: "Hibrida",
      metodologia:
        "Aulas expositivas, estudos de caso, projetos aplicados e mentorias com executivos do mercado.",
      requisitosConclusao:
        "Frequência mínima de 75%, aprovação em todas as disciplinas (média ≥ 7,0) e entrega do trabalho de conclusão.",
      idCoordenador: idCoord,
      situacao: "Ativo",
    },
  });
  await prisma.curso.upsert({
    where: { id: ID.cursoLato },
    update: {},
    create: {
      id: ID.cursoLato,
      nome: "Pós-Graduação em Direito e Processo do Trabalho",
      tipo: "PosLatoSensu",
      areaConhecimento: "Ciências Jurídicas",
      cargaHoraria: 360,
      duracaoMeses: 12,
      valorInvestimento: 12600.0,
      formaPagamento: "À vista ou em até 12x",
      objetivos:
        "Aprofundar conhecimentos em Direito do Trabalho material e processual, capacitando para a advocacia especializada e a magistratura.",
      modalidade: "Online",
      metodologia: "Encontros síncronos semanais, materiais assíncronos e seminários jurídicos.",
      requisitosConclusao: "Frequência mínima de 75% e aprovação (média ≥ 7,0) em todas as disciplinas.",
      idCoordenador: idCoord,
      situacao: "Ativo",
    },
  });
  await prisma.curso.upsert({
    where: { id: ID.cursoCap },
    update: {},
    create: {
      id: ID.cursoCap,
      nome: "Capacitação em Gestão de Projetos com Metodologias Ágeis",
      tipo: "Capacitacao",
      areaConhecimento: "Tecnologia e Gestão",
      cargaHoraria: 80,
      duracaoMeses: 3,
      valorInvestimento: 2400.0,
      formaPagamento: "À vista ou em até 4x",
      objetivos: "Habilitar profissionais a conduzir projetos com Scrum, Kanban e frameworks híbridos.",
      modalidade: "EAD",
      metodologia: "Conteúdo em vídeo, laboratórios práticos e simulações de sprint.",
      requisitosConclusao: "Conclusão de 80% das atividades e aprovação na avaliação final.",
      idCoordenador: idCoord,
      situacao: "EmFormacaoDeTurma",
    },
  });

  console.log("→ Turmas…");
  await prisma.turma.upsert({
    where: { id: ID.turmaMba },
    update: {},
    create: {
      id: ID.turmaMba,
      idCurso: ID.cursoMba,
      nome: "MBA Gestão — Turma 2026.1",
      anoPeriodo: "2026.1",
      dataInicio: new Date("2026-03-02"),
      dataTermino: new Date("2027-08-31"),
      idCoordenador: idCoord,
      situacao: "EmAndamento",
    },
  });
  await prisma.turma.upsert({
    where: { id: ID.turmaLato },
    update: {},
    create: {
      id: ID.turmaLato,
      idCurso: ID.cursoLato,
      nome: "Direito do Trabalho — Turma 2026.1",
      anoPeriodo: "2026.1",
      dataInicio: new Date("2026-04-06"),
      dataTermino: new Date("2027-03-31"),
      idCoordenador: idCoord,
      situacao: "EmAndamento",
    },
  });

  console.log("→ Professores…");
  await prisma.professor.upsert({
    where: { id: ID.prof1 },
    update: {},
    create: {
      id: ID.prof1,
      idUsuario: userIdPorKey.get("prof1")!,
      nome: "Prof. Dr. Ricardo Alves",
      cpf: "111.111.111-11",
      email: "professor1@lectiva.edu",
      telefone: "(19) 99999-0001",
      titulacao: "Doutor em Administração",
      areaAtuacao: "Estratégia e Finanças Corporativas",
      miniCurriculo:
        "Doutor em Administração pela FGV, com 15 anos de experiência executiva em grandes corporações e consultoria estratégica.",
      lattes: "http://lattes.cnpq.br/0000000000000001",
      situacao: "Ativo",
    },
  });
  await prisma.professor.upsert({
    where: { id: ID.prof2 },
    update: {},
    create: {
      id: ID.prof2,
      idUsuario: userIdPorKey.get("prof2")!,
      nome: "Profa. Dra. Helena Souza",
      cpf: "222.222.222-22",
      email: "professor2@lectiva.edu",
      telefone: "(19) 99999-0002",
      titulacao: "Doutora em Direito",
      areaAtuacao: "Direito do Trabalho e Processo do Trabalho",
      miniCurriculo:
        "Doutora em Direito pela USP, advogada trabalhista e parecerista, autora de obras sobre reforma trabalhista.",
      lattes: "http://lattes.cnpq.br/0000000000000002",
      situacao: "Ativo",
    },
  });

  console.log("→ Módulos/eixos e disciplinas (MBA)…");
  const modulos = [
    { id: "f0000000-0000-4000-8000-000000000001", nome: "Eixo 1 — Fundamentos da Gestão", ordem: 1, ch: 144 },
    { id: "f0000000-0000-4000-8000-000000000002", nome: "Eixo 2 — Decisões Estratégicas", ordem: 2, ch: 144 },
    { id: "f0000000-0000-4000-8000-000000000003", nome: "Eixo 3 — Liderança e Inovação", ordem: 3, ch: 144 },
  ];
  for (const m of modulos) {
    await prisma.moduloEixo.upsert({
      where: { id: m.id },
      update: {},
      create: { id: m.id, idCurso: ID.cursoMba, nome: m.nome, ordem: m.ordem, cargaHoraria: m.ch },
    });
  }

  const disciplinas = [
    { id: "11110000-0000-4000-8000-000000000001", mod: modulos[0].id, codigo: "MBA101", nome: "Contabilidade e Finanças para Executivos", ch: 48, prof: ID.prof1, periodo: 1 },
    { id: "11110000-0000-4000-8000-000000000002", mod: modulos[0].id, codigo: "MBA102", nome: "Comportamento Organizacional", ch: 48, prof: ID.prof1, periodo: 1 },
    { id: "11110000-0000-4000-8000-000000000003", mod: modulos[0].id, codigo: "MBA103", nome: "Economia e Mercados", ch: 48, prof: ID.prof2, periodo: 1 },
    { id: "11110000-0000-4000-8000-000000000004", mod: modulos[1].id, codigo: "MBA201", nome: "Planejamento Estratégico", ch: 48, prof: ID.prof1, periodo: 2 },
    { id: "11110000-0000-4000-8000-000000000005", mod: modulos[1].id, codigo: "MBA202", nome: "Marketing Estratégico e Digital", ch: 48, prof: ID.prof2, periodo: 2 },
    { id: "11110000-0000-4000-8000-000000000006", mod: modulos[1].id, codigo: "MBA203", nome: "Gestão de Operações e Projetos", ch: 48, prof: ID.prof1, periodo: 2 },
    { id: "11110000-0000-4000-8000-000000000007", mod: modulos[2].id, codigo: "MBA301", nome: "Liderança e Gestão de Pessoas", ch: 48, prof: ID.prof2, periodo: 3 },
    { id: "11110000-0000-4000-8000-000000000008", mod: modulos[2].id, codigo: "MBA302", nome: "Inovação e Transformação Digital", ch: 48, prof: ID.prof1, periodo: 3 },
    { id: "11110000-0000-4000-8000-000000000009", mod: modulos[2].id, codigo: "MBA303", nome: "Trabalho de Conclusão (TCC)", ch: 48, prof: ID.prof2, periodo: 3 },
  ];
  for (const d of disciplinas) {
    await prisma.disciplina.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        idModulo: d.mod,
        codigo: d.codigo,
        nome: d.nome,
        ementa: `Ementa da disciplina ${d.nome}.`,
        objetivos: `Capacitar o aluno nos temas centrais de ${d.nome}.`,
        conteudoProgramatico: "Unidade 1; Unidade 2; Unidade 3; Estudos de caso.",
        cargaHoraria: d.ch,
        idProfessor: d.prof,
        atividadesAvaliativas: "Prova individual (60%) + projeto aplicado (40%).",
        status: d.periodo === 1 ? "EmAndamento" : "Programada",
      },
    });
  }

  console.log("→ Grade curricular publicada (MBA)…");
  const chTotal = disciplinas.reduce((s, d) => s + d.ch, 0);
  await prisma.gradeCurricular.upsert({
    where: { id: ID.gradeMba },
    update: { status: "Publicada", cargaHorariaTotal: chTotal, dataValidacao: new Date("2026-02-10") },
    create: {
      id: ID.gradeMba,
      idCurso: ID.cursoMba,
      versao: 1,
      cargaHorariaTotal: chTotal,
      status: "Publicada",
      dataValidacao: new Date("2026-02-10"),
    },
  });
  await prisma.gradeDisciplina.deleteMany({ where: { idGrade: ID.gradeMba } });
  await prisma.gradeDisciplina.createMany({
    data: disciplinas.map((d, i) => ({
      idGrade: ID.gradeMba,
      idDisciplina: d.id,
      periodo: d.periodo,
      preRequisito: i > 0 && d.periodo > 1 ? disciplinas[0].codigo : null,
    })),
    skipDuplicates: true,
  });

  console.log("→ Consentimentos LGPD + Alunos + Matrículas + Financeiro…");
  const alunosSeed = [
    { key: "aluno1", id: ID.aluno1, cpf: "333.333.333-33", curso: ID.cursoMba, turma: ID.turmaMba, valor: 18900, parcelas: 18, pagas: 3, inadimplente: false, protocolo: "MAT-2026-0001" },
    { key: "aluno2", id: ID.aluno2, cpf: "444.444.444-44", curso: ID.cursoMba, turma: ID.turmaMba, valor: 18900, parcelas: 18, pagas: 1, inadimplente: true, protocolo: "MAT-2026-0002" },
    { key: "aluno3", id: ID.aluno3, cpf: "555.555.555-55", curso: ID.cursoLato, turma: ID.turmaLato, valor: 12600, parcelas: 12, pagas: 2, inadimplente: false, protocolo: "MAT-2026-0003" },
  ];

  for (const a of alunosSeed) {
    const userId = userIdPorKey.get(a.key)!;
    const seedU = USERS.find((u) => u.key === a.key)!;

    // Consentimento (id determinístico derivado do id do aluno)
    const consentimentoId = a.id.replace(/^a0/, "c1");
    await prisma.consentimento.upsert({
      where: { id: consentimentoId },
      update: {},
      create: {
        id: consentimentoId,
        idTitular: userId,
        finalidade:
          "Tratamento de dados pessoais para fins de matrícula, gestão acadêmica, financeira e emissão de certificados.",
        versaoPolitica: "1.0",
        canalColeta: "Formulário de matrícula online",
        situacao: "Ativo",
      },
    });

    await prisma.aluno.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        idUsuario: userId,
        nome: seedU.nome,
        cpf: a.cpf,
        rg: "00.000.000-0",
        dataNascimento: new Date("1995-05-15"),
        email: seedU.email,
        telefone: "(19) 98888-0000",
        endereco: "Rua das Acácias, 100 — Campinas/SP",
        situacaoAcademica: "Ativo",
      },
    });

    const matriculaId = a.id.replace(/^a0/, "a1");
    await prisma.matricula.upsert({
      where: { id: matriculaId },
      update: {},
      create: {
        id: matriculaId,
        protocolo: a.protocolo,
        idAluno: a.id,
        idCurso: a.curso,
        idTurma: a.turma,
        filiacao: "Pai e Mãe",
        nacionalidade: "Brasileira",
        estadoCivil: "Solteiro(a)",
        formacaoGraduacao: "Bacharelado",
        instituicaoAnterior: "Universidade Estadual",
        anoConclusao: 2018,
        contratoAceito: true,
        dataAceite: new Date("2026-02-01"),
        idConsentimento: consentimentoId,
        situacao: "Ativa",
        dataMatricula: new Date("2026-02-01"),
      },
    });

    // Plano de pagamento + parcelas
    const planoId = a.id.replace(/^a0/, "f1");
    const valorParcela = Math.round((a.valor / a.parcelas) * 100) / 100;
    const saldo = Math.round((a.valor - valorParcela * a.pagas) * 100) / 100;
    await prisma.planoPagamento.upsert({
      where: { id: planoId },
      update: {},
      create: {
        id: planoId,
        idMatricula: matriculaId,
        idAluno: a.id,
        idCurso: a.curso,
        valorTotal: a.valor,
        numParcelas: a.parcelas,
        descontos: 0,
        saldoDevedor: saldo,
        situacao: a.inadimplente ? "Inadimplente" : "Adimplente",
      },
    });

    await prisma.parcela.deleteMany({ where: { idPlano: planoId } });
    const parcelas = Array.from({ length: a.parcelas }, (_, i) => {
      const numero = i + 1;
      const vencimento = new Date(2026, 1 + i, 10); // a partir de mar/2026
      const paga = numero <= a.pagas;
      // aluno inadimplente: a primeira não paga está vencida
      const vencida = !paga && a.inadimplente && numero === a.pagas + 1;
      return {
        idPlano: planoId,
        numero,
        valor: valorParcela,
        vencimento,
        dataPagamento: paga ? new Date(2026, 1 + i, 8) : null,
        formaPagamento: paga ? "PIX" : null,
        situacao: paga ? ("Paga" as const) : vencida ? ("Vencida" as const) : ("EmAberto" as const),
      };
    });
    await prisma.parcela.createMany({ data: parcelas });
  }

  console.log("→ Modelos de certificado…");
  await prisma.modeloCertificado.upsert({
    where: { id: ID.modeloConclusao },
    update: {},
    create: {
      id: ID.modeloConclusao,
      nome: "Certificado de Conclusão de Curso",
      tipo: "Conclusao",
      textoPadrao:
        "Certificamos que {{aluno}} concluiu o curso {{curso}}, com carga horária de {{cargaHoraria}} horas, em {{data}}.",
      requisitos:
        "Frequência mínima de 75%, aprovação em todas as disciplinas e regularidade financeira.",
      situacao: "Ativo",
    },
  });
  await prisma.modeloCertificado.upsert({
    where: { id: ID.modeloParticipacao },
    update: {},
    create: {
      id: ID.modeloParticipacao,
      nome: "Certificado de Participação em Evento",
      tipo: "Participacao",
      textoPadrao:
        "Certificamos a participação de {{aluno}} no evento {{curso}}, com carga horária de {{cargaHoraria}} horas.",
      requisitos: "Presença confirmada no evento.",
      situacao: "Ativo",
    },
  });

  console.log("→ Comunicados e eventos…");
  const idAdmin = userIdPorKey.get("admin")!;
  const comunicados = [
    {
      id: "c2000000-0000-4000-8000-000000000001",
      titulo: "Bem-vindos ao semestre 2026.1!",
      conteudo: "Sejam todos bem-vindos. As aulas iniciam conforme o calendário acadêmico. Bons estudos!",
      publicoAlvo: "Todos" as const,
      urgencia: "Normal" as const,
    },
    {
      id: "c2000000-0000-4000-8000-000000000002",
      titulo: "Prazo de regularização financeira",
      conteudo: "Lembramos que a regularidade financeira é requisito para emissão de certificados.",
      publicoAlvo: "Turma" as const,
      urgencia: "Urgente" as const,
      idTurma: ID.turmaMba,
    },
  ];
  for (const c of comunicados) {
    await prisma.comunicado.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        titulo: c.titulo,
        conteudo: c.conteudo,
        publicoAlvo: c.publicoAlvo,
        idTurma: "idTurma" in c ? c.idTurma : null,
        urgencia: c.urgencia,
        idAutor: idAdmin,
        situacao: "Publicado",
      },
    });
  }

  const eventos = [
    {
      id: "ef000000-0000-4000-8000-000000000001",
      titulo: "Aula inaugural — MBA Gestão 2026.1",
      tipo: "Encontro" as const,
      dataInicio: new Date("2026-03-02T19:00:00"),
      dataFim: new Date("2026-03-02T22:00:00"),
      idTurma: ID.turmaMba,
    },
    {
      id: "ef000000-0000-4000-8000-000000000002",
      titulo: "Prova — Contabilidade e Finanças",
      tipo: "Avaliacao" as const,
      dataInicio: new Date("2026-04-20T19:00:00"),
      idTurma: ID.turmaMba,
      idDisciplina: disciplinas[0].id,
    },
  ];
  for (const e of eventos) {
    await prisma.evento.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
        titulo: e.titulo,
        tipo: e.tipo,
        dataInicio: e.dataInicio,
        dataFim: "dataFim" in e ? e.dataFim : null,
        modalidade: "Presencial",
        idTurma: e.idTurma,
        idDisciplina: "idDisciplina" in e ? e.idDisciplina : null,
        notificar: true,
      },
    });
  }

  console.log("→ Log de auditoria (seed)…");
  await prisma.logAuditoria.create({
    data: {
      idUsuario: idAdmin,
      perfil: PERFIS.ADMIN,
      acao: "SEED_EXECUTADO",
      modulo: "Sistema",
      resultado: "Sucesso",
    },
  });

  console.log("\n✅ Seed concluído com sucesso.\n");
  console.table(USERS.map((u) => ({ perfil: u.perfil, email: u.email, senha: u.senha })));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erro no seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
