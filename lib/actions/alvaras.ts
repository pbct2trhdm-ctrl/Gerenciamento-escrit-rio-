"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { calcularAlvara } from "@/lib/alvara";
import { salvarAnexo, removerAnexo } from "@/lib/anexos";

const TIPOS_ANEXO_ACEITOS = ["application/pdf", "image/jpeg", "image/png"];

/** Anexos enviados no formulário (PDF do alvará e comprovante do repasse). */
async function salvarAnexosEnviados(formData: FormData) {
  const dados: Record<string, string | null> = {};
  for (const [campo, prefixo] of [
    ["arquivoAlvara", "arquivoAlvara"],
    ["comprovanteRepasse", "comprovanteRepasse"],
  ] as const) {
    const arquivo = formData.get(campo);
    if (!(arquivo instanceof File) || arquivo.size === 0) continue;
    const ehAceito =
      TIPOS_ANEXO_ACEITOS.includes(arquivo.type) || /\.(pdf|jpe?g|png)$/i.test(arquivo.name);
    if (!ehAceito) throw new Error("Anexe arquivos em PDF, JPG ou PNG.");
    const salvo = await salvarAnexo(arquivo);
    dados[`${prefixo}Nome`] = salvo.nome;
    dados[`${prefixo}Caminho`] = salvo.caminho;
    dados[`${prefixo}Tipo`] = salvo.tipo;
  }
  return dados;
}

const STATUS = ["AGUARDANDO_REPASSE", "REPASSADO"] as const;

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

function validarStatus(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (STATUS as readonly string[]).includes(texto)
    ? (texto as (typeof STATUS)[number])
    : "AGUARDANDO_REPASSE";
}

function numero(formData: FormData, campo: string): number {
  const valor = Number((formData.get(campo) ?? "").toString().replace(",", "."));
  return Number.isFinite(valor) && valor > 0 ? valor : 0;
}

function dadosComuns(formData: FormData) {
  const composicao = {
    valorTotal: numero(formData, "valorTotal"),
    impostoRetido: numero(formData, "impostoRetido"),
    tarifas: numero(formData, "tarifas"),
    honorariosContratuais: numero(formData, "honorariosContratuais"),
    honorariosSucumbencia: numero(formData, "honorariosSucumbencia"),
    reembolsoDespesas: numero(formData, "reembolsoDespesas"),
  };
  const { valorRetido, valorRepassado } = calcularAlvara(composicao);
  if (valorRepassado < 0) {
    throw new Error("Os descontos e valores retidos ultrapassam o valor do alvará.");
  }
  const percentualTexto = (formData.get("percentualContratual") ?? "").toString().trim();

  const honorarioSucumbencialId = (formData.get("honorarioSucumbencialId") ?? "").toString();

  return {
    honorarioSucumbencialId: honorarioSucumbencialId || null,
    ...composicao,
    percentualContratual: percentualTexto ? Number(percentualTexto.replace(",", ".")) : null,
    valorRetido,
    valorRepassado,
    dataRecebimento: parseData(formData.get("dataRecebimento")),
    dataRepasse: parseData(formData.get("dataRepasse")),
    status: validarStatus(formData.get("status")),
    bancoDestino: textoOuNull(formData.get("bancoDestino")),
    agenciaDestino: textoOuNull(formData.get("agenciaDestino")),
    contaDestino: textoOuNull(formData.get("contaDestino")),
    chavePixDestino: textoOuNull(formData.get("chavePixDestino")),
    observacoes: textoOuNull(formData.get("observacoes")),
  };
}

/**
 * Evita contar o mesmo dinheiro duas vezes no caixa: a parcela de honorários
 * escolhida passa a "paga por este alvará" (o valor entra pelo alvará), e a
 * sucumbência vinculada é marcada como recebida quando o alvará traz a parte
 * de sucumbência e já foi recebido.
 */
async function sincronizarVinculos(alvaraId: string, parcelaQuitadaId: string | null) {
  const alvara = await prisma.alvara.findUniqueOrThrow({ where: { id: alvaraId } });
  const hoje = new Date();
  const dataPagamento = alvara.dataRecebimento ?? new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));

  // Parcela que deixou de ser quitada por este alvará volta a pendente.
  await prisma.parcela.updateMany({
    where: { quitadaPorAlvaraId: alvaraId, id: parcelaQuitadaId ? { not: parcelaQuitadaId } : undefined },
    data: { quitadaPorAlvaraId: null, status: "PENDENTE", dataPagamento: null },
  });
  if (parcelaQuitadaId) {
    await prisma.parcela.update({
      where: { id: parcelaQuitadaId },
      data: { quitadaPorAlvaraId: alvaraId, status: "PAGO", dataPagamento },
    });
  }

  if (alvara.honorarioSucumbencialId && alvara.honorariosSucumbencia > 0 && alvara.dataRecebimento) {
    const sucumbencia = await prisma.honorarioSucumbencial.findUniqueOrThrow({
      where: { id: alvara.honorarioSucumbencialId },
    });
    await prisma.honorarioSucumbencial.update({
      where: { id: sucumbencia.id },
      data: {
        status: "RECEBIDO",
        dataRecebimento: alvara.dataRecebimento,
        valorDefinido: sucumbencia.valorDefinido ?? alvara.honorariosSucumbencia,
      },
    });
  }
}

export async function criarAlvara(formData: FormData) {
  const processoId = (formData.get("processoId") ?? "").toString();
  if (!processoId) {
    throw new Error("Processo é obrigatório");
  }

  // Proteção contra envio duplicado (duplo clique em Salvar): um alvará igual
  // (mesmo processo e valor) criado há menos de 2 minutos é reaproveitado.
  const dados = dadosComuns(formData);
  const recente = await prisma.alvara.findFirst({
    where: {
      processoId,
      valorTotal: dados.valorTotal,
      criadoEm: { gte: new Date(Date.now() - 2 * 60 * 1000) },
    },
  });
  if (recente) {
    redirect(`/financeiro/alvaras/${recente.id}`);
  }

  const alvara = await prisma.alvara.create({
    data: { processoId, ...dados, ...(await salvarAnexosEnviados(formData)) },
  });
  await sincronizarVinculos(alvara.id, textoOuNull(formData.get("parcelaQuitadaId")));

  revalidatePath("/financeiro/alvaras");
  revalidatePath("/financeiro");
  revalidatePath(`/processos/${processoId}`);
  redirect(`/financeiro/alvaras/${alvara.id}`);
}

export async function atualizarAlvara(id: string, formData: FormData) {
  const anterior = await prisma.alvara.findUniqueOrThrow({ where: { id } });
  const anexosNovos = await salvarAnexosEnviados(formData);
  const alvara = await prisma.alvara.update({
    where: { id },
    data: { ...dadosComuns(formData), ...anexosNovos },
  });
  // Arquivo substituído: apaga o anterior do disco.
  if (anexosNovos.arquivoAlvaraCaminho && anterior.arquivoAlvaraCaminho) {
    await removerAnexo(anterior.arquivoAlvaraCaminho);
  }
  if (anexosNovos.comprovanteRepasseCaminho && anterior.comprovanteRepasseCaminho) {
    await removerAnexo(anterior.comprovanteRepasseCaminho);
  }
  await sincronizarVinculos(alvara.id, textoOuNull(formData.get("parcelaQuitadaId")));

  revalidatePath("/financeiro/alvaras");
  revalidatePath("/financeiro");
  revalidatePath(`/processos/${alvara.processoId}`);
  redirect(`/financeiro/alvaras/${alvara.id}`);
}

export async function excluirAlvara(id: string) {
  // Parcela que constava como paga por este alvará volta a pendente.
  await prisma.parcela.updateMany({
    where: { quitadaPorAlvaraId: id },
    data: { quitadaPorAlvaraId: null, status: "PENDENTE", dataPagamento: null },
  });
  const alvara = await prisma.alvara.delete({ where: { id } });
  for (const caminho of [alvara.arquivoAlvaraCaminho, alvara.comprovanteRepasseCaminho]) {
    if (caminho) await removerAnexo(caminho);
  }
  revalidatePath("/financeiro/alvaras");
  revalidatePath("/financeiro");
  revalidatePath(`/processos/${alvara.processoId}`);
  redirect("/financeiro/alvaras");
}

export async function marcarAlvaraRepassado(id: string) {
  const alvara = await prisma.alvara.findUniqueOrThrow({ where: { id } });
  await prisma.alvara.update({
    where: { id },
    data: {
      status: "REPASSADO",
      dataRepasse: alvara.dataRepasse ?? new Date(),
    },
  });
  revalidatePath("/financeiro/alvaras");
  revalidatePath(`/financeiro/alvaras/${id}`);
  revalidatePath("/financeiro");
}

/** Remove um dos anexos do alvará ("alvara" ou "comprovante"). */
export async function removerAnexoAlvara(id: string, tipo: "alvara" | "comprovante") {
  const alvara = await prisma.alvara.findUniqueOrThrow({ where: { id } });
  if (tipo === "alvara" && alvara.arquivoAlvaraCaminho) {
    await removerAnexo(alvara.arquivoAlvaraCaminho);
    await prisma.alvara.update({
      where: { id },
      data: { arquivoAlvaraNome: null, arquivoAlvaraCaminho: null, arquivoAlvaraTipo: null },
    });
  }
  if (tipo === "comprovante" && alvara.comprovanteRepasseCaminho) {
    await removerAnexo(alvara.comprovanteRepasseCaminho);
    await prisma.alvara.update({
      where: { id },
      data: { comprovanteRepasseNome: null, comprovanteRepasseCaminho: null, comprovanteRepasseTipo: null },
    });
  }
  revalidatePath(`/financeiro/alvaras/${id}`);
}
