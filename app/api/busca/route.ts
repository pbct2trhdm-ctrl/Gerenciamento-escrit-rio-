import { buscarGeral } from "@/lib/busca";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json({ resultados: await buscarGeral(q) });
}
