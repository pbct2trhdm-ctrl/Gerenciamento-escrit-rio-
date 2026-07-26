import { prisma } from "@/lib/prisma";
import { diasRestantes } from "@/lib/prazos";
import { LABEL_TIPO_PRAZO, formatarData } from "@/lib/formatacao";
import { enviarWhatsapp, type ProvedorWhatsapp } from "@/lib/whatsapp";

export type ResumoVerificacao = {
  executado: boolean;
  motivo?: string;
  processados: number;
  enviados: number;
  falhas: number;
};

function horarioJaChegou(horarioDisparo: string, agora: Date): boolean {
  const [horaConfigurada, minutoConfigurado] = horarioDisparo.split(":").map(Number);
  const minutosConfigurados = (horaConfigurada || 0) * 60 + (minutoConfigurado || 0);
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  return minutosAgora >= minutosConfigurados;
}

function inicioDoDiaLocal(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function montarMensagem(prazo: {
  tipo: string;
  dataFinal: Date;
  processo: { numeroProcesso: string | null; cliente: { nome: string } };
}, diasRestantesPrazo: number): string {
  const linhaDias =
    diasRestantesPrazo === 0
      ? "Vence hoje"
      : diasRestantesPrazo === 1
        ? "Vence amanhã"
        : `Faltam ${diasRestantesPrazo} dias`;

  return [
    "⚖️ Lembrete de prazo processual",
    `Cliente: ${prazo.processo.cliente.nome}`,
    `Processo: ${prazo.processo.numeroProcesso ?? "sem número"}`,
    `Tipo: ${LABEL_TIPO_PRAZO[prazo.tipo] ?? prazo.tipo}`,
    `Vencimento: ${formatarData(prazo.dataFinal)}`,
    linhaDias,
  ].join("\n");
}

/**
 * Verifica os prazos pendentes e dispara os alertas de WhatsApp cujo número de
 * dias restantes bate com a antecedência configurada (do prazo, ou o padrão
 * geral). Idempotente por (prazo, dia): pode ser chamada quantas vezes forem
 * necessárias no mesmo dia sem duplicar envios, já registrados em Notificacao.
 */
export async function verificarEDispararNotificacoes(
  agora: Date = new Date()
): Promise<ResumoVerificacao> {
  const config = await prisma.configuracaoNotificacao.findUnique({ where: { id: 1 } });

  if (!config || !config.numeroWhatsapp || !config.provedor || !config.credencialApi) {
    return {
      executado: false,
      motivo: "Configuração de notificações incompleta (número, provedor ou credencial ausente).",
      processados: 0,
      enviados: 0,
      falhas: 0,
    };
  }

  if (!horarioJaChegou(config.horarioDisparo, agora)) {
    return {
      executado: false,
      motivo: `Ainda não chegou o horário configurado (${config.horarioDisparo}).`,
      processados: 0,
      enviados: 0,
      falhas: 0,
    };
  }

  const hoje = inicioDoDiaLocal(agora);

  const prazosPendentes = await prisma.prazo.findMany({
    where: { status: "PENDENTE" },
    include: { processo: { include: { cliente: true } } },
  });

  let enviados = 0;
  let falhas = 0;
  let processados = 0;

  for (const prazo of prazosPendentes) {
    const restantes = diasRestantes(prazo.dataFinal, agora);
    const antecedencia = prazo.diasAntecedenciaNotificacao ?? config.antecedenciaPadraoDias;
    if (restantes !== antecedencia) continue;

    const jaEnviadaHoje = await prisma.notificacao.findFirst({
      where: { prazoId: prazo.id, dataEnvio: { gte: hoje } },
    });
    if (jaEnviadaHoje) continue;

    processados += 1;
    const mensagem = montarMensagem(prazo, restantes);

    const resultado = await enviarWhatsapp(
      {
        provedor: config.provedor as ProvedorWhatsapp,
        urlBaseApi: config.urlBaseApi,
        instanciaId: config.instanciaId,
        credencialApi: config.credencialApi,
      },
      config.numeroWhatsapp,
      mensagem
    );

    if (resultado.sucesso) {
      enviados += 1;
    } else {
      falhas += 1;
      console.error(`Falha ao enviar notificação do prazo ${prazo.id}:`, resultado.erro);
    }

    await prisma.notificacao.create({
      data: {
        prazoId: prazo.id,
        status: resultado.sucesso ? "ENVIADO" : "FALHA",
        mensagemEnviada: mensagem,
      },
    });
  }

  return { executado: true, processados, enviados, falhas };
}
