import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { PrestacaoContasPdf } from "@/components/prestacao-contas-pdf";
import { LABEL_TRIBUNAL } from "@/lib/tribunais";

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

  const nomeArquivo = `prestacao-contas-${processo.cliente.nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
