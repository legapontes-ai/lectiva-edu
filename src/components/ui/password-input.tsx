"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Campo de senha com botão "mostrar/ocultar" (visualizar texto).
 * Aceita os mesmos props de um <input> (inclui o `ref` do React Hook Form
 * via React 19), exceto `type`, que é controlado internamente.
 */
function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [mostrar, setMostrar] = React.useState(false);
  return (
    <div className="relative">
      <input
        data-slot="input"
        className={cn(
          "flex h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 pr-10 text-sm shadow-sm transition-colors outline-none",
          "placeholder:text-muted-foreground/70",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          className,
        )}
        {...props}
        type={mostrar ? "text" : "password"}
      />
      <button
        type="button"
        onClick={() => setMostrar((m) => !m)}
        tabIndex={-1}
        aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={mostrar}
        className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {mostrar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export { PasswordInput };
