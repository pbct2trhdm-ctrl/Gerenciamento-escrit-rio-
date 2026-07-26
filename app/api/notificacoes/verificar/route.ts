import { verificarEDispararNotificacoes } from "@/lib/notificacoes";

/**
 * Endpoint interno chamado periodicamente por um agendador do sistema
 * (launchd/cron — veja scripts/com.pastanamota.notificacoes.plist.example)
 * enquanto o app estiver rodando. A verificação em si só age de fato quando
 * o horário configurado já chegou; chamadas antes disso ou repetidas no
 * mesmo dia são no-ops seguros.
 */
export async function GET(request: Request) {
  const segredo = process.env.NOTIFICACOES_CRON_SECRET;
  if (!segredo) {
    return Response.json(
      { erro: "NOTIFICACOES_CRON_SECRET não configurado no .env" },
      { status: 500 }
    );
  }

  const autorizacao = request.headers.get("authorization");
  if (autorizacao !== `Bearer ${segredo}`) {
    return Response.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const resumo = await verificarEDispararNotificacoes();
  return Response.json(resumo);
}
