"use server";

import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { salvarAnexo, removerAnexo, caminhoAbsolutoAnexo } from "@/lib/anexos";
import {
  gerarMensagemAtualizacao,
  ErroGeracaoMensagem,
  type DadosContexto,
} from "@/lib/ia-atualizacao";
import { enviarEmail } from "@/lib/email";
import {
  enviarWhatsapp,
  normalizarTelefoneWhatsapp,
  type ProvedorWhatsapp,
} from "@/lib/whatsapp";
import {
  formatarArea,
  LABEL_ORGAO_PROCESSO_ADMINISTRATIVO,
  LABEL_TIPO_PROCESSO_ADMINISTRATIVO,
  TIPOS_ANDAMENTO_ATUALIZACAO_JUDICIAL,
  TIPOS_ANDAMENTO_ATUALIZACAO_ADMINISTRATIVO,
} from "@/lib/formatacao";
import { LABEL_TRIBUNAL } from "@/lib/tribunais";
import type { TipoAndamento } from "@/app/generated/prisma/client";

type Vinculo = { processoId: string | null; processoAdministrativoId: string | null };

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
}

function parseDataOuNull(valor: FormDataEntryValue | null): Date | null {
  const texto = (valor ?? "").toString();
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return null;
  return new Date(Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])));
}

function hojeUtc(): Date {
  const agora = new Date();
  return new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()));
}

function tiposPermitidos(vinculo: Vinculo): readonly string[] {
  return vinculo.processoId
    ? TIPOS_ANDAMENTO_ATUALIZACAO_JUDICIAL
    : TIPOS_ANDAMENTO_ATUALIZACAO_ADMINISTRATIVO;
}

function validarTipoAndamento(vinculo: Vinculo, valor: FormDataEntryValue | null): TipoAndamento {
  const texto = (valor ?? "").toString();
  return tiposPermitidos(vinculo).includes(texto) ? (texto as TipoAndamento) : "OUTRO";
}

/** Caminho da tela do processo (judicial ou administrativo) ao qual a atualização pertence. */
function caminhoProcesso(vinculo: Vinculo): string {
  return vinculo.processoId
    ? `/processos/${vinculo.processoId}`
    : `/processos-administrativos/${vinculo.processoAdministrativoId}`;
}

function caminhoRevisao(vinculo: Vinculo, atualizacaoId: string): string {
  return `${caminhoProcesso(vinculo)}/atualizacoes/${atualizacaoId}`;
}

/** Cliente e linhas descritivas do processo para o contexto da IA. */
async function carregarContexto(
  vinculo: Vinculo
): Promise<Pick<DadosContexto, "nomeCliente" | "linhasProcesso">> {
  if (vinculo.processoId) {
    const processo = await prisma.processo.findUniqueOrThrow({
      where: { id: vinculo.processoId },
      include: { cliente: true },
    });
    const linhas = [
      `Processo judicial nº ${processo.numeroProcesso ?? "não informado"}`,
      `Área: ${formatarArea(processo.area, processo.areaOutraDescricao)}`,
    ];
    if (processo.tribunal) {
      linhas.push(`Tribunal: ${LABEL_TRIBUNAL[processo.tribunal] ?? processo.tribunal}`);
    }
    return { nomeCliente: processo.cliente.nome, linhasProcesso: linhas };
  }

  const processo = await prisma.processoAdministrativo.findUniqueOrThrow({
    where: { id: vinculo.processoAdministrativoId as string },
    include: { cliente: true },
  });
  return {
    nomeCliente: processo.cliente.nome,
    linhasProcesso: [
      `Processo administrativo — ${LABEL_ORGAO_PROCESSO_ADMINISTRATIVO[processo.orgao]}`,
      `Tipo: ${LABEL_TIPO_PROCESSO_ADMINISTRATIVO[processo.tipo]}`,
      `Protocolo: ${processo.numeroProtocolo ?? "não informado"}`,
    ],
  };
}

/**
 * Chama a IA e devolve os campos a gravar: a mensagem gerada, ou o erro em
 * erroGeracao (a atualização é salva mesmo assim, para escrita manual).
 */
async function gerarParaProcesso(
  vinculo: Vinculo,
  caminhoArquivo: string,
  orientacoes: string | null,
  ignorarAtualizacaoId?: string
) {
  const ultimaEnviada = await prisma.atualizacaoCliente.findFirst({
    where: {
      processoId: vinculo.processoId,
      processoAdministrativoId: vinculo.processoAdministrativoId,
      id: ignorarAtualizacaoId ? { not: ignorarAtualizacaoId } : undefined,
      OR: [{ whatsappEnviadoEm: { not: null } }, { emailEnviadoEm: { not: null } }],
    },
    orderBy: { criadoEm: "desc" },
  });
  const dataUltimaAtualizacao = ultimaEnviada
    ? (ultimaEnviada.whatsappEnviadoEm ?? ultimaEnviada.emailEnviadoEm)
    : null;

  try {
    const contexto = await carregarContexto(vinculo);
    const pdf = await readFile(caminhoAbsolutoAnexo(caminhoArquivo));
    const gerado = await gerarMensagemAtualizacao(pdf, {
      ...contexto,
      tiposAndamento: tiposPermitidos(vinculo),
      dataUltimaAtualizacao,
      orientacoes,
    });
    return {
      ...gerado,
      tipoAndamento: gerado.tipoAndamento as TipoAndamento,
      erroGeracao: null,
    };
  } catch (erro) {
    const mensagemErro =
      erro instanceof ErroGeracaoMensagem
        ? erro.message
        : `Erro inesperado ao gerar a mensagem: ${erro instanceof Error ? erro.message : "desconhecido"}`;
    console.error("Falha ao gerar atualização ao cliente:", erro);
    return { erroGeracao: mensagemErro };
  }
}

export async function criarAtualizacaoCliente(formData: FormData) {
  const vinculo: Vinculo = {
    processoId: textoOuNull(formData.get("processoId")),
    processoAdministrativoId: textoOuNull(formData.get("processoAdministrativoId")),
  };
  if (!vinculo.processoId && !vinculo.processoAdministrativoId) {
    throw new Error("Processo é obrigatório");
  }
  if (vinculo.processoId && vinculo.processoAdministrativoId) {
    throw new Error("A atualização não pode se vincular a um processo judicial e administrativo ao mesmo tempo");
  }

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    throw new Error("Selecione o PDF do processo");
  }
  const ehPdf =
    arquivo.type === "application/pdf" || arquivo.name.toLowerCase().endsWith(".pdf");
  if (!ehPdf) throw new Error("O arquivo precisa ser um PDF");

  const orientacoes = textoOuNull(formData.get("orientacoes"));
  const dadosArquivo = await salvarAnexo(arquivo);
  const gerado = await gerarParaProcesso(vinculo, dadosArquivo.caminho, orientacoes);

  const atualizacao = await prisma.atualizacaoCliente.create({
    data: {
      ...vinculo,
      arquivoNome: dadosArquivo.nome,
      arquivoCaminho: dadosArquivo.caminho,
      arquivoTipo: "application/pdf",
      orientacoes,
      ...gerado,
    },
  });

  revalidatePath(caminhoProcesso(vinculo));
  redirect(caminhoRevisao(vinculo, atualizacao.id));
}

export async function regenerarAtualizacaoCliente(formData: FormData) {
  const id = (formData.get("id") ?? "").toString();
  const atualizacao = await prisma.atualizacaoCliente.findUniqueOrThrow({ where: { id } });
  const orientacoes = textoOuNull(formData.get("orientacoes"));

  const gerado = await gerarParaProcesso(
    atualizacao,
    atualizacao.arquivoCaminho,
    orientacoes,
    atualizacao.id
  );

  // Em caso de falha, mantém o texto que já existia em vez de apagá-lo.
  await prisma.atualizacaoCliente.update({
    where: { id },
    data: { orientacoes, ...gerado },
  });

  revalidatePath(caminhoRevisao(atualizacao, id));
  redirect(caminhoRevisao(atualizacao, id));
}

/**
 * Registra o andamento do processo a partir da atualização (uma única vez),
 * reaproveitando o PDF já guardado como anexo do andamento.
 */
async function registrarAndamento(atualizacaoId: string): Promise<void> {
  const atualizacao = await prisma.atualizacaoCliente.findUniqueOrThrow({
    where: { id: atualizacaoId },
  });
  if (atualizacao.andamentoId) return;

  const andamento = await prisma.andamento.create({
    data: {
      processoId: atualizacao.processoId,
      processoAdministrativoId: atualizacao.processoAdministrativoId,
      data: atualizacao.dataMovimentacao ?? hojeUtc(),
      tipo: atualizacao.tipoAndamento ?? "OUTRO",
      descricao:
        atualizacao.resumoInterno ||
        `Atualização ao cliente a partir do PDF ${atualizacao.arquivoNome}.`,
      arquivoNome: atualizacao.arquivoNome,
      arquivoCaminho: atualizacao.arquivoCaminho,
      arquivoTipo: atualizacao.arquivoTipo,
    },
  });

  await prisma.atualizacaoCliente.update({
    where: { id: atualizacaoId },
    data: { andamentoId: andamento.id },
  });
}

/**
 * Salva o texto revisado e, conforme o botão clicado (campo "acao"), envia
 * por WhatsApp ou e-mail — sempre com o texto que está na tela no momento —
 * ou só registra o andamento. O primeiro envio bem-sucedido registra o
 * andamento automaticamente; depois disso, edições do resumo/tipo/data
 * atualizam o andamento já registrado.
 */
export async function salvarEEnviarAtualizacaoCliente(formData: FormData) {
  const id = (formData.get("id") ?? "").toString();
  const acao = (formData.get("acao") ?? "salvar").toString();

  const existente = await prisma.atualizacaoCliente.findUniqueOrThrow({ where: { id } });
  const resumoInterno = textoOuNull(formData.get("resumoInterno"));
  const tipoAndamento = validarTipoAndamento(existente, formData.get("tipoAndamento"));
  const dataMovimentacao = parseDataOuNull(formData.get("dataMovimentacao"));

  const atualizacao = await prisma.atualizacaoCliente.update({
    where: { id },
    data: {
      resumoInterno,
      tipoAndamento,
      dataMovimentacao,
      mensagemWhatsapp: (formData.get("mensagemWhatsapp") ?? "").toString().trim(),
      assuntoEmail: (formData.get("assuntoEmail") ?? "").toString().trim(),
      corpoEmail: (formData.get("corpoEmail") ?? "").toString().trim(),
    },
    include: {
      processo: { include: { cliente: true } },
      processoAdministrativo: { include: { cliente: true } },
    },
  });
  const cliente = (atualizacao.processo ?? atualizacao.processoAdministrativo)!.cliente;

  if (atualizacao.andamentoId) {
    await prisma.andamento.update({
      where: { id: atualizacao.andamentoId },
      data: {
        tipo: tipoAndamento,
        ...(dataMovimentacao ? { data: dataMovimentacao } : {}),
        ...(resumoInterno ? { descricao: resumoInterno } : {}),
      },
    });
  }

  let enviado = false;

  if (acao === "whatsapp") {
    const numero = normalizarTelefoneWhatsapp(cliente.telefone);
    const config = await prisma.configuracaoNotificacao.findUnique({ where: { id: 1 } });
    let erro: string | null = null;

    if (!numero) {
      erro = "O cliente não tem telefone válido no cadastro (informe com DDD).";
    } else if (!atualizacao.mensagemWhatsapp) {
      erro = "A mensagem de WhatsApp está vazia.";
    } else if (!config?.provedor || !config.credencialApi) {
      erro = "WhatsApp não configurado. Preencha o provedor em Configurações.";
    } else {
      const resultado = await enviarWhatsapp(
        {
          provedor: config.provedor as ProvedorWhatsapp,
          urlBaseApi: config.urlBaseApi,
          instanciaId: config.instanciaId,
          credencialApi: config.credencialApi,
          clientTokenApi: config.clientTokenApi,
        },
        numero,
        atualizacao.mensagemWhatsapp
      );
      if (!resultado.sucesso) erro = resultado.erro;
    }

    await prisma.atualizacaoCliente.update({
      where: { id },
      data: erro
        ? { whatsappErro: erro }
        : { whatsappErro: null, whatsappEnviadoEm: new Date() },
    });
    enviado = !erro;
  }

  if (acao === "email") {
    let erro: string | null = null;
    if (!cliente.email) {
      erro = "O cliente não tem e-mail no cadastro.";
    } else if (!atualizacao.assuntoEmail || !atualizacao.corpoEmail) {
      erro = "Preencha o assunto e o texto do e-mail.";
    } else {
      const resultado = await enviarEmail(
        cliente.email,
        atualizacao.assuntoEmail,
        atualizacao.corpoEmail
      );
      if (!resultado.sucesso) erro = resultado.erro;
    }

    await prisma.atualizacaoCliente.update({
      where: { id },
      data: erro ? { emailErro: erro } : { emailErro: null, emailEnviadoEm: new Date() },
    });
    enviado = !erro;
  }

  if (acao === "andamento" || enviado) {
    await registrarAndamento(id);
  }

  revalidatePath(caminhoProcesso(atualizacao));
  revalidatePath(caminhoRevisao(atualizacao, id));
  redirect(caminhoRevisao(atualizacao, id));
}

export async function excluirAtualizacaoCliente(formData: FormData) {
  const id = (formData.get("id") ?? "").toString();
  const atualizacao = await prisma.atualizacaoCliente.delete({ where: { id } });

  // O andamento registrado (se houver) continua no histórico do processo e
  // usa o mesmo PDF — nesse caso o arquivo fica.
  const andamentoUsaArquivo = await prisma.andamento.count({
    where: { arquivoCaminho: atualizacao.arquivoCaminho },
  });
  if (andamentoUsaArquivo === 0) {
    await removerAnexo(atualizacao.arquivoCaminho);
  }

  revalidatePath(caminhoProcesso(atualizacao));
  redirect(caminhoProcesso(atualizacao));
}
