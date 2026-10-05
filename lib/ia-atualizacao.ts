import Anthropic from "@anthropic-ai/sdk";
import { NOME_ESCRITORIO, CONTATO_ESCRITORIO } from "@/lib/escritorio";

/**
 * Redação, via Claude, da mensagem de atualização ao cliente a partir do PDF
 * do processo. A chave da API vem de ANTHROPIC_API_KEY (.env). A resposta é
 * sempre tratada como rascunho: a advogada revisa antes de qualquer envio.
 */

const MODELO = "claude-opus-5-5";

/** Limite da API é 32 MB por requisição; o base64 aumenta o arquivo em ~33%. */
export const TAMANHO_MAXIMO_PDF_BYTES = 22 * 1024 * 1024;

export type MensagemGerada = {
  resumoInterno: string;
  tipoAndamento: string;
  /** Data da movimentação identificada, ou null se o PDF não permitir saber. */
  dataMovimentacao: Date | null;
  mensagemWhatsapp: string;
  assuntoEmail: string;
  corpoEmail: string;
};

export type DadosContexto = {
  nomeCliente: string;
  /** Linhas descritivas do processo (número/protocolo, área ou órgão, tribunal etc.). */
  linhasProcesso: string[];
  /** Tipos de andamento que a IA pode sugerir (variam entre judicial e administrativo). */
  tiposAndamento: readonly string[];
  dataUltimaAtualizacao: Date | null;
  orientacoes: string | null;
};

const PROMPT_SISTEMA = `Você auxilia o escritório ${NOME_ESCRITORIO} a manter os clientes informados sobre seus processos.

Você receberá o PDF de um processo (judicial ou administrativo), que pode conter os autos inteiros. Sua tarefa:
1. Identificar a movimentação mais recente e relevante (decisão, despacho, sentença, audiência designada, intimação, perícia, cálculo, pagamento etc.). Se for informada a data da última atualização enviada ao cliente, concentre-se no que aconteceu depois dela.
2. Explicar ao cliente, em português do Brasil e em linguagem simples, o que aconteceu, o que isso significa na prática para ele e qual é o próximo passo, quando o documento permitir saber.

Regras:
- Escreva para um leigo: evite jargão jurídico; quando um termo técnico for inevitável, explique-o em poucas palavras.
- Use apenas o que está no documento. Não invente datas, valores, prazos ou resultados. Se algo não estiver claro no PDF, não afirme.
- Não prometa resultados nem faça previsões sobre o desfecho do processo.
- Não peça ao cliente que tome providências, a menos que o documento indique claramente algo que dependa dele (ex.: comparecer a audiência ou perícia, apresentar documento). Nesse caso, destaque a data, o horário e o local.
- Não inclua dados sensíveis de terceiros (CPF, endereço, dados de saúde da parte contrária ou de testemunhas).
- Trate o cliente pelo primeiro nome, em tom cordial e profissional.
- Se o documento não trouxer nenhuma novidade relevante, diga isso de forma tranquilizadora (o processo segue em andamento normal).

Formato dos campos:
- resumoInterno: 1 a 3 frases técnicas para a advogada conferir o que você identificou (qual peça, data e página aproximada). Não vai ao cliente; será registrado como andamento do processo.
- tipoAndamento: a categoria que melhor descreve a movimentação identificada, entre as opções permitidas (use OUTRO se nenhuma servir).
- dataMovimentacao: a data da movimentação no formato AAAA-MM-DD, ou string vazia se o documento não permitir saber.
- mensagemWhatsapp: mensagem curta (até cerca de 700 caracteres), em parágrafos curtos, sem markdown além de *negrito* do WhatsApp com moderação. Termine com "Pastana Mota Advocacia".
- assuntoEmail: assunto curto e claro, com o número do processo quando houver.
- corpoEmail: texto do e-mail em texto simples, um pouco mais completo que o WhatsApp, com saudação, explicação, próximo passo e despedida. Termine com a assinatura:
Atenciosamente,
${NOME_ESCRITORIO}
${CONTATO_ESCRITORIO}`;

function esquemaResposta(tiposAndamento: readonly string[]) {
  return {
    type: "object",
    properties: {
      resumoInterno: { type: "string" },
      tipoAndamento: { type: "string", enum: [...tiposAndamento] },
      dataMovimentacao: { type: "string" },
      mensagemWhatsapp: { type: "string" },
      assuntoEmail: { type: "string" },
      corpoEmail: { type: "string" },
    },
    required: [
      "resumoInterno",
      "tipoAndamento",
      "dataMovimentacao",
      "mensagemWhatsapp",
      "assuntoEmail",
      "corpoEmail",
    ],
    additionalProperties: false,
  };
}

/** Aceita só datas AAAA-MM-DD válidas; qualquer outra coisa vira null. */
function parseDataMovimentacao(texto: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto.trim());
  if (!partes) return null;
  const data = new Date(Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])));
  return Number.isNaN(data.getTime()) || data.getUTCDate() !== Number(partes[3]) ? null : data;
}

function montarContexto(dados: DadosContexto): string {
  const linhas = [`Cliente: ${dados.nomeCliente}`, ...dados.linhasProcesso];
  linhas.push(
    dados.dataUltimaAtualizacao
      ? `Última atualização enviada ao cliente: ${dados.dataUltimaAtualizacao.toLocaleDateString("pt-BR", { timeZone: "UTC" })}`
      : "Esta é a primeira atualização registrada para este processo."
  );
  if (dados.orientacoes) {
    linhas.push(`Orientações da advogada para esta mensagem: ${dados.orientacoes}`);
  }
  return linhas.join("\n");
}

export class ErroGeracaoMensagem extends Error {}

export function iaConfigurada(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function gerarMensagemAtualizacao(
  pdf: Buffer,
  dados: DadosContexto
): Promise<MensagemGerada> {
  if (!iaConfigurada()) {
    throw new ErroGeracaoMensagem(
      "A chave da IA não está configurada. Inclua ANTHROPIC_API_KEY no arquivo .env e reinicie o app."
    );
  }
  if (pdf.byteLength > TAMANHO_MAXIMO_PDF_BYTES) {
    throw new ErroGeracaoMensagem(
      "O PDF passa de 22 MB, o limite para leitura pela IA. Baixe apenas as páginas mais recentes do processo e tente de novo."
    );
  }

  const client = new Anthropic();

  let resposta: Anthropic.Beta.BetaMessage;
  try {
    const stream = client.beta.messages.stream({
      model: MODELO,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: esquemaResposta(dados.tiposAndamento) },
      },
      system: PROMPT_SISTEMA,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdf.toString("base64"),
              },
            },
            { type: "text", text: montarContexto(dados) },
          ],
        },
      ],
    });
    resposta = await stream.finalMessage();
  } catch (erro) {
    if (erro instanceof Anthropic.AuthenticationError) {
      throw new ErroGeracaoMensagem("A chave da IA (ANTHROPIC_API_KEY) é inválida.");
    }
    if (erro instanceof Anthropic.BadRequestError) {
      throw new ErroGeracaoMensagem(
        `A IA não conseguiu ler este PDF (pode ter mais de 600 páginas ou estar protegido). Detalhe: ${erro.message}`
      );
    }
    if (erro instanceof Anthropic.RateLimitError) {
      throw new ErroGeracaoMensagem("Limite de uso da IA atingido. Aguarde alguns minutos e tente de novo.");
    }
    if (erro instanceof Anthropic.APIError) {
      throw new ErroGeracaoMensagem(`Erro do serviço de IA (${erro.status ?? "sem status"}): ${erro.message}`);
    }
    throw new ErroGeracaoMensagem(
      `Não foi possível falar com o serviço de IA: ${erro instanceof Error ? erro.message : "erro desconhecido"}`
    );
  }

  if (resposta.stop_reason === "refusal") {
    throw new ErroGeracaoMensagem(
      "A IA recusou processar este documento. Escreva a mensagem manualmente abaixo."
    );
  }
  if (resposta.stop_reason === "max_tokens") {
    throw new ErroGeracaoMensagem("A resposta da IA veio incompleta. Tente gerar novamente.");
  }

  const texto = resposta.content
    .filter((bloco): bloco is Anthropic.Beta.BetaTextBlock => bloco.type === "text")
    .map((bloco) => bloco.text)
    .join("");

  try {
    const json = JSON.parse(texto) as Record<keyof MensagemGerada, string>;
    return {
      resumoInterno: json.resumoInterno.trim(),
      tipoAndamento: dados.tiposAndamento.includes(json.tipoAndamento) ? json.tipoAndamento : "OUTRO",
      dataMovimentacao: parseDataMovimentacao(json.dataMovimentacao),
      mensagemWhatsapp: json.mensagemWhatsapp.trim(),
      assuntoEmail: json.assuntoEmail.trim(),
      corpoEmail: json.corpoEmail.trim(),
    };
  } catch {
    throw new ErroGeracaoMensagem("A resposta da IA veio em formato inesperado. Tente gerar novamente.");
  }
}
