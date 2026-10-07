"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { UFS_BRASIL } from "@/lib/formatacao";
import { verificarEImportarPublicacoes } from "@/lib/publicacoes";

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

  const publicacao = await prisma.publicacao.update({
    where: { id: publicacaoId },
    data: { processoId, statusVinculo: "VINCULADA" },
  });

  await prisma.andamento.create({
    data: {
      processoId,
      data: publicacao.dataPublicacao,
      tipo: "PUBLICACAO",
      descricao: publicacao.textoPublicacao,
    },
  });

  revalidatePath("/publicacoes");
  revalidatePath(`/publicacoes/${publicacaoId}`);
  revalidatePath(`/processos/${processoId}`);
  revalidatePath("/");
  redirect("/publicacoes");
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
