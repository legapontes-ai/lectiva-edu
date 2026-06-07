import { describe, it, expect } from "vitest";
import { loginSchema, novaSenhaSchema } from "@/lib/validations/auth";
import {
  matriculaSchema,
  aceiteSchema,
  dadosPessoaisSchema,
} from "@/lib/validations/matricula";
import { cursoSchema } from "@/lib/validations/curso";
import { planoSchema, baixaSchema } from "@/lib/financeiro/schema";

// ---------------------------------------------------------------------------
// auth
// ---------------------------------------------------------------------------
describe("loginSchema", () => {
  it("rejeita e-mail inválido", () => {
    expect(loginSchema.safeParse({ email: "nao-eh-email", senha: "x" }).success).toBe(false);
  });

  it("rejeita senha vazia", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", senha: "" }).success).toBe(false);
  });

  it("aceita credenciais válidas e normaliza o e-mail para minúsculas", () => {
    const r = loginSchema.safeParse({ email: "USER@Exemplo.COM", senha: "segredo" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("user@exemplo.com");
  });
});

describe("novaSenhaSchema", () => {
  it("rejeita senha curta", () => {
    expect(novaSenhaSchema.safeParse({ senha: "a1", confirmar: "a1" }).success).toBe(false);
  });

  it("rejeita senha sem número", () => {
    expect(novaSenhaSchema.safeParse({ senha: "semnumeros", confirmar: "semnumeros" }).success).toBe(false);
  });

  it("rejeita quando a confirmação não coincide", () => {
    expect(novaSenhaSchema.safeParse({ senha: "abcde123", confirmar: "abcde124" }).success).toBe(false);
  });

  it("aceita senha forte e confirmação igual", () => {
    expect(novaSenhaSchema.safeParse({ senha: "abcde123", confirmar: "abcde123" }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// matrícula / aceite / consentimento LGPD
// ---------------------------------------------------------------------------
describe("aceiteSchema", () => {
  it("exige aceite do contrato", () => {
    expect(aceiteSchema.safeParse({ contratoAceito: false, consentimentoLGPD: true }).success).toBe(false);
  });

  it("exige consentimento LGPD", () => {
    expect(aceiteSchema.safeParse({ contratoAceito: true, consentimentoLGPD: false }).success).toBe(false);
  });

  it("aceita quando ambos são true", () => {
    expect(aceiteSchema.safeParse({ contratoAceito: true, consentimentoLGPD: true }).success).toBe(true);
  });
});

const dadosPessoaisValidos = {
  nome: "Maria da Silva",
  email: "maria@exemplo.com",
  cpf: "12345678901",
  dataNascimento: "1990-05-20",
  telefone: "11999998888",
  endereco: "Rua das Flores, 100",
  senha: "abcde123",
};

describe("dadosPessoaisSchema", () => {
  it("aceita dados pessoais completos", () => {
    expect(dadosPessoaisSchema.safeParse(dadosPessoaisValidos).success).toBe(true);
  });

  it("rejeita nome muito curto", () => {
    expect(dadosPessoaisSchema.safeParse({ ...dadosPessoaisValidos, nome: "Ma" }).success).toBe(false);
  });

  it("rejeita senha sem número", () => {
    expect(dadosPessoaisSchema.safeParse({ ...dadosPessoaisValidos, senha: "semnumero" }).success).toBe(false);
  });
});

describe("matriculaSchema", () => {
  it("exige consentimento mesmo com dados pessoais válidos", () => {
    const r = matriculaSchema.safeParse({
      ...dadosPessoaisValidos,
      contratoAceito: true,
      consentimentoLGPD: false,
    });
    expect(r.success).toBe(false);
  });

  it("aceita matrícula completa válida", () => {
    const r = matriculaSchema.safeParse({
      ...dadosPessoaisValidos,
      contratoAceito: true,
      consentimentoLGPD: true,
    });
    expect(r.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// curso
// ---------------------------------------------------------------------------
const cursoValido = {
  nome: "MBA em Gestão",
  tipo: "MBA",
  modalidade: "Online",
  cargaHoraria: 360,
};

describe("cursoSchema", () => {
  it("aceita curso válido e aplica situação padrão 'Ativo'", () => {
    const r = cursoSchema.safeParse(cursoValido);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.situacao).toBe("Ativo");
  });

  it("exige cargaHoraria positiva", () => {
    expect(cursoSchema.safeParse({ ...cursoValido, cargaHoraria: 0 }).success).toBe(false);
    expect(cursoSchema.safeParse({ ...cursoValido, cargaHoraria: -10 }).success).toBe(false);
  });

  it("exige cargaHoraria inteira", () => {
    expect(cursoSchema.safeParse({ ...cursoValido, cargaHoraria: 10.5 }).success).toBe(false);
  });

  it("rejeita tipo fora do enum", () => {
    expect(cursoSchema.safeParse({ ...cursoValido, tipo: "Graduacao" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// financeiro
// ---------------------------------------------------------------------------
const planoValido = {
  idMatricula: "550e8400-e29b-41d4-a716-446655440000",
  valorTotal: 12000,
  numParcelas: 12,
};

describe("planoSchema", () => {
  it("aceita plano válido com defaults (descontos=0, diaVencimento=10)", () => {
    const r = planoSchema.safeParse(planoValido);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.descontos).toBe(0);
      expect(r.data.diaVencimento).toBe(10);
    }
  });

  it("rejeita idMatricula não-UUID", () => {
    expect(planoSchema.safeParse({ ...planoValido, idMatricula: "abc" }).success).toBe(false);
  });

  it("rejeita valorTotal não positivo", () => {
    expect(planoSchema.safeParse({ ...planoValido, valorTotal: 0 }).success).toBe(false);
  });

  it("rejeita número de parcelas fora do intervalo 1..120", () => {
    expect(planoSchema.safeParse({ ...planoValido, numParcelas: 0 }).success).toBe(false);
    expect(planoSchema.safeParse({ ...planoValido, numParcelas: 121 }).success).toBe(false);
  });

  it("rejeita diaVencimento fora de 1..28", () => {
    expect(planoSchema.safeParse({ ...planoValido, diaVencimento: 31 }).success).toBe(false);
  });
});

describe("baixaSchema", () => {
  it("aceita forma de pagamento válida", () => {
    expect(baixaSchema.safeParse({ forma: "Pix" }).success).toBe(true);
  });

  it("rejeita forma de pagamento inexistente", () => {
    expect(baixaSchema.safeParse({ forma: "Cheque" }).success).toBe(false);
  });
});
