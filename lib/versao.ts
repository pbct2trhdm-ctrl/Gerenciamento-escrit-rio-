import { execSync } from "node:child_process";

/**
 * Versão do código em uso (último commit da pasta do projeto), para conferir
 * se uma atualização puxada do GitHub chegou ao sistema que está rodando.
 */
export function versaoEmUso(): { codigo: string; descricao: string; data: string } | null {
  try {
    const saida = execSync("git log -1 --format=%h%n%s%n%cd --date=format:%d/%m/%Y\\ %H:%M", {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const [codigo, descricao, data] = saida.split("\n");
    return codigo ? { codigo, descricao: descricao ?? "", data: data ?? "" } : null;
  } catch {
    return null;
  }
}
