import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = { title: "Termos de Uso" };

export default function TermosPage() {
  return (
    <LegalShell titulo="Termos de Uso" atualizadoEm="07/06/2026">
      <p>
        Estes Termos regem o uso da plataforma <strong>Lectiva Edu</strong>. Ao acessar a plataforma,
        o usuário concorda com as condições abaixo.
      </p>

      <h2>1. Acesso e conta</h2>
      <p>
        O acesso é pessoal e intransferível. O usuário é responsável por manter a confidencialidade de
        suas credenciais e por todas as atividades realizadas em sua conta. A sessão expira após
        período de inatividade por motivo de segurança.
      </p>

      <h2>2. Uso adequado</h2>
      <ul>
        <li>Não compartilhar credenciais nem tentar acessar áreas sem autorização.</li>
        <li>Não inserir conteúdo ilícito, ofensivo ou que viole direitos de terceiros.</li>
        <li>Respeitar os direitos autorais dos materiais disponibilizados.</li>
      </ul>

      <h2>3. Conteúdo acadêmico</h2>
      <p>
        Materiais, certificados e demais conteúdos são disponibilizados para fins educacionais. A
        emissão de certificados está condicionada ao cumprimento dos requisitos acadêmicos e à
        regularidade financeira.
      </p>

      <h2>4. Disponibilidade</h2>
      <p>
        A instituição empenha-se em manter a plataforma disponível, podendo realizar manutenções
        programadas. Não há garantia de disponibilidade ininterrupta.
      </p>

      <h2>5. Proteção de dados</h2>
      <p>
        O tratamento de dados pessoais observa a{" "}
        <a href="/politica-de-privacidade" className="text-link underline">Política de Privacidade</a>,
        em conformidade com a LGPD.
      </p>

      <h2>6. Alterações</h2>
      <p>
        Estes Termos podem ser atualizados. Alterações relevantes serão comunicadas pelos canais
        oficiais da instituição.
      </p>
    </LegalShell>
  );
}
