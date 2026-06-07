import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Tipografia institucional única (manual "linguagem visual refeita").
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lectiva Edu — Gestão educacional integrada e inteligente",
    template: "%s · Lectiva Edu",
  },
  description:
    "Plataforma de gestão acadêmica para cursos de pós-graduação, MBA, capacitação, extensão e cursos livres.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
