import { prisma } from "@/lib/prisma";
import { normalizarTexto } from "@/lib/prazo-publicacao";
import {
  LABEL_AREA,
  LABEL_ORGAO_PROCESSO_ADMINISTRATIVO,
  LABEL_TIPO_PROCESSO_ADMINISTRATIVO,
} from "@/lib/formatacao";

/**
 * Busca geral (campo do menu / ⌘K): clientes, processos judiciais e
 * administrativos e publicações. Filtra em memória para ignorar acentos e
 * maiúsculas (o LIKE do SQLite não faz isso) — o volume de um escritório
 * individual cabe tranquilamente. Números são comparados só pelos dígitos,
 * então "0801234" encontra "0801234-56.2025.8.14.0301".
 */

export type TipoResultadoBusca = "cliente" | "processo" | "administrativo" | "publicacao";

export type ResultadoBusca = {
  tipo: TipoResultadoBusca;
  titulo: string;
  detalhe: string;
  href: string;
};

export const LABEL_TIPO_RESULTADO: Record<TipoResultadoBusca, string> = {
  cliente: "Cliente",
  processo: "Processo",
  administrativo: "Adm.",
  publicacao: "Publicação",
};

const apenasDigitos = (texto: string | null | undefined) => (texto ?? "").replace(/\D/g, "");

export async function buscarGeral(consulta: string, limitePorTipo = 6): Promise<ResultadoBusca[]> {
  const termo = normalizarTexto(consulta.trim());
  if (termo.length < 2) return [];
  const digitos = apenasDigitos(consulta);
  const buscaNumero = digitos.length >= 4;
  const contem = (texto: string | null | undefined) => normalizarTexto(texto ?? "").includes(termo);
  const numeroBate = (numero: string | null | undefined) =>
    buscaNumero && apenasDigitos(numero).includes(digitos);

  const [clientes, processos, administrativos] = await Promise.all([
    prisma.cliente.findMany({
      select: {
        id: true,
        nome: true,
        cpfCnpj: true,
        telefone: true,
        _count: { select: { processos: true } },
      },
    }),
    prisma.processo.findMany({
      select: {
        id: true,
        numeroProcesso: true,
        area: true,
        vara: true,
        comarca: true,
        cliente: { select: { nome: true } },
      },
    }),
    prisma.processoAdministrativo.findMany({
      select: {
        id: true,
        numeroProtocolo: true,
        orgao: true,
        tipo: true,
        cliente: { select: { nome: true } },
      },
    }),
  ]);

  const resultados: ResultadoBusca[] = [];

  resultados.push(
    ...processos
      .filter(
        (p) =>
          numeroBate(p.numeroProcesso) ||
          contem(p.numeroProcesso) ||
          contem(p.cliente.nome) ||
          contem(p.vara) ||
          contem(p.comarca)
      )
      .slice(0, limitePorTipo)
      .map((p) => ({
        tipo: "processo" as const,
        titulo: p.numeroProcesso ?? "Processo sem número",
        detalhe: [p.cliente.nome, LABEL_AREA[p.area], p.vara].filter(Boolean).join(" · "),
        href: `/processos/${p.id}`,
      }))
  );

  resultados.push(
    ...clientes
      .filter((c) => contem(c.nome) || numeroBate(c.cpfCnpj) || numeroBate(c.telefone))
      .slice(0, limitePorTipo)
      .map((c) => ({
        tipo: "cliente" as const,
        titulo: c.nome,
        detalhe: `${c._count.processos} processo(s)${c.telefone ? ` · ${c.telefone}` : ""}`,
        href: `/clientes/${c.id}`,
      }))
  );

  resultados.push(
    ...administrativos
      .filter((a) => numeroBate(a.numeroProtocolo) || contem(a.numeroProtocolo) || contem(a.cliente.nome))
      .slice(0, limitePorTipo)
      .map((a) => ({
        tipo: "administrativo" as const,
        titulo: `${LABEL_ORGAO_PROCESSO_ADMINISTRATIVO[a.orgao]} · ${LABEL_TIPO_PROCESSO_ADMINISTRATIVO[a.tipo]}`,
        detalhe: [a.cliente.nome, a.numeroProtocolo && `Protocolo ${a.numeroProtocolo}`].filter(Boolean).join(" · "),
        href: `/processos-administrativos/${a.id}`,
      }))
  );

  // Publicações: só pelo número do processo (o texto é longo e geraria ruído).
  if (buscaNumero) {
    const publicacoes = await prisma.publicacao.findMany({
      where: { numeroProcessoIdentificado: { not: null } },
      orderBy: { dataPublicacao: "desc" },
      select: { id: true, numeroProcessoIdentificado: true, dataPublicacao: true, textoPublicacao: true },
      take: 500,
    });
    resultados.push(
      ...publicacoes
        .filter((p) => numeroBate(p.numeroProcessoIdentificado))
        .slice(0, limitePorTipo)
        .map((p) => ({
          tipo: "publicacao" as const,
          titulo: `${p.dataPublicacao.toLocaleDateString("pt-BR", { timeZone: "UTC" })} · ${p.numeroProcessoIdentificado}`,
          detalhe: p.textoPublicacao.slice(0, 120),
          href: `/publicacoes/${p.id}`,
        }))
    );
  }

  return resultados;
}
