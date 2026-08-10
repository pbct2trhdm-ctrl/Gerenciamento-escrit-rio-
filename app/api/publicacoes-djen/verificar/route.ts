import { verificarEImportarPublicacoes } from "@/lib/publicacoes";

/**
 * Endpoint interno chamado periodicamente por um agendador do sistema
 * (launchd/cron — veja scripts/com.pastanamota.publicacoes.plist.example)
 * enquanto o app estiver rodando. A busca em si só age de fato quando o
 * horário configurado já chegou e a rotina ainda não rodou hoje; chamadas
 * antes disso ou repetidas no mesmo dia são no-ops seguros.
 */
export async function GET(request: Request) {
  const segredo = process.env.PUBLICACOES_CRON_SECRET;
  if (!segredo) {
    return Response.json(
      { erro: "PUBLICACOES_CRON_SECRET não configurado no .env" },
      { status: 500 }
    );
  }

  const autorizacao = request.headers.get("authorization");
  if (autorizacao !== `Bearer ${segredo}`) {
    return Response.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const resumo = await verificarEImportarPublicacoes();
  return Response.json(resumo);
}
