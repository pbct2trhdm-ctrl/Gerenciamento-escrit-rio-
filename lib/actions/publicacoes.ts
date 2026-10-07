"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { UFS_BRASIL } from "@/lib/formatacao";
import { verificarEImportarPublicacoes, vincularPublicacaoAoProcessoId } from "@/lib/publicacoes";
import { calcularVencimentoPublicacao } from "@/lib/prazo-publicacao";

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
}

export async function salvarConfiguracaoPublicacoes(formData: FormData) {
  const numeroOab = textoOuNull(formData.get("numeroOab"));
  const seccionalTexto = (formData.get("seccionalOab") ?? "").toString();
  const seccionalOab = (UFS_BRASIL as readonly string[]).includes(seccionalTexto)
    ? seccionalTexto
    : null;
  const horarioConsulta = (formData.get("horarioConsulta") ?? "07:00").toString();

  await prisma.configuracaoPublicacoes.upsert({
    where: { id: 1 },
    update: { numeroOab, seccionalOab, horarioConsulta },
    create: { id: 1, numeroOab, seccionalOab, horarioConsulta },
  });

  revalidatePath("/configuracoes");
  redirect("/configuracoes");
}

export async function vincularPublicacaoManualmente(publicacaoId: string, formData: FormData) {
  const processoId = (formData.get("processoId") ?? "").toString();
  if (!processoId) {
    throw new Error("Processo é obrigatório");
  }

  await vincularPublicacaoAoProcessoId(publicacaoId, processoId);

  revalidatePath("/publicacoes");
  revalidatePath(`/publicacoes/${publicacaoId}`);
  revalidatePath(`/processos/${processoId}`);
  revalidatePath("/");
  redirect(`/publicacoes/${publicacaoId}`);
}

/**
 * Botão "Buscar agora" da tela de Publicações: roda a busca no DJEN na hora,
 * ignorando o horário configurado e o limite de uma vez por dia.
 */
export async function buscarPublicacoesAgora() {
  let destino: string;
  try {
    const resumo = await verificarEImportarPublicacoes(new Date(), { forcar: true });
    destino = resumo.executado
      ? `/publicacoes?busca=ok&novas=${resumo.novas}`
      : `/publicacoes?busca=erro&motivo=${encodeURIComponent(resumo.motivo ?? "Busca não executada.")}`;
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : "Erro desconhecido ao consultar o DJEN.";
    console.error("Falha na busca manual de publicações:", erro);
    destino = `/publicacoes?busca=erro&motivo=${encodeURIComponent(motivo)}`;
  }

  revalidatePath("/publicacoes");
  revalidatePath("/", "layout");
  redirect(destino);
}

const TIPOS_PRAZO_PUBLICACAO = ["PETICAO", "RECURSO", "MANIFESTACAO", "OUTRO"] as const;

/**
 * Publicação marcada "prazo a definir": a advogada informa os dias e o
 * sistema calcula o vencimento a partir da data de publicação no DJEN.
 * Como foi definido por ela, o prazo já nasce conferido.
 */
export async function definirPrazoDaPublicacao(publicacaoId: string, formData: FormData) {
  const publicacao = await prisma.publicacao.findUniqueOrThrow({ where: { id: publicacaoId } });
  if (!publicacao.processoId) throw new Error("Vincule a publicação a um processo antes");

  const dias = Number(formData.get("dias"));
  if (!Number.isInteger(dias) || dias < 1 || dias > 365) {
    throw new Error("Informe o número de dias do prazo");
  }
  const contagem = formData.get("contagem") === "DIAS_CORRIDOS" ? "DIAS_CORRIDOS" : "DIAS_UTEIS";
  const tipoTexto = (formData.get("tipo") ?? "").toString();
  const tipo = (TIPOS_PRAZO_PUBLICACAO as readonly string[]).includes(tipoTexto)
    ? (tipoTexto as (typeof TIPOS_PRAZO_PUBLICACAO)[number])
    : "MANIFESTACAO";

  const { dataBase, dataFinal } = calcularVencimentoPublicacao(
    publicacao.dataPublicacao,
    dias,
    contagem
  );

  await prisma.prazo.create({
    data: {
      processoId: publicacao.processoId,
      tipo,
      dataBase,
      dias,
      contagem,
      dataFinal,
      origemPublicacaoId: publicacao.id,
      observacoes: textoOuNull(formData.get("observacoes")),
    },
  });
  await prisma.publicacao.update({
    where: { id: publicacaoId },
    data: { prazoADefinir: false },
  });

  revalidatePath("/");
  revalidatePath("/prazos");
  revalidatePath(`/processos/${publicacao.processoId}`);
  revalidatePath(`/publicacoes/${publicacaoId}`);
  redirect(`/publicacoes/${publicacaoId}`);
}

/** A advogada conferiu que a publicação não abre prazo: sai do destaque do Dashboard. */
export async function marcarPublicacaoSemPrazo(publicacaoId: string) {
  await prisma.publicacao.update({
    where: { id: publicacaoId },
    data: { prazoADefinir: false },
  });
  revalidatePath("/");
  revalidatePath(`/publicacoes/${publicacaoId}`);
}
