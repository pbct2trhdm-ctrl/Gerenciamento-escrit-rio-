import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type DocumentoAnexo = { titulo: string; bytes: Uint8Array; tipo: string };

const A4 = { largura: 595.28, altura: 841.89 };
const MARGEM = 36;

/** Página com um aviso, usada quando um anexo não pode ser incorporado. */
function paginaAviso(pdf: PDFDocument, fonte: Awaited<ReturnType<PDFDocument["embedFont"]>>, texto: string) {
  const pagina = pdf.addPage([A4.largura, A4.altura]);
  pagina.drawText(texto, { x: MARGEM, y: A4.altura - 72, size: 11, font: fonte, color: rgb(0.6, 0.1, 0.1), maxWidth: A4.largura - 2 * MARGEM });
}

/**
 * Junta ao final do PDF principal os documentos anexados: PDFs têm as páginas
 * copiadas; imagens (JPG/PNG) viram uma página A4 cada. Um anexo ilegível
 * (ex.: PDF protegido) vira uma página de aviso, sem impedir o restante.
 */
export async function juntarAnexos(principal: Uint8Array, anexos: DocumentoAnexo[]): Promise<Uint8Array> {
  if (anexos.length === 0) return principal;

  const pdf = await PDFDocument.load(principal);
  const fonte = await pdf.embedFont(StandardFonts.Helvetica);

  for (const anexo of anexos) {
    try {
      if (anexo.tipo === "application/pdf" || /\.pdf$/i.test(anexo.titulo)) {
        const origem = await PDFDocument.load(anexo.bytes, { ignoreEncryption: true });
        const paginas = await pdf.copyPages(origem, origem.getPageIndices());
        paginas.forEach((pagina) => pdf.addPage(pagina));
        continue;
      }

      const imagem = anexo.tipo === "image/png" ? await pdf.embedPng(anexo.bytes) : await pdf.embedJpg(anexo.bytes);
      const pagina = pdf.addPage([A4.largura, A4.altura]);
      pagina.drawText(anexo.titulo, { x: MARGEM, y: A4.altura - MARGEM, size: 9, font: fonte, color: rgb(0.37, 0.39, 0.4) });
      const escala = Math.min(
        (A4.largura - 2 * MARGEM) / imagem.width,
        (A4.altura - 2 * MARGEM - 24) / imagem.height,
        1
      );
      const largura = imagem.width * escala;
      const altura = imagem.height * escala;
      pagina.drawImage(imagem, {
        x: (A4.largura - largura) / 2,
        y: A4.altura - MARGEM - 24 - altura,
        width: largura,
        height: altura,
      });
    } catch {
      paginaAviso(pdf, fonte, `Anexo "${anexo.titulo}" não pôde ser incorporado (arquivo protegido ou corrompido). Consulte o documento original.`);
    }
  }

  return pdf.save();
}
