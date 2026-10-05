import { PaginaRevisaoAtualizacao } from "@/components/pagina-revisao-atualizacao";

export default async function RevisarAtualizacaoClienteAdministrativoPage({
  params,
}: {
  params: Promise<{ id: string; atualizacaoId: string }>;
}) {
  const { id, atualizacaoId } = await params;
  return (
    <PaginaRevisaoAtualizacao atualizacaoId={atualizacaoId} processoAdministrativoId={id} />
  );
}
