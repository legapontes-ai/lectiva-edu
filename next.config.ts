import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  // Fixa a raiz do workspace (há um package-lock.json fora do projeto que
  // confunde a inferência automática do Turbopack).
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
};

export default nextConfig;
