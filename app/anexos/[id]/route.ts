import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { caminhoAbsolutoAnexo } from "@/lib/anexos";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const andamento = await prisma.andamento.findUnique({
    where: { id },
    select: { arquivoCaminho: true, arquivoNome: true, arquivoTipo: true },
  });

  if (!andamento?.arquivoCaminho) {
    return new Response("Anexo não encontrado", { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(caminhoAbsolutoAnexo(andamento.arquivoCaminho));
  } catch {
    return new Response("Arquivo não encontrado em disco", { status: 404 });
  }

  const nomeArquivo = andamento.arquivoNome ?? "anexo";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": andamento.arquivoTipo ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(nomeArquivo)}"`,
    },
  });
}
