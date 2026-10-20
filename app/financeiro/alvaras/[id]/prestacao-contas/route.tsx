import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { PrestacaoContasPdf } from "@/components/prestacao-contas-pdf";
import { LABEL_TRIBUNAL } from "@/lib/tribunais";
import { readFile } from "fs/promises";
import { caminhoAbsolutoAnexo } from "@/lib/anexos";
import { juntarAnexos, type DocumentoAnexo } from "@/lib/juntar-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const alvara = await prisma.alvara.findUnique({
    where: { id },
    include: { processo: { include: { cliente: true } } },
  });
  if (!alvara) {
    return new Response("Alvará não encontrado", { status: 404 });
  }

  const { processo } = alvara;
  const orgao = [processo.vara, processo.comarca, processo.tribunal ? LABEL_TRIBUNAL[processo.tribunal] : null]
    .filter(Boolean)
    .join(" — ");

  const buffer = await renderToBuffer(
    <PrestacaoContasPdf
      dados={{
        ...alvara,
        cliente: { nome: processo.cliente.nome, cpfCnpj: processo.cliente.cpfCnpj },
        processo: { numeroProcesso: processo.numeroProcesso, orgao: orgao || null },
      }}
    />
  );

  // Anexa ao final o PDF do alvará e o comprovante do repasse, se houver.
  const anexos: DocumentoAnexo[] = [];
  for (const [caminho, nome, tipo] of [
    [alvara.arquivoAlvaraCaminho, alvara.arquivoAlvaraNome, alvara.arquivoAlvaraTipo],
    [alvara.comprovanteRepasseCaminho, alvara.comprovanteRepasseNome, alvara.comprovanteRepasseTipo],
  ] as const) {
    if (!caminho) continue;
    try {
      const bytes = await readFile(caminhoAbsolutoAnexo(caminho));
      anexos.push({ titulo: nome ?? "Anexo", bytes: new Uint8Array(bytes), tipo: tipo ?? "" });
    } catch {
      // arquivo ausente em disco: segue sem ele
    }
  }
  const pdfFinal = await juntarAnexos(new Uint8Array(buffer), anexos);

  const nomeArquivo = `prestacao-contas-${processo.cliente.nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()}.pdf`;

  return new Response(new Uint8Array(pdfFinal), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
