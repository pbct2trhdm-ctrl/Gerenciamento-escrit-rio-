import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { caminhoAbsolutoAnexo } from "@/lib/anexos";

/** Abre o PDF do alvará (tipo "alvara") ou o comprovante do repasse (tipo "comprovante"). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; tipo: string }> }
) {
  const { id, tipo } = await params;
  const alvara = await prisma.alvara.findUnique({ where: { id } });
  const anexo =
    tipo === "alvara"
      ? { caminho: alvara?.arquivoAlvaraCaminho, nome: alvara?.arquivoAlvaraNome, tipo: alvara?.arquivoAlvaraTipo }
      : tipo === "comprovante"
        ? { caminho: alvara?.comprovanteRepasseCaminho, nome: alvara?.comprovanteRepasseNome, tipo: alvara?.comprovanteRepasseTipo }
        : null;

  if (!anexo?.caminho) {
    return new Response("Anexo não encontrado", { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(caminhoAbsolutoAnexo(anexo.caminho));
  } catch {
    return new Response("Arquivo não encontrado em disco", { status: 404 });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": anexo.tipo ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(anexo.nome ?? "anexo")}"`,
    },
  });
}
