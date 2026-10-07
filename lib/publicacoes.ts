import { prisma } from "@/lib/prisma";
import { gerarPrazoDaPublicacao } from "@/lib/prazo-publicacao";
import {
  buscarPublicacoesDjen,
  extrairNumeroProcesso,
  type PublicacaoDjenNormalizada,
} from "@/lib/djen";
import { enviarWhatsapp, normalizarTelefoneWhatsapp, type ProvedorWhatsapp } from "@/lib/whatsapp";

export type ResumoVerificacaoPublicacoes = {
  executado: boolean;
  motivo?: string;
  novas: number;
  vinculadas: number;
  orfas: number;
  prazosCriados?: number;
  prazosADefinir?: number;
  whatsappEnviado: boolean;
};

function horarioJaChegou(horarioConsulta: string, agora: Date): boolean {
  const [horaConfigurada, minutoConfigurado] = horarioConsulta.split(":").map(Number);
  const minutosConfigurados = (horaConfigurada || 0) * 60 + (minutoConfigurado || 0);
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  return minutosAgora >= minutosConfigurados;
}

const DIAS_PRIMEIRA_BUSCA = 7;
/**
 * A partir do horário configurado, a busca automática se repete de hora em
 * hora: o DJEN disponibiliza publicações ao longo do dia, e uma busca única
 * de manhã deixaria as da tarde para o dia seguinte. Publicações já
 * importadas são ignoradas, e o WhatsApp só avisa quando há novas.
 */
const INTERVALO_MINUTOS_ENTRE_BUSCAS = 60;
const DIAS_MAXIMOS_RETROATIVOS = 30;

/**
 * Mínimo de dias revisados em toda busca automática. A API pública do DJEN
 * pode levar dias para exibir uma comunicação que o site já mostra — com a
 * data de disponibilização original. Revisar sempre a última semana captura
 * essas publicações atrasadas; as já importadas são ignoradas.
 */
const DIAS_MINIMOS_REVISADOS = 7;

/**
 * Início do período consultado no DJEN: o mais antigo entre a véspera da
 * última busca bem-sucedida (recupera o que saiu com o Mac desligado) e os
 * últimos 7 dias (recupera o que a API publicou com atraso) — limitado a 30
 * dias. Publicações já importadas são ignoradas pelo idExternoDjen, então a
 * sobreposição não duplica nada.
 */
function inicioDaJanelaDeBusca(
  ultimaExecucao: Date | null,
  agora: Date,
  diasSemHistorico: number = DIAS_PRIMEIRA_BUSCA
): Date {
  const limite = new Date(agora);
  limite.setDate(limite.getDate() - DIAS_MAXIMOS_RETROATIVOS);

  const minimo = new Date(agora);
  minimo.setDate(minimo.getDate() - Math.max(DIAS_MINIMOS_REVISADOS, ultimaExecucao ? 0 : diasSemHistorico));

  let inicio = minimo;
  if (ultimaExecucao) {
    const vesperaUltima = new Date(ultimaExecucao);
    vesperaUltima.setDate(vesperaUltima.getDate() - 1);
    if (vesperaUltima < inicio) inicio = vesperaUltima;
  }
  return inicio < limite ? limite : inicio;
}

/** Marca a publicação como lida — chamada diretamente ao renderizar a tela de detalhe. */
export async function marcarPublicacaoComoLida(id: string) {
  await prisma.publicacao.updateMany({
    where: { id, lida: false },
    data: { lida: true },
  });
}

function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

/**
 * Vincula a publicação ao processo informado: registra o Andamento de
 * publicação e, em seguida, cria o prazo "a conferir" (ou marca "prazo a
 * definir") — ver lib/prazo-publicacao.ts. Usada pela importação automática
 * e pela vinculação manual (aba Órfãs).
 */
export async function vincularPublicacaoAoProcessoId(
  publicacaoId: string,
  processoId: string,
  opcoes: { gerarPrazo?: boolean } = {}
) {
  const publicacao = await prisma.publicacao.update({
    where: { id: publicacaoId },
    data: { processoId, statusVinculo: "VINCULADA" },
  });

  const andamento = await prisma.andamento.create({
    data: {
      processoId,
      data: publicacao.dataPublicacao,
      tipo: "PUBLICACAO",
      descricao: publicacao.textoPublicacao,
    },
  });

  // Na importação de histórico, publicações antigas não geram prazo (já passou).
  if (opcoes.gerarPrazo === false) return "ignorado" as const;
  return gerarPrazoDaPublicacao(publicacaoId, andamento.id);
}

/**
 * Procura o processo cadastrado com o número extraído do texto — comparando
 * só os dígitos, para casar "0800123-45.2026.8.14.0301" com "08001234520268140301".
 */
export async function vincularPublicacaoAoProcesso(
  publicacaoId: string,
  numeroProcesso: string,
  opcoes: { gerarPrazo?: boolean } = {}
) {
  const digitos = somenteDigitos(numeroProcesso);
  if (!digitos) return null;

  const processos = await prisma.processo.findMany({
    where: { numeroProcesso: { not: null } },
    select: { id: true, numeroProcesso: true },
  });
  const processo = processos.find(
    (candidato) => somenteDigitos(candidato.numeroProcesso ?? "") === digitos
  );
  if (!processo) return null;

  const resultadoPrazo = await vincularPublicacaoAoProcessoId(publicacaoId, processo.id, opcoes);
  return { processoId: processo.id, resultadoPrazo };
}

type ContagemImportacao = {
  novas: number;
  vinculadas: number;
  orfas: number;
  prazosCriados: number;
  prazosADefinir: number;
};

const DIAS_PUBLICACAO_RECENTE = 7;

/**
 * Grava as publicações ainda não importadas, vinculando-as aos processos
 * cadastrados. No modo histórico, as com mais de 7 dias entram como lidas e
 * sem gerar prazo (já passou); as recentes seguem a regra normal.
 */
async function importarItens(
  itens: PublicacaoDjenNormalizada[],
  agora: Date,
  opcoes: { historico: boolean }
): Promise<ContagemImportacao> {
  const limiteRecente = new Date(agora);
  limiteRecente.setDate(limiteRecente.getDate() - DIAS_PUBLICACAO_RECENTE);

  let novas = 0;
  let vinculadas = 0;
  let orfas = 0;
  let prazosCriados = 0;
  let prazosADefinir = 0;

  for (const item of itens) {
    const jaExiste = await prisma.publicacao.findUnique({
      where: { idExternoDjen: item.idExterno },
      select: { id: true },
    });
    if (jaExiste) continue;

    const antiga = opcoes.historico && item.dataPublicacao < limiteRecente;
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
        lida: antiga,
      },
    });

    novas += 1;

    const vinculo = numeroProcessoIdentificado
      ? await vincularPublicacaoAoProcesso(publicacao.id, numeroProcessoIdentificado, {
          gerarPrazo: !antiga,
        })
      : null;

    if (vinculo) {
      vinculadas += 1;
      if (vinculo.resultadoPrazo === "criado") prazosCriados += 1;
      if (vinculo.resultadoPrazo === "a_definir") prazosADefinir += 1;
    } else {
      orfas += 1;
    }
  }

  return { novas, vinculadas, orfas, prazosCriados, prazosADefinir };
}

/**
 * Botão "Importar histórico": traz as publicações da OAB dos últimos N meses,
 * consultando o DJEN mês a mês. Não envia WhatsApp nem atualiza a data da
 * última busca automática.
 */
export async function importarHistoricoPublicacoes(
  meses: number,
  agora: Date = new Date()
): Promise<ContagemImportacao & { periodo: string }> {
  const config = await prisma.configuracaoPublicacoes.findUnique({ where: { id: 1 } });
  if (!config?.numeroOab || !config.seccionalOab) {
    throw new Error("Configure o número da OAB e a seccional em Configurações antes de importar.");
  }

  const inicioTotal = new Date(agora);
  inicioTotal.setMonth(inicioTotal.getMonth() - meses);

  const total: ContagemImportacao = { novas: 0, vinculadas: 0, orfas: 0, prazosCriados: 0, prazosADefinir: 0 };
  let inicioTrecho = new Date(inicioTotal);
  while (inicioTrecho <= agora) {
    const fimTrecho = new Date(inicioTrecho);
    fimTrecho.setMonth(fimTrecho.getMonth() + 1);
    fimTrecho.setDate(fimTrecho.getDate() - 1);
    const fim = fimTrecho > agora ? agora : fimTrecho;

    const itens = await buscarPublicacoesDjen(config.numeroOab, config.seccionalOab, inicioTrecho, fim);
    const parcial = await importarItens(itens, agora, { historico: true });
    for (const chave of Object.keys(total) as (keyof ContagemImportacao)[]) {
      total[chave] += parcial[chave];
    }

    inicioTrecho = new Date(fimTrecho);
    inicioTrecho.setDate(inicioTrecho.getDate() + 1);
  }

  return {
    ...total,
    periodo: `${inicioTotal.toLocaleDateString("pt-BR")} a ${agora.toLocaleDateString("pt-BR")}`,
  };
}

/**
 * Rotina diária: consulta o DJEN pela OAB/seccional configurados, importa
 * publicações novas (idempotente via idExternoDjen), tenta vincular a um
 * Processo já cadastrado pelo número extraído do texto, e — havendo
 * publicações novas — envia um resumo por WhatsApp reaproveitando a
 * configuração do módulo de Notificações de prazo.
 */
export async function verificarEImportarPublicacoes(
  agora: Date = new Date(),
  opcoes: { forcar?: boolean } = {}
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

  if (!opcoes.forcar && !horarioJaChegou(config.horarioConsulta, agora)) {
    return {
      executado: false,
      motivo: `Ainda não chegou o horário configurado (${config.horarioConsulta}).`,
      novas: 0,
      vinculadas: 0,
      orfas: 0,
      whatsappEnviado: false,
    };
  }

  const minutosDesdeUltima = config.ultimaExecucao
    ? (agora.getTime() - config.ultimaExecucao.getTime()) / 60000
    : Infinity;
  if (!opcoes.forcar && minutosDesdeUltima < INTERVALO_MINUTOS_ENTRE_BUSCAS) {
    return {
      executado: false,
      motivo: `Última busca há menos de ${INTERVALO_MINUTOS_ENTRE_BUSCAS} minutos.`,
      novas: 0,
      vinculadas: 0,
      orfas: 0,
      whatsappEnviado: false,
    };
  }

  // A busca manual ("Buscar agora") sempre revisa os últimos 30 dias, para
  // recuperar qualquer publicação que a janela automática tenha deixado passar.
  const inicioBusca = opcoes.forcar
    ? inicioDaJanelaDeBusca(null, agora, DIAS_MAXIMOS_RETROATIVOS)
    : inicioDaJanelaDeBusca(config.ultimaExecucao, agora);

  let itensDjen: Awaited<ReturnType<typeof buscarPublicacoesDjen>>;
  try {
    itensDjen = await buscarPublicacoesDjen(
      config.numeroOab,
      config.seccionalOab,
      inicioBusca,
      agora
    );
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido ao consultar o DJEN.";
    console.error("Falha na busca de publicações no DJEN:", mensagem);
    await prisma.configuracaoPublicacoes.update({
      where: { id: 1 },
      data: { ultimoErro: mensagem, ultimoErroEm: agora },
    });
    return {
      executado: false,
      motivo: mensagem,
      novas: 0,
      vinculadas: 0,
      orfas: 0,
      whatsappEnviado: false,
    };
  }

  const { novas, vinculadas, orfas, prazosCriados, prazosADefinir } = await importarItens(
    itensDjen,
    agora,
    { historico: false }
  );

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
        `${novas} nova(s) publicação(ões) encontrada(s) entre ${inicioBusca.toLocaleDateString("pt-BR")} e ${agora.toLocaleDateString("pt-BR")}.`,
        `${vinculadas} vinculada(s) a processo(s) cadastrado(s), ${orfas} sem correspondência.`,
        ...(prazosCriados > 0
          ? [`⏰ ${prazosCriados} prazo(s) cadastrado(s) automaticamente — confira no sistema.`]
          : []),
        ...(prazosADefinir > 0
          ? [`⚠️ ${prazosADefinir} publicação(ões) sem prazo identificado — defina no sistema.`]
          : []),
      ].join("\n");

      const resultado = await enviarWhatsapp(
        {
          provedor: configNotificacao.provedor as ProvedorWhatsapp,
          urlBaseApi: configNotificacao.urlBaseApi,
          instanciaId: configNotificacao.instanciaId,
          credencialApi: configNotificacao.credencialApi,
          clientTokenApi: configNotificacao.clientTokenApi,
        },
        normalizarTelefoneWhatsapp(configNotificacao.numeroWhatsapp) ?? configNotificacao.numeroWhatsapp,
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
    data: { ultimaExecucao: agora, ultimoErro: null, ultimoErroEm: null },
  });

  return {
    executado: true,
    novas,
    vinculadas,
    orfas,
    prazosCriados,
    prazosADefinir,
    whatsappEnviado,
  };
}
