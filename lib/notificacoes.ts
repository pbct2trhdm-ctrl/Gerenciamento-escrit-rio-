import { prisma } from "@/lib/prisma";
import { diasRestantes } from "@/lib/prazos";
import { LABEL_TIPO_PRAZO, formatarData } from "@/lib/formatacao";
import { enviarWhatsapp, normalizarTelefoneWhatsapp, type ProvedorWhatsapp } from "@/lib/whatsapp";
import { diaDeIso, hojeIso, itensDaAgenda, somarDias, type ItemAgenda } from "@/lib/agenda";
import { LABEL_TIPO_COMPROMISSO, formatarHorario } from "@/lib/formatacao";

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

function montarMensagemAgenda(itens: ItemAgenda[]): string {
  const linhas = itens.map((item) => {
    const horario = item.fim
      ? `${formatarHorario(item.inicio)}–${formatarHorario(item.fim)}`
      : formatarHorario(item.inicio);
    const tipo = item.tipo === "AUDIENCIA" ? "Audiência" : LABEL_TIPO_COMPROMISSO[item.tipo];
    const detalhes = [item.cliente?.nome, item.local].filter(Boolean).join(" · ");
    return `• ${horario} — ${tipo}: ${item.titulo}${detalhes ? `\n   ${detalhes}` : ""}`;
  });
  return ["📅 Agenda de hoje", ...linhas].join("\n");
}

/**
 * Resumo da agenda do dia (reuniões, diligências e audiências) — uma vez por
 * dia, no primeiro disparo depois do horário configurado. Dia sem nada
 * agendado não gera mensagem.
 */
async function enviarResumoDaAgenda(
  config: { numeroWhatsapp: string; provedor: string; urlBaseApi: string | null; instanciaId: string | null; credencialApi: string; clientTokenApi: string | null; agendaEnviadaEm: Date | null },
  agora: Date
): Promise<"enviado" | "falha" | null> {
  const hojeLocal = inicioDoDiaLocal(agora);
  if (config.agendaEnviadaEm && config.agendaEnviadaEm >= hojeLocal) return null;

  const dia = diaDeIso(hojeIso(agora))!;
  const itens = (await itensDaAgenda(dia, somarDias(dia, 1))).filter((i) => i.status === "AGENDADO");
  await prisma.configuracaoNotificacao.update({ where: { id: 1 }, data: { agendaEnviadaEm: agora } });
  if (itens.length === 0) return null;

  const resultado = await enviarWhatsapp(
    {
      provedor: config.provedor as ProvedorWhatsapp,
      urlBaseApi: config.urlBaseApi,
      instanciaId: config.instanciaId,
      credencialApi: config.credencialApi,
      clientTokenApi: config.clientTokenApi,
    },
    normalizarTelefoneWhatsapp(config.numeroWhatsapp) ?? config.numeroWhatsapp,
    montarMensagemAgenda(itens)
  );
  if (!resultado.sucesso) console.error("Falha ao enviar o resumo da agenda:", resultado.erro);
  return resultado.sucesso ? "enviado" : "falha";
}

/**
 * Envia o resumo da agenda do dia e verifica os prazos pendentes, disparando um alerta de WhatsApp por prazo quando
 * ele entra na janela de antecedência configurada (do prazo, ou o padrão
 * geral) — no dia exato ou, se o sistema não rodou nesse dia, no primeiro dia
 * seguinte em que rodar, até o vencimento. Idempotente por (prazo, dia): pode ser chamada quantas vezes forem
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

  const resumoAgenda = await enviarResumoDaAgenda(
    { ...config, numeroWhatsapp: config.numeroWhatsapp, provedor: config.provedor, credencialApi: config.credencialApi },
    agora
  );

  const prazosPendentes = await prisma.prazo.findMany({
    where: { status: "PENDENTE" },
    include: { processo: { include: { cliente: true } } },
  });

  let enviados = resumoAgenda === "enviado" ? 1 : 0;
  let falhas = resumoAgenda === "falha" ? 1 : 0;
  let processados = resumoAgenda ? 1 : 0;

  for (const prazo of prazosPendentes) {
    const restantes = diasRestantes(prazo.dataFinal, agora);
    const antecedencia = prazo.diasAntecedenciaNotificacao ?? config.antecedenciaPadraoDias;
    // Dentro da janela de aviso (da antecedência até o vencimento). Se o Mac
    // estava desligado no dia exato da antecedência, o aviso sai no primeiro
    // dia em que o sistema rodar — uma única vez por janela.
    if (restantes < 0 || restantes > antecedencia) continue;

    const jaEnviadaHoje = await prisma.notificacao.findFirst({
      where: { prazoId: prazo.id, dataEnvio: { gte: hoje } },
    });
    if (jaEnviadaHoje) continue;

    const inicioJanela = new Date(hoje);
    inicioJanela.setDate(inicioJanela.getDate() - (antecedencia - restantes));
    const jaAvisadoNaJanela = await prisma.notificacao.findFirst({
      where: { prazoId: prazo.id, status: "ENVIADO", dataEnvio: { gte: inicioJanela } },
    });
    if (jaAvisadoNaJanela) continue;

    processados += 1;
    const mensagem = montarMensagem(prazo, restantes);

    const resultado = await enviarWhatsapp(
      {
        provedor: config.provedor as ProvedorWhatsapp,
        urlBaseApi: config.urlBaseApi,
        instanciaId: config.instanciaId,
        credencialApi: config.credencialApi,
        clientTokenApi: config.clientTokenApi,
      },
      normalizarTelefoneWhatsapp(config.numeroWhatsapp) ?? config.numeroWhatsapp,
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
