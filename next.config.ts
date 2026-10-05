import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // PDFs de processo anexados para gerar a atualização ao cliente (limite
      // de leitura pela IA: 22 MB) — o padrão de 1 MB barraria quase todos.
      bodySizeLimit: "25mb",
    },
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
