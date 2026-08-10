import { prisma } from "@/lib/prisma";
import { buscarPublicacoesDjen, extrairNumeroProcesso } from "@/lib/djen";
import { enviarWhatsapp, type ProvedorWhatsapp } from "@/lib/whatsapp";
import { formatarData } from "@/lib/formatacao";

export type ResumoVerificacaoPublicacoes = {
  executado: boolean;
  motivo?: string;
  novas: number;
  vinculadas: number;
  orfas: number;
  whatsappEnviado: boolean;
};

function horarioJaChegou(horarioConsulta: string, agora: Date): boolean {
  const [horaConfigurada, minutoConfigurado] = horarioConsulta.split(":").map(Number);
  const minutosConfigurados = (horaConfigurada || 0) * 60 + (minutoConfigurado || 0);
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  return minutosAgora >= minutosConfigurados;
}

function mesmoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Marca a publicação como lida — chamada diretamente ao renderizar a tela de detalhe. */
export async function marcarPublicacaoComoLida(id: string) {
  await prisma.publicacao.updateMany({
    where: { id, lida: false },
    data: { lida: true },
  });
}

/**
 * Vincula (ou não) uma publicação a um Processo cadastrado a partir do
 * número extraído do texto, e — quando encontra correspondência — cria
 * automaticamente o Andamento correspondente. Reaproveitada tanto pela
 * importação automática quanto pela vinculação manual (aba Órfãs).
 */
export async function vincularPublicacaoAoProcesso(
  publicacaoId: string,
  numeroProcesso: string
) {
  const processo = await prisma.processo.findFirst({
    where: { numeroProcesso },
    select: { id: true },
  });

  if (!processo) return null;

  const publicacao = await prisma.publicacao.update({
    where: { id: publicacaoId },
    data: { processoId: processo.id, statusVinculo: "VINCULADA" },
  });

  await prisma.andamento.create({
    data: {
      processoId: processo.id,
      data: publicacao.dataPublicacao,
      tipo: "PUBLICACAO",
      descricao: publicacao.textoPublicacao,
    },
  });

  return processo.id;
}

/**
 * Rotina diária: consulta o DJEN pela OAB/seccional configurados, importa
 * publicações novas (idempotente via idExternoDjen), tenta vincular a um
 * Processo já cadastrado pelo número extraído do texto, e — havendo
 * publicações novas — envia um resumo por WhatsApp reaproveitando a
 * configuração do módulo de Notificações de prazo.
 */
export async function verificarEImportarPublicacoes(
  agora: Date = new Date()
): Promise<ResumoVerificacaoPublicacoes> {
  const config = await prisma.configuracaoPublicacoes.findUnique({ where: { id: 1 } });

  if (!config || !config.numeroOab || !config.seccionalOab) {
    return {
      executado: false,
      motivo: "Configuração de publicações incompleta (número da OAB ou seccional ausente).",
      novas: 0,
      vinculadas: 0,
      orfas: 0,
      whatsappEnviado: false,
    };
  }

  if (!horarioJaChegou(config.horarioConsulta, agora)) {
    return {
      executado: false,
      motivo: `Ainda não chegou o horário configurado (${config.horarioConsulta}).`,
      novas: 0,
      vinculadas: 0,
      orfas: 0,
      whatsappEnviado: false,
    };
  }

  if (config.ultimaExecucao && mesmoDia(config.ultimaExecucao, agora)) {
    return {
      executado: false,
      motivo: "Rotina já executada hoje.",
      novas: 0,
      vinculadas: 0,
      orfas: 0,
      whatsappEnviado: false,
    };
  }

  const doisDiasAtras = new Date(agora);
  doisDiasAtras.setDate(doisDiasAtras.getDate() - 2);

  const itensDjen = await buscarPublicacoesDjen(
    config.numeroOab,
    config.seccionalOab,
    doisDiasAtras,
    agora
  );

  let novas = 0;
  let vinculadas = 0;
  let orfas = 0;

  for (const item of itensDjen) {
    const jaExiste = await prisma.publicacao.findUnique({
      where: { idExternoDjen: item.idExterno },
      select: { id: true },
    });
    if (jaExiste) continue;

    const numeroProcessoIdentificado =
      item.numeroProcesso ?? extrairNumeroProcesso(item.texto);

    const publicacao = await prisma.publicacao.create({
      data: {
        idExternoDjen: item.idExterno,
        numeroProcessoIdentificado,
        dataPublicacao: item.dataPublicacao,
        tribunalOrgao: item.tribunalOrgao,
        textoPublicacao: item.texto,
        statusVinculo: "ORFA",
      },
    });

    novas += 1;

    const processoIdVinculado = numeroProcessoIdentificado
      ? await vincularPublicacaoAoProcesso(publicacao.id, numeroProcessoIdentificado)
      : null;

    if (processoIdVinculado) {
      vinculadas += 1;
    } else {
      orfas += 1;
    }
  }

  let whatsappEnviado = false;
  if (novas > 0) {
    const configNotificacao = await prisma.configuracaoNotificacao.findUnique({
      where: { id: 1 },
    });
    if (
      configNotificacao?.numeroWhatsapp &&
      configNotificacao.provedor &&
      configNotificacao.credencialApi
    ) {
      const mensagem = [
        "📰 Publicações no DJEN",
        `${novas} nova(s) publicação(ões) encontrada(s) hoje (${formatarData(agora)}).`,
        `${vinculadas} vinculada(s) a processo(s) cadastrado(s), ${orfas} sem correspondência.`,
      ].join("\n");

      const resultado = await enviarWhatsapp(
        {
          provedor: configNotificacao.provedor as ProvedorWhatsapp,
          urlBaseApi: configNotificacao.urlBaseApi,
          instanciaId: configNotificacao.instanciaId,
          credencialApi: configNotificacao.credencialApi,
        },
        configNotificacao.numeroWhatsapp,
        mensagem
      );
      whatsappEnviado = resultado.sucesso;
      if (!resultado.sucesso) {
        console.error("Falha ao enviar resumo de publicações por WhatsApp:", resultado.erro);
      }
    }
  }

  await prisma.configuracaoPublicacoes.update({
    where: { id: 1 },
    data: { ultimaExecucao: agora },
  });

  return { executado: true, novas, vinculadas, orfas, whatsappEnviado };
}
