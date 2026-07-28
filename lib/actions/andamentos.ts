"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { calcularDataFinal, type TipoContagem } from "@/lib/prazos";
import { salvarAnexo, removerAnexo } from "@/lib/anexos";
import {
  TIPOS_ANDAMENTO,
  TIPOS_ANDAMENTO_ADMINISTRATIVO,
  RESULTADOS_RECURSO,
  RESULTADOS_RECURSO_ADMINISTRATIVO,
} from "@/lib/formatacao";
import type { TipoAndamento } from "@/app/generated/prisma/client";

const TIPOS_PRAZO_RAPIDO = ["PETICAO", "RECURSO", "MANIFESTACAO", "OUTRO"] as const;

/** União dos tipos válidos nos dois contextos (judicial e administrativo) — a UI já restringe as opções mostradas, aqui só validamos o valor recebido. */
const TODOS_TIPOS_ANDAMENTO = Array.from(
  new Set<string>([...TIPOS_ANDAMENTO, ...TIPOS_ANDAMENTO_ADMINISTRATIVO])
);

function validarTipoAndamento(valor: FormDataEntryValue | null): TipoAndamento {
  const texto = (valor ?? "").toString();
  return TODOS_TIPOS_ANDAMENTO.includes(texto) ? (texto as TipoAndamento) : "OUTRO";
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

function validarResultadoRecursoAdministrativo(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (RESULTADOS_RECURSO_ADMINISTRATIVO as readonly string[]).includes(texto)
    ? (texto as (typeof RESULTADOS_RECURSO_ADMINISTRATIVO)[number])
    : null;
}

function parseData(valor: FormDataEntryValue | null): Date {
  const texto = (valor ?? "").toString();
  const [ano, mes, dia] = texto.split("-").map(Number);
  return new Date(Date.UTC(ano, (mes || 1) - 1, dia || 1));
}

export async function criarAndamento(formData: FormData) {
  const processoId = textoOuNull(formData.get("processoId"));
  const processoAdministrativoId = textoOuNull(formData.get("processoAdministrativoId"));
  if (!processoId && !processoAdministrativoId) {
    throw new Error("Processo é obrigatório");
  }
  if (processoId && processoAdministrativoId) {
    throw new Error("Andamento não pode se vincular a um processo judicial e administrativo ao mesmo tempo");
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

  const recursoId = processoId ? textoOuNull(formData.get("recursoId")) : null;
  const recursoAdministrativoId = processoAdministrativoId
    ? textoOuNull(formData.get("recursoAdministrativoId"))
    : null;

  const andamento = await prisma.andamento.create({
    data: {
      processoId,
      processoAdministrativoId,
      data,
      tipo,
      descricao,
      arquivoNome: dadosArquivo?.nome ?? null,
      arquivoCaminho: dadosArquivo?.caminho ?? null,
      arquivoTipo: dadosArquivo?.tipo ?? null,
      recursoId,
      recursoAdministrativoId,
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

  if (recursoAdministrativoId && tipo === "REMESSA_RECURSO_ADMINISTRATIVO") {
    await prisma.recursoAdministrativo.update({
      where: { id: recursoAdministrativoId },
      data: { status: "EM_TRAMITACAO" },
    });
  }

  if (recursoAdministrativoId && tipo === "JULGAMENTO_RECURSO") {
    const resultado = validarResultadoRecursoAdministrativo(formData.get("resultado"));
    if (!resultado) {
      throw new Error("Resultado é obrigatório para julgamento de recurso");
    }
    await prisma.recursoAdministrativo.update({
      where: { id: recursoAdministrativoId },
      data: { status: "JULGADO", resultado, dataJulgamento: data },
    });
  }

  const geraPrazo = processoId && formData.get("geraPrazo") === "on";
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
        processoId: processoId as string,
        tipo: tipoPrazo,
        dataBase: dataBasePrazo,
        dias,
        contagem,
        dataFinal,
        origemAndamentoId: andamento.id,
      },
    });
  }

  const caminhoDetalhe = processoId
    ? `/processos/${processoId}`
    : `/processos-administrativos/${processoAdministrativoId}`;

  revalidatePath(caminhoDetalhe);
  revalidatePath("/prazos");
  revalidatePath("/");
  redirect(caminhoDetalhe);
}

export async function excluirAndamento(id: string) {
  const andamento = await prisma.andamento.delete({ where: { id } });
  if (andamento.arquivoCaminho) {
    await removerAnexo(andamento.arquivoCaminho);
  }

  const caminhoDetalhe = andamento.processoId
    ? `/processos/${andamento.processoId}`
    : `/processos-administrativos/${andamento.processoAdministrativoId}`;

  revalidatePath(caminhoDetalhe);
  revalidatePath("/prazos");
  revalidatePath("/");
  redirect(caminhoDetalhe);
}
