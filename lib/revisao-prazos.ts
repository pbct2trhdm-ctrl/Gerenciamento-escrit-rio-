import { prisma } from "@/lib/prisma";
import type { PoloProcessual } from "@/app/generated/prisma/client";
import { identificarPrazoNoTexto, normalizarTexto } from "@/lib/prazo-publicacao";
import { inferirPoloCliente } from "@/lib/polo";

/**
 * Revisão dos prazos pendentes gerados de publicações do DJEN, com a regra
 * de destinatário (lib/polo.ts): identifica os que eram da parte contrária.
 * O polo do cliente vem do processo ou, se vazio, é descoberto pelas
 * publicações vinculadas (sem gravar — a gravação acontece ao aplicar).
 */

export type ClassificacaoRevisao = "contraria" | "cliente" | "indefinido" | "sem_polo";

export type ItemRevisao = {
  prazoId: string;
  processoId: string;
  numeroProcesso: string | null;
  cliente: string;
  dataFinal: Date;
  dias: number | null;
  aConferir: boolean;
  publicacaoId: string;
  dataPublicacao: Date;
  trechoPublicacao: string;
  classificacao: ClassificacaoRevisao;
  destinatario: string | null;
  polo: PoloProcessual | null;
  poloDescoberto: boolean;
};

/** Polo do cliente descoberto pelo conjunto das publicações do processo (só se todas concordarem). */
async function poloPelasPublicacoes(processoId: string, nomeCliente: string): Promise<PoloProcessual | null> {
  const publicacoes = await prisma.publicacao.findMany({
    where: { processoId },
    select: { textoPublicacao: true },
  });
  const encontrados = new Set<PoloProcessual>();
  for (const p of publicacoes) {
    const polo = inferirPoloCliente(normalizarTexto(p.textoPublicacao), nomeCliente);
    if (polo) encontrados.add(polo);
  }
  return encontrados.size === 1 ? [...encontrados][0] : null;
}

export async function analisarPrazosDePublicacoes(): Promise<ItemRevisao[]> {
  const prazos = await prisma.prazo.findMany({
    where: { status: "PENDENTE", tipo: { not: "AUDIENCIA" }, origemPublicacaoId: { not: null } },
    orderBy: { dataFinal: "asc" },
    include: {
      origemPublicacao: true,
      processo: { select: { id: true, numeroProcesso: true, poloCliente: true, cliente: { select: { nome: true } } } },
    },
  });

  const polosDescobertos = new Map<string, PoloProcessual | null>();
  const itens: ItemRevisao[] = [];
  for (const prazo of prazos) {
    const publicacao = prazo.origemPublicacao;
    if (!publicacao) continue;
    const { processo } = prazo;

    let polo = processo.poloCliente;
    let poloDescoberto = false;
    if (!polo) {
      if (!polosDescobertos.has(processo.id)) {
        polosDescobertos.set(processo.id, await poloPelasPublicacoes(processo.id, processo.cliente.nome));
      }
      polo = polosDescobertos.get(processo.id) ?? null;
      poloDescoberto = polo !== null;
    }

    let classificacao: ClassificacaoRevisao = "sem_polo";
    let destinatario: string | null = null;
    if (polo) {
      const r = identificarPrazoNoTexto(publicacao.textoPublicacao, {
        nomeCliente: processo.cliente.nome,
        poloCliente: polo,
      });
      if (r?.tipo === "parte_contraria") {
        classificacao = "contraria";
        destinatario = r.destinatario;
      } else {
        classificacao = r?.tipo === "prazo" ? "cliente" : "indefinido";
      }
    }

    itens.push({
      prazoId: prazo.id,
      processoId: processo.id,
      numeroProcesso: processo.numeroProcesso,
      cliente: processo.cliente.nome,
      dataFinal: prazo.dataFinal,
      dias: prazo.dias,
      aConferir: prazo.aConferir,
      publicacaoId: publicacao.id,
      dataPublicacao: publicacao.dataPublicacao,
      trechoPublicacao: publicacao.textoPublicacao.slice(0, 400),
      classificacao,
      destinatario,
      polo,
      poloDescoberto,
    });
  }
  return itens;
}

/**
 * Remove os prazos escolhidos (que a análise apontou como da parte
 * contrária), registra o motivo na publicação e grava o polo descoberto.
 */
export async function removerPrazosDaParteContraria(prazoIds: string[]): Promise<number> {
  const analise = await analisarPrazosDePublicacoes();
  const alvos = analise.filter((i) => prazoIds.includes(i.prazoId) && i.classificacao === "contraria");

  for (const item of alvos) {
    if (item.poloDescoberto && item.polo) {
      await prisma.processo.updateMany({
        where: { id: item.processoId, poloCliente: null },
        data: { poloCliente: item.polo },
      });
    }
    await prisma.prazo.delete({ where: { id: item.prazoId } });
    await prisma.publicacao.update({
      where: { id: item.publicacaoId },
      data: {
        observacaoPrazo: `O prazo${item.dias ? ` de ${item.dias} dias` : ""} desta publicação é da parte contrária (${item.destinatario}) — o prazo gerado antes foi removido na revisão.`,
      },
    });
  }
  return alvos.length;
}
