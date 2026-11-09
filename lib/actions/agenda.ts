"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const TIPOS = ["REUNIAO", "DILIGENCIA"] as const;
const STATUS = ["AGENDADO", "REALIZADO", "CANCELADO"] as const;

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
}

/** "AAAA-MM-DD" + "HH:MM" → Date com a hora de parede gravada em UTC. */
function dataHora(dataValor: FormDataEntryValue | null, horaValor: FormDataEntryValue | null): Date | null {
  const data = /^(\d{4})-(\d{2})-(\d{2})$/.exec((dataValor ?? "").toString());
  const hora = /^(\d{2}):(\d{2})$/.exec((horaValor ?? "").toString());
  if (!data || !hora) return null;
  return new Date(
    Date.UTC(Number(data[1]), Number(data[2]) - 1, Number(data[3]), Number(hora[1]), Number(hora[2]))
  );
}

async function montarDados(formData: FormData) {
  const tipoTexto = (formData.get("tipo") ?? "").toString();
  const tipo = (TIPOS as readonly string[]).includes(tipoTexto) ? (tipoTexto as (typeof TIPOS)[number]) : "REUNIAO";
  const inicio = dataHora(formData.get("data"), formData.get("horaInicio"));
  if (!inicio) throw new Error("Informe a data e o horário de início.");
  const fimInformado = dataHora(formData.get("data"), formData.get("horaFim"));
  if (fimInformado && fimInformado <= inicio) {
    throw new Error("O horário de término precisa ser depois do início.");
  }

  const processoId = textoOuNull(formData.get("processoId"));
  let clienteId = textoOuNull(formData.get("clienteId"));
  if (processoId) {
    // O cliente do compromisso é sempre o do processo escolhido.
    const processo = await prisma.processo.findUnique({ where: { id: processoId }, select: { clienteId: true } });
    clienteId = processo?.clienteId ?? clienteId;
  }

  return {
    tipo,
    titulo: textoOuNull(formData.get("titulo")) ?? (tipo === "REUNIAO" ? "Reunião" : "Diligência"),
    inicio,
    fim: fimInformado,
    local: textoOuNull(formData.get("local")),
    link: tipo === "REUNIAO" ? textoOuNull(formData.get("link")) : null,
    clienteId,
    processoId,
    observacoes: textoOuNull(formData.get("observacoes")),
  };
}

function revalidarAgenda(processoId?: string | null) {
  revalidatePath("/agenda");
  revalidatePath("/");
  if (processoId) revalidatePath(`/processos/${processoId}`);
}

export async function criarCompromisso(formData: FormData) {
  const dados = await montarDados(formData);
  await prisma.compromisso.create({ data: dados });
  revalidarAgenda(dados.processoId);
  redirect(`/agenda?data=${dados.inicio.toISOString().slice(0, 10)}`);
}

export async function atualizarCompromisso(id: string, formData: FormData) {
  const dados = await montarDados(formData);
  const status = (formData.get("status") ?? "").toString();
  await prisma.compromisso.update({
    where: { id },
    data: { ...dados, ...((STATUS as readonly string[]).includes(status) ? { status: status as (typeof STATUS)[number] } : {}) },
  });
  revalidarAgenda(dados.processoId);
  redirect(`/agenda?data=${dados.inicio.toISOString().slice(0, 10)}`);
}

export async function alterarStatusCompromisso(id: string, status: (typeof STATUS)[number]) {
  if (!(STATUS as readonly string[]).includes(status)) return;
  const compromisso = await prisma.compromisso.update({ where: { id }, data: { status } });
  revalidarAgenda(compromisso.processoId);
}

export async function excluirCompromisso(id: string) {
  const compromisso = await prisma.compromisso.delete({ where: { id } });
  revalidarAgenda(compromisso.processoId);
  redirect(`/agenda?data=${compromisso.inicio.toISOString().slice(0, 10)}`);
}
