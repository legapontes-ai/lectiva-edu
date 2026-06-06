import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Logo textual provisório do Lectiva Edu: ícone de escudo + check de validação
 * (conceito do brand book: escudo + livro + figura humana + check) com o
 * wordmark em Montserrat. Substituir pelo SVG final quando disponível.
 */
export function Logo({
  className,
  showSlogan = false,
  size = "md",
}: {
  className?: string;
  showSlogan?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dims = {
    sm: { icon: "size-6", title: "text-lg", wrap: "size-9" },
    md: { icon: "size-7", title: "text-xl", wrap: "size-11" },
    lg: { icon: "size-9", title: "text-3xl", wrap: "size-14" },
  }[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
          dims.wrap,
        )}
        aria-hidden
      >
        <ShieldCheck className={dims.icon} strokeWidth={2.25} />
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn("font-heading font-extrabold tracking-tight text-primary", dims.title)}>
          Lectiva <span className="text-link">Edu</span>
        </span>
        {showSlogan && (
          <span className="mt-1 text-xs font-medium text-muted-foreground">
            Gestão educacional integrada e inteligente
          </span>
        )}
      </span>
    </div>
  );
}
