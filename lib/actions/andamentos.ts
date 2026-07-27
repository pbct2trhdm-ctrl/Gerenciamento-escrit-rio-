"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { calcularDataFinal, type TipoContagem } from "@/lib/prazos";
import { salvarAnexo, removerAnexo } from "@/lib/anexos";
import { TIPOS_ANDAMENTO, RESULTADOS_RECURSO } from "@/lib/formatacao";

const TIPOS_PRAZO_RAPIDO = ["PETICAO", "RECURSO", "MANIFESTACAO", "OUTRO"] as const;

function validarTipoAndamento(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (TIPOS_ANDAMENTO as readonly string[]).includes(texto)
    ? (texto as (typeof TIPOS_ANDAMENTO)[number])
    : "OUTRO";
}

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
}

function validarResultadoRecurso(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (RESULTADOS_RECURSO as readonly string[]).includes(texto)
    ? (texto as (typeof RESULTADOS_RECURSO)[number])
    : null;
}

function parseData(valor: FormDataEntryValue | null): Date {
  const texto = (valor ?? "").toString();
  const [ano, mes, dia] = texto.split("-").map(Number);
  return new Date(Date.UTC(ano, (mes || 1) - 1, dia || 1));
}

export async function criarAndamento(formData: FormData) {
  const processoId = (formData.get("processoId") ?? "").toString();
  if (!processoId) {
    throw new Error("Processo é obrigatório");
  }

  const data = parseData(formData.get("data"));
  const tipo = validarTipoAndamento(formData.get("tipo"));
  const descricao = (formData.get("descricao") ?? "").toString().trim();
  if (!descricao) {
    throw new Error("Descrição é obrigatória");
  }

  const arquivo = formData.get("arquivo");
  const dadosArquivo =
    arquivo instanceof File && arquivo.size > 0 ? await salvarAnexo(arquivo) : null;

  const recursoId = textoOuNull(formData.get("recursoId"));

  const andamento = await prisma.andamento.create({
    data: {
      processoId,
      data,
      tipo,
      descricao,
      arquivoNome: dadosArquivo?.nome ?? null,
      arquivoCaminho: dadosArquivo?.caminho ?? null,
      arquivoTipo: dadosArquivo?.tipo ?? null,
      recursoId,
    },
  });

  if (recursoId && tipo === "REMESSA_2_GRAU") {
    await prisma.recurso.update({
      where: { id: recursoId },
      data: { status: "EM_TRAMITACAO_2_GRAU" },
    });
  }

  if (recursoId && tipo === "JULGAMENTO_RECURSO") {
    const resultado = validarResultadoRecurso(formData.get("resultado"));
    if (!resultado) {
      throw new Error("Resultado é obrigatório para julgamento de recurso");
    }
    await prisma.recurso.update({
      where: { id: recursoId },
      data: { status: "JULGADO", resultado, dataJulgamento: data },
    });
  }

  const geraPrazo = formData.get("geraPrazo") === "on";
  if (geraPrazo) {
    const dataBaseTexto = formData.get("prazoDataBase");
    const dataBasePrazo = dataBaseTexto ? parseData(dataBaseTexto) : data;
    const tipoPrazoTexto = (formData.get("prazoTipo") ?? "").toString();
    const tipoPrazo = (TIPOS_PRAZO_RAPIDO as readonly string[]).includes(tipoPrazoTexto)
      ? (tipoPrazoTexto as (typeof TIPOS_PRAZO_RAPIDO)[number])
      : "OUTRO";
    const dias = Number(formData.get("prazoDias") ?? 0);
    const contagem: TipoContagem =
      formData.get("prazoContagem") === "DIAS_CORRIDOS" ? "DIAS_CORRIDOS" : "DIAS_UTEIS";
    const dataFinal = calcularDataFinal(dataBasePrazo, dias, contagem);

    await prisma.prazo.create({
      data: {
        processoId,
        tipo: tipoPrazo,
        dataBase: dataBasePrazo,
        dias,
        contagem,
        dataFinal,
        origemAndamentoId: andamento.id,
      },
    });
  }

  revalidatePath(`/processos/${processoId}`);
  revalidatePath("/prazos");
  revalidatePath("/");
  redirect(`/processos/${processoId}`);
}

export async function excluirAndamento(id: string) {
  const andamento = await prisma.andamento.delete({ where: { id } });
  if (andamento.arquivoCaminho) {
    await removerAnexo(andamento.arquivoCaminho);
  }
  revalidatePath(`/processos/${andamento.processoId}`);
  revalidatePath("/prazos");
  revalidatePath("/");
  redirect(`/processos/${andamento.processoId}`);
}
