"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const PROVEDORES = ["EVOLUTION_API", "Z_API"] as const;

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
}

export async function salvarConfiguracaoNotificacoes(formData: FormData) {
  const numeroWhatsapp = textoOuNull(formData.get("numeroWhatsapp"));
  const antecedenciaPadraoDias = Number(formData.get("antecedenciaPadraoDias") ?? 3);
  const horarioDisparo = (formData.get("horarioDisparo") ?? "08:00").toString();

  const provedorTexto = (formData.get("provedor") ?? "").toString();
  const provedor = (PROVEDORES as readonly string[]).includes(provedorTexto)
    ? (provedorTexto as (typeof PROVEDORES)[number])
    : null;

  const urlBaseApi = textoOuNull(formData.get("urlBaseApi"));
  const instanciaId = textoOuNull(formData.get("instanciaId"));
  const credencialApi = textoOuNull(formData.get("credencialApi"));

  const dados = {
    numeroWhatsapp,
    antecedenciaPadraoDias,
    horarioDisparo,
    provedor,
    urlBaseApi,
    instanciaId,
    credencialApi,
  };

  await prisma.configuracaoNotificacao.upsert({
    where: { id: 1 },
    update: dados,
    create: { id: 1, ...dados },
  });

  revalidatePath("/configuracoes");
  redirect("/configuracoes");
}
