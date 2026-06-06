import Link from "next/link";
import {
  GraduationCap,
  BadgeCheck,
  CalendarDays,
  Wallet,
  ShieldCheck,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const TIPOS_CURSO = [
  { nome: "MBA", desc: "Formação executiva para liderança estratégica." },
  { nome: "Pós lato sensu", desc: "Especialização com profundidade acadêmica." },
  { nome: "Capacitação", desc: "Atualização profissional objetiva e aplicada." },
  { nome: "Extensão", desc: "Conhecimento aberto à comunidade." },
  { nome: "Cursos livres", desc: "Aprendizado contínuo, no seu ritmo." },
];

const RECURSOS = [
  { icon: BookOpen, titulo: "Vida acadêmica", desc: "Disciplinas, materiais, frequência e notas em um só lugar." },
  { icon: BadgeCheck, titulo: "Certificação", desc: "Emissão em PDF com código de autenticidade verificável." },
  { icon: Wallet, titulo: "Financeiro", desc: "Planos, parcelas, 2ª via e extrato para o aluno." },
  { icon: CalendarDays, titulo: "Calendário & comunicados", desc: "Eventos, avisos segmentados e notificações." },
  { icon: ShieldCheck, titulo: "Segurança & LGPD", desc: "Perfis de acesso, consentimento e trilha de auditoria." },
  { icon: GraduationCap, titulo: "Gestão integrada", desc: "Coordenação, secretaria, docentes e alunos conectados." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="flex items-center gap-3">
            <Link
              href="/validar-certificado"
              className="hidden text-sm font-medium text-foreground/80 hover:text-link sm:inline"
            >
              Validar certificado
            </Link>
            <Button render={<Link href="/login" />}>Acessar plataforma</Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-secondary/60 to-background">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-link">
              <ShieldCheck className="size-3.5" /> Conforme a LGPD
            </span>
            <h1 className="mt-5 font-heading text-4xl font-extrabold leading-tight tracking-tight text-primary sm:text-5xl">
              Gestão educacional <span className="text-link">integrada e inteligente</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              A plataforma Lectiva Edu centraliza a vida acadêmica, a certificação, o
              financeiro e a gestão administrativa de cursos de pós-graduação, MBA,
              capacitação, extensão e cursos livres.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" render={<Link href="/login" />}>
                Entrar <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" size="lg" render={<Link href="/cursos" />}>
                Conhecer os cursos
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Modalidades
            </p>
            <ul className="mt-4 space-y-3">
              {TIPOS_CURSO.map((t) => (
                <li key={t.nome} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex size-2.5 shrink-0 rounded-full bg-success" />
                  <span>
                    <span className="font-semibold text-foreground">{t.nome}</span>
                    <span className="block text-sm text-muted-foreground">{t.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="font-heading text-2xl font-bold text-primary">Tudo o que a instituição precisa</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          16 módulos integrados para coordenação, secretaria, docentes e alunos.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map((r) => (
            <div key={r.titulo} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <span className="inline-flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <r.icon className="size-6" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">{r.titulo}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Lectiva Edu — Gestão educacional integrada e inteligente.
          </p>
        </div>
      </footer>
    </div>
  );
}
