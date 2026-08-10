"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { UFS_BRASIL } from "@/lib/formatacao";

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
