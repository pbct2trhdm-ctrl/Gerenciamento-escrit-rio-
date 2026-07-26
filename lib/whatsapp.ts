/**
 * Envio de WhatsApp via Evolution API (self-hosted, conexão por QR code) ou
 * Z-API (serviço pago brasileiro). A lógica de disparo (lib/notificacoes.ts)
 * é a mesma para os dois — só a chamada HTTP muda.
 *
 * Os contratos exatos de cada API podem variar por versão/conta. Se o envio
 * falhar, confira a mensagem de erro registrada em Notificacao e compare com
 * a documentação atual do provedor configurado.
 */

export type ProvedorWhatsapp = "EVOLUTION_API" | "Z_API";

export type ConfiguracaoEnvio = {
  provedor: ProvedorWhatsapp;
  urlBaseApi: string | null;
  instanciaId: string | null;
  credencialApi: string | null;
};

export type ResultadoEnvio =
  | { sucesso: true }
  | { sucesso: false; erro: string };

async function enviarViaEvolutionApi(
  config: ConfiguracaoEnvio,
  numeroDestino: string,
  mensagem: string
): Promise<ResultadoEnvio> {
  if (!config.urlBaseApi || !config.instanciaId || !config.credencialApi) {
    return {
      sucesso: false,
      erro: "Evolution API requer URL base, ID da instância e apikey configurados.",
    };
  }

  const url = `${config.urlBaseApi.replace(/\/$/, "")}/message/sendText/${config.instanciaId}`;
  const resposta = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.credencialApi,
    },
    body: JSON.stringify({ number: numeroDestino, text: mensagem }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "");
    return {
      sucesso: false,
      erro: `Evolution API retornou ${resposta.status}: ${corpo.slice(0, 300)}`,
    };
  }
  return { sucesso: true };
}

async function enviarViaZApi(
  config: ConfiguracaoEnvio,
  numeroDestino: string,
  mensagem: string
): Promise<ResultadoEnvio> {
  if (!config.instanciaId || !config.credencialApi) {
    return {
      sucesso: false,
      erro: "Z-API requer ID da instância e token configurados.",
    };
  }

  const url = `https://api.z-api.io/instances/${config.instanciaId}/token/${config.credencialApi}/send-text`;
  const resposta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: numeroDestino, message: mensagem }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "");
    return {
      sucesso: false,
      erro: `Z-API retornou ${resposta.status}: ${corpo.slice(0, 300)}`,
    };
  }
  return { sucesso: true };
}

export async function enviarWhatsapp(
  config: ConfiguracaoEnvio,
  numeroDestino: string,
  mensagem: string
): Promise<ResultadoEnvio> {
  try {
    if (config.provedor === "EVOLUTION_API") {
      return await enviarViaEvolutionApi(config, numeroDestino, mensagem);
    }
    return await enviarViaZApi(config, numeroDestino, mensagem);
  } catch (erro) {
    return {
      sucesso: false,
      erro: erro instanceof Error ? erro.message : "Erro desconhecido ao enviar WhatsApp",
    };
  }
}
