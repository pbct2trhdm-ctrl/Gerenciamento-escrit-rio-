"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TODOS_TRIBUNAIS } from "@/lib/tribunais";
import { RITOS_POR_JURISDICAO } from "@/lib/formatacao";
import type { Tribunal, Jurisdicao, Rito } from "@/app/generated/prisma/client";

const AREAS = [
  "CIVEL",
  "TRABALHISTA",
  "PREVIDENCIARIO",
  "TRIBUTARIO",
  "PENAL",
  "EMPRESARIAL",
  "FAMILIA_SUCESSOES",
  "CONSUMIDOR",
  "ADMINISTRATIVO",
  "ELEITORAL",
  "AMBIENTAL",
  "IMOBILIARIO",
  "OUTRO",
] as const;
const STATUS = ["ATIVO", "SUSPENSO", "ARQUIVADO", "ENCERRADO"] as const;
const JURISDICOES = ["JUIZADO_ESPECIAL", "JUSTICA_COMUM"] as const;
const RITOS = ["SUMARIO", "SUMARISSIMO", "ORDINARIO"] as const;

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
}

function validarArea(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (AREAS as readonly string[]).includes(texto)
    ? (texto as (typeof AREAS)[number])
    : "OUTRO";
}

function validarStatus(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (STATUS as readonly string[]).includes(texto)
    ? (texto as (typeof STATUS)[number])
    : "ATIVO";
}

function validarTribunal(valor: FormDataEntryValue | null): Tribunal | null {
  const texto = (valor ?? "").toString();
  return TODOS_TRIBUNAIS.includes(texto) ? (texto as Tribunal) : null;
}

function dadosArea(formData: FormData) {
  const area = validarArea(formData.get("area"));
  return {
    area,
    areaOutraDescricao:
      area === "OUTRO" ? textoOuNull(formData.get("areaOutraDescricao")) : null,
  };
}

function dadosJurisdicaoRito(formData: FormData) {
  const jurisdicaoTexto = (formData.get("jurisdicao") ?? "").toString();
  const jurisdicao = (JURISDICOES as readonly string[]).includes(jurisdicaoTexto)
    ? (jurisdicaoTexto as Jurisdicao)
    : null;

  const ritoTexto = (formData.get("rito") ?? "").toString();
  const ritosValidos: readonly string[] = jurisdicao
    ? RITOS_POR_JURISDICAO[jurisdicao]
    : RITOS;
  const rito =
    (RITOS as readonly string[]).includes(ritoTexto) && ritosValidos.includes(ritoTexto)
      ? (ritoTexto as Rito)
      : null;

  return { jurisdicao, rito };
}

export async function criarProcesso(formData: FormData) {
  const clienteId = (formData.get("clienteId") ?? "").toString();
  if (!clienteId) {
    throw new Error("Cliente é obrigatório");
  }

  const processo = await prisma.processo.create({
    data: {
      clienteId,
      numeroProcesso: textoOuNull(formData.get("numeroProcesso")),
      ...dadosArea(formData),
      ...dadosJurisdicaoRito(formData),
      tribunal: validarTribunal(formData.get("tribunal")),
      vara: textoOuNull(formData.get("vara")),
      comarca: textoOuNull(formData.get("comarca")),
      status: validarStatus(formData.get("status")),
      resumo: textoOuNull(formData.get("resumo")),
    },
  });

  revalidatePath("/processos");
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/processos/${processo.id}`);
}

export async function atualizarProcesso(id: string, formData: FormData) {
  const clienteId = (formData.get("clienteId") ?? "").toString();
  if (!clienteId) {
    throw new Error("Cliente é obrigatório");
  }

  await prisma.processo.update({
    where: { id },
    data: {
      clienteId,
      numeroProcesso: textoOuNull(formData.get("numeroProcesso")),
      ...dadosArea(formData),
      ...dadosJurisdicaoRito(formData),
      tribunal: validarTribunal(formData.get("tribunal")),
      vara: textoOuNull(formData.get("vara")),
      comarca: textoOuNull(formData.get("comarca")),
      status: validarStatus(formData.get("status")),
      resumo: textoOuNull(formData.get("resumo")),
    },
  });

  revalidatePath("/processos");
  revalidatePath(`/processos/${id}`);
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/processos/${id}`);
}

export async function excluirProcesso(id: string) {
  const processo = await prisma.processo.delete({ where: { id } });
  revalidatePath("/processos");
  revalidatePath(`/clientes/${processo.clienteId}`);
  redirect(`/clientes/${processo.clienteId}`);
}
