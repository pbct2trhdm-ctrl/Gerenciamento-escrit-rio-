"use server";

import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { salvarAnexo, removerAnexo, caminhoAbsolutoAnexo } from "@/lib/anexos";
import {
  gerarMensagemAtualizacao,
  ErroGeracaoMensagem,
  type MensagemGerada,
} from "@/lib/ia-atualizacao";
import { enviarEmail } from "@/lib/email";
import {
  enviarWhatsapp,
  normalizarTelefoneWhatsapp,
  type ProvedorWhatsapp,
} from "@/lib/whatsapp";
import { formatarArea } from "@/lib/formatacao";
import { LABEL_TRIBUNAL } from "@/lib/tribunais";

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
}

function caminhoRevisao(processoId: string, atualizacaoId: string): string {
  return `/processos/${processoId}/atualizacoes/${atualizacaoId}`;
}

/**
 * Chama a IA e devolve os campos a gravar: a mensagem gerada, ou o erro em
 * erroGeracao (a atualização é salva mesmo assim, para escrita manual).
 */
async function gerarParaProcesso(
  processoId: string,
  caminhoArquivo: string,
  orientacoes: string | null,
  ignorarAtualizacaoId?: string
): Promise<Partial<MensagemGerada> & { erroGeracao: string | null }> {
  const processo = await prisma.processo.findUniqueOrThrow({
    where: { id: processoId },
    include: { cliente: true },
  });

  const ultimaEnviada = await prisma.atualizacaoCliente.findFirst({
    where: {
      processoId,
      id: ignorarAtualizacaoId ? { not: ignorarAtualizacaoId } : undefined,
      OR: [{ whatsappEnviadoEm: { not: null } }, { emailEnviadoEm: { not: null } }],
    },
    orderBy: { criadoEm: "desc" },
  });
  const dataUltimaAtualizacao = ultimaEnviada
    ? (ultimaEnviada.whatsappEnviadoEm ?? ultimaEnviada.emailEnviadoEm)
    : null;

  try {
    const pdf = await readFile(caminhoAbsolutoAnexo(caminhoArquivo));
    const mensagem = await gerarMensagemAtualizacao(pdf, {
      nomeCliente: processo.cliente.nome,
      numeroProcesso: processo.numeroProcesso,
      area: formatarArea(processo.area, processo.areaOutraDescricao),
      tribunal: processo.tribunal ? (LABEL_TRIBUNAL[processo.tribunal] ?? processo.tribunal) : null,
      dataUltimaAtualizacao,
      orientacoes,
    });
    return { ...mensagem, erroGeracao: null };
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
  const processoId = textoOuNull(formData.get("processoId"));
  if (!processoId) throw new Error("Processo é obrigatório");

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    throw new Error("Selecione o PDF do processo");
  }
  const ehPdf =
    arquivo.type === "application/pdf" || arquivo.name.toLowerCase().endsWith(".pdf");
  if (!ehPdf) throw new Error("O arquivo precisa ser um PDF");

  const orientacoes = textoOuNull(formData.get("orientacoes"));
  const dadosArquivo = await salvarAnexo(arquivo);
  const gerado = await gerarParaProcesso(processoId, dadosArquivo.caminho, orientacoes);

  const atualizacao = await prisma.atualizacaoCliente.create({
    data: {
      processoId,
      arquivoNome: dadosArquivo.nome,
      arquivoCaminho: dadosArquivo.caminho,
      arquivoTipo: "application/pdf",
      orientacoes,
      ...gerado,
    },
  });

  revalidatePath(`/processos/${processoId}`);
  redirect(caminhoRevisao(processoId, atualizacao.id));
}

export async function regenerarAtualizacaoCliente(formData: FormData) {
  const id = (formData.get("id") ?? "").toString();
  const atualizacao = await prisma.atualizacaoCliente.findUniqueOrThrow({ where: { id } });
  const orientacoes = textoOuNull(formData.get("orientacoes"));

  const gerado = await gerarParaProcesso(
    atualizacao.processoId,
    atualizacao.arquivoCaminho,
    orientacoes,
    atualizacao.id
  );

  // Em caso de falha, mantém o texto que já existia em vez de apagá-lo.
  await prisma.atualizacaoCliente.update({
    where: { id },
    data: { orientacoes, ...gerado },
  });

  revalidatePath(caminhoRevisao(atualizacao.processoId, id));
  redirect(caminhoRevisao(atualizacao.processoId, id));
}

/**
 * Salva o texto revisado e, conforme o botão clicado (campo "acao"), envia
 * por WhatsApp ou e-mail — sempre com o texto que está na tela no momento.
 */
export async function salvarEEnviarAtualizacaoCliente(formData: FormData) {
  const id = (formData.get("id") ?? "").toString();
  const acao = (formData.get("acao") ?? "salvar").toString();

  const atualizacao = await prisma.atualizacaoCliente.update({
    where: { id },
    data: {
      mensagemWhatsapp: (formData.get("mensagemWhatsapp") ?? "").toString().trim(),
      assuntoEmail: (formData.get("assuntoEmail") ?? "").toString().trim(),
      corpoEmail: (formData.get("corpoEmail") ?? "").toString().trim(),
    },
    include: { processo: { include: { cliente: true } } },
  });
  const cliente = atualizacao.processo.cliente;

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
  }

  revalidatePath(`/processos/${atualizacao.processoId}`);
  revalidatePath(caminhoRevisao(atualizacao.processoId, id));
  redirect(caminhoRevisao(atualizacao.processoId, id));
}

export async function excluirAtualizacaoCliente(formData: FormData) {
  const id = (formData.get("id") ?? "").toString();
  const atualizacao = await prisma.atualizacaoCliente.delete({ where: { id } });
  await removerAnexo(atualizacao.arquivoCaminho);

  revalidatePath(`/processos/${atualizacao.processoId}`);
  redirect(`/processos/${atualizacao.processoId}`);
}
