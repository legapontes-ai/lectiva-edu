import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo oficial do Lectiva Edu: emblema (escudo + livro + figura + check) +
 * wordmark em Montserrat. O emblema é o PNG vetorizado da marca (fundo
 * transparente) em /public/brand/logo-mark.png.
 */
const SIZES = {
  sm: { px: 30, title: "text-lg" },
  md: { px: 38, title: "text-xl" },
  lg: { px: 54, title: "text-3xl" },
} as const;

const RATIO = 423 / 482; // largura/altura do emblema

export function Logo({
  className,
  showSlogan = false,
  size = "md",
  markOnly = false,
}: {
  className?: string;
  showSlogan?: boolean;
  size?: "sm" | "md" | "lg";
  markOnly?: boolean;
}) {
  const { px, title } = SIZES[size];
  const w = Math.round(px * RATIO);

  const mark = (
    <Image
      src="/brand/logo-mark.png"
      alt="Lectiva Edu"
      width={w}
      height={px}
      className="shrink-0"
      style={{ height: px, width: w }}
    />
  );

  if (markOnly) return <span className={cn("inline-flex", className)}>{mark}</span>;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {mark}
      <span className="flex flex-col leading-none">
        <span className={cn("font-heading font-extrabold tracking-tight text-primary", title)}>
          Lectiva <span className="text-success">Edu</span>
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
