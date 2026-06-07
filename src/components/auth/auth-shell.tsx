import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthShell({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-secondary/50 to-background px-6 py-12">
      <Link href="/" className="mb-8">
        <Logo size="lg" showSlogan />
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          {descricao && <CardDescription>{descricao}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      <p className="mt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lectiva Edu
      </p>
    </main>
  );
}
