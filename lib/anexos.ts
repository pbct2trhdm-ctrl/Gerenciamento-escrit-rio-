import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const DIRETORIO_ANEXOS = path.join(process.cwd(), "storage", "anexos");

function sanitizarNomeArquivo(nome: string): string {
  return nome.replace(/[/\\]/g, "_").slice(-150);
}

/**
 * Salva o arquivo enviado em storage/anexos (fora do controle de versão) e
 * devolve o caminho relativo ao projeto para gravar no banco — nunca o
 * caminho absoluto, para o registro continuar válido em qualquer máquina.
 */
export async function salvarAnexo(
  arquivo: File
): Promise<{ nome: string; caminho: string; tipo: string }> {
  await mkdir(DIRETORIO_ANEXOS, { recursive: true });

  const nomeSanitizado = sanitizarNomeArquivo(arquivo.name || "anexo");
  const nomeArmazenado = `${randomUUID()}-${nomeSanitizado}`;
  const caminhoAbsoluto = path.join(DIRETORIO_ANEXOS, nomeArmazenado);

  const bytes = Buffer.from(await arquivo.arrayBuffer());
  await writeFile(caminhoAbsoluto, bytes);

  return {
    nome: arquivo.name || nomeSanitizado,
    caminho: path.join("storage", "anexos", nomeArmazenado),
    tipo: arquivo.type || "application/octet-stream",
  };
}

export function caminhoAbsolutoAnexo(caminhoRelativo: string): string {
  return path.join(process.cwd(), caminhoRelativo);
}

/** Exclusão best-effort — se o arquivo já não existir em disco, ignora o erro. */
export async function removerAnexo(caminhoRelativo: string): Promise<void> {
  try {
    await unlink(caminhoAbsolutoAnexo(caminhoRelativo));
  } catch {
    // arquivo já ausente ou inacessível — não é motivo para falhar a operação
  }
}
