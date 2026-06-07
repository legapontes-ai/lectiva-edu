import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PoliticaPage() {
  return (
    <LegalShell titulo="Política de Privacidade" atualizadoEm="07/06/2026">
      <p>
        Esta Política descreve como a <strong>Lectiva Edu</strong> trata dados pessoais de alunos,
        docentes e colaboradores, em conformidade com a Lei nº 13.709/2018 (LGPD).
      </p>

      <h2>1. Dados que tratamos</h2>
      <ul>
        <li>Cadastrais: nome, CPF, RG, data de nascimento, endereço, e-mail e telefone.</li>
        <li>Acadêmicos: matrícula, disciplinas, frequência, notas e certificados.</li>
        <li>Financeiros: planos de pagamento, parcelas e comprovantes.</li>
        <li>De acesso: registros de login e trilha de auditoria das ações realizadas.</li>
      </ul>

      <h2>2. Finalidades</h2>
      <p>
        Os dados são utilizados para gestão acadêmica, emissão de certificados, gestão financeira,
        comunicação institucional e cumprimento de obrigações legais e regulatórias.
      </p>

      <h2>3. Base legal e consentimento</h2>
      <p>
        O tratamento se fundamenta na execução de contrato, no cumprimento de obrigação legal e no
        consentimento, registrado no momento da matrícula. O titular pode revogar o consentimento a
        qualquer tempo, ressalvadas as hipóteses de guarda legal obrigatória.
      </p>

      <h2>4. Compartilhamento</h2>
      <p>
        Dados podem ser compartilhados com operadores estritamente necessários (provedor de
        infraestrutura, e-mail transacional e gateway de pagamento), sob obrigações de segurança e
        confidencialidade.
      </p>

      <h2>5. Segurança</h2>
      <ul>
        <li>Controle de acesso por perfil (RBAC), verificado no servidor.</li>
        <li>Armazenamento de documentos em buckets privados com acesso restrito.</li>
        <li>Senhas sob hash gerenciado pelo provedor de autenticação; segredos fora do código.</li>
        <li>Trilha de auditoria das ações críticas.</li>
      </ul>

      <h2>6. Direitos do titular</h2>
      <p>
        O titular pode solicitar confirmação, acesso, correção, portabilidade, anonimização e
        eliminação de dados, bem como informações sobre compartilhamentos, pelos canais de atendimento
        da instituição.
      </p>

      <h2>7. Encarregado (DPO) e contato</h2>
      <p>
        Solicitações relativas à privacidade e proteção de dados podem ser encaminhadas ao Encarregado
        de Dados da instituição pelos canais oficiais informados na secretaria acadêmica.
      </p>
    </LegalShell>
  );
}
