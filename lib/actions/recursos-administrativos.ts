"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ORGAOS_RECURSAL } from "@/lib/formatacao";
import type { OrgaoRecursal } from "@/app/generated/prisma/client";

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
}

function parseData(valor: FormDataEntryValue | null): Date {
  const texto = (valor ?? "").toString();
  const [ano, mes, dia] = texto.split("-").map(Number);
  return new Date(Date.UTC(ano, (mes || 1) - 1, dia || 1));
}

function validarOrgaoRecursal(valor: FormDataEntryValue | null): OrgaoRecursal {
  const texto = (valor ?? "").toString();
  return (ORGAOS_RECURSAL as readonly string[]).includes(texto)
    ? (texto as OrgaoRecursal)
    : "OUTRO";
}

export async function criarRecursoAdministrativo(formData: FormData) {
  const processoAdministrativoId = (formData.get("processoAdministrativoId") ?? "").toString();
  if (!processoAdministrativoId) {
    throw new Error("Processo administrativo é obrigatório");
  }

  await prisma.recursoAdministrativo.create({
    data: {
      processoAdministrativoId,
      orgaoRecursal: validarOrgaoRecursal(formData.get("orgaoRecursal")),
      dataInterposicao: parseData(formData.get("dataInterposicao")),
      observacoes: textoOuNull(formData.get("observacoes")),
    },
  });

  revalidatePath(`/processos-administrativos/${processoAdministrativoId}`);
  redirect(`/processos-administrativos/${processoAdministrativoId}`);
}

export async function excluirRecursoAdministrativo(id: string) {
  const recurso = await prisma.recursoAdministrativo.delete({ where: { id } });
  revalidatePath(`/processos-administrativos/${recurso.processoAdministrativoId}`);
  redirect(`/processos-administrativos/${recurso.processoAdministrativoId}`);
}
