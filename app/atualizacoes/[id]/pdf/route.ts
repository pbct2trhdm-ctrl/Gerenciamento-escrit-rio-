import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { caminhoAbsolutoAnexo } from "@/lib/anexos";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const atualizacao = await prisma.atualizacaoCliente.findUnique({
    where: { id },
    select: { arquivoCaminho: true, arquivoNome: true, arquivoTipo: true },
  });

  if (!atualizacao) {
    return new Response("PDF não encontrado", { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(caminhoAbsolutoAnexo(atualizacao.arquivoCaminho));
  } catch {
    return new Response("Arquivo não encontrado em disco", { status: 404 });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": atualizacao.arquivoTipo,
      "Content-Disposition": `inline; filename="${encodeURIComponent(atualizacao.arquivoNome)}"`,
    },
  });
}
