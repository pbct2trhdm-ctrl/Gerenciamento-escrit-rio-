"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ORGAOS_PROCESSO_ADMINISTRATIVO,
  TIPOS_POR_ORGAO_ADMINISTRATIVO,
  STATUS_PROCESSO_ADMINISTRATIVO,
} from "@/lib/formatacao";
import type { OrgaoProcessoAdministrativo, TipoProcessoAdministrativo, StatusProcessoAdministrativo } from "@/app/generated/prisma/client";

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
}

function parseData(valor: FormDataEntryValue | null): Date | null {
  const texto = (valor ?? "").toString();
  if (!texto) return null;
  const [ano, mes, dia] = texto.split("-").map(Number);
  return new Date(Date.UTC(ano, (mes || 1) - 1, dia || 1));
}

function validarOrgao(valor: FormDataEntryValue | null): OrgaoProcessoAdministrativo {
  const texto = (valor ?? "").toString();
  return (ORGAOS_PROCESSO_ADMINISTRATIVO as readonly string[]).includes(texto)
    ? (texto as OrgaoProcessoAdministrativo)
    : "INSS";
}

function validarTipo(
  orgao: OrgaoProcessoAdministrativo,
  valor: FormDataEntryValue | null
): TipoProcessoAdministrativo {
  const texto = (valor ?? "").toString();
  const tiposValidos = TIPOS_POR_ORGAO_ADMINISTRATIVO[orgao];
  return tiposValidos.includes(texto) ? (texto as TipoProcessoAdministrativo) : "OUTRO";
}

function validarStatus(valor: FormDataEntryValue | null): StatusProcessoAdministrativo {
  const texto = (valor ?? "").toString();
  return (STATUS_PROCESSO_ADMINISTRATIVO as readonly string[]).includes(texto)
    ? (texto as StatusProcessoAdministrativo)
    : "EM_ANALISE";
}

function dadosFormulario(formData: FormData) {
  const orgao = validarOrgao(formData.get("orgao"));
  return {
    orgao,
    tipo: validarTipo(orgao, formData.get("tipo")),
    numeroProtocolo: textoOuNull(formData.get("numeroProtocolo")),
    status: validarStatus(formData.get("status")),
    dataAbertura: parseData(formData.get("dataAbertura")) ?? new Date(),
    dataDecisao: parseData(formData.get("dataDecisao")),
    resumo: textoOuNull(formData.get("resumo")),
    observacoes: textoOuNull(formData.get("observacoes")),
    processoJudicialId: textoOuNull(formData.get("processoJudicialId")),
  };
}

export async function criarProcessoAdministrativo(formData: FormData) {
  const clienteId = (formData.get("clienteId") ?? "").toString();
  if (!clienteId) {
    throw new Error("Cliente é obrigatório");
  }

  const processo = await prisma.processoAdministrativo.create({
    data: {
      clienteId,
      ...dadosFormulario(formData),
    },
  });

  revalidatePath("/processos-administrativos");
  redirect(`/processos-administrativos/${processo.id}`);
}

export async function atualizarProcessoAdministrativo(id: string, formData: FormData) {
  const clienteId = (formData.get("clienteId") ?? "").toString();
  if (!clienteId) {
    throw new Error("Cliente é obrigatório");
  }

  await prisma.processoAdministrativo.update({
    where: { id },
    data: {
      clienteId,
      ...dadosFormulario(formData),
    },
  });

  revalidatePath("/processos-administrativos");
  revalidatePath(`/processos-administrativos/${id}`);
  redirect(`/processos-administrativos/${id}`);
}

export async function excluirProcessoAdministrativo(id: string) {
  await prisma.processoAdministrativo.delete({ where: { id } });
  revalidatePath("/processos-administrativos");
  redirect("/processos-administrativos");
}
