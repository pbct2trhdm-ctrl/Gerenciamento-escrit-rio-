import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  LABEL_TIPO_CLIENTE,
  LABEL_AREA,
  LABEL_STATUS_PROCESSO,
  formatarData,
} from "@/lib/formatacao";
import { excluirCliente } from "@/lib/actions/clientes";
import { tierStatus } from "@/lib/urgencia";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { LinkVoltar } from "@/components/link-voltar";
import {
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeBotaoPerigo,
  classeCard,
  classeCardHover,
  classeTituloPagina,
  classeTituloSecao,
} from "@/lib/estilos";

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { processos: { orderBy: { criadoEm: "desc" } } },
  });

  if (!cliente) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <LinkVoltar href="/clientes" label="Voltar para Clientes" />
      <div className="flex items-center justify-between mb-1">
        <h1 className={classeTituloPagina}>{cliente.nome}</h1>
        <div className="flex gap-2">
          <Link href={`/clientes/${cliente.id}/editar`} className={classeBotaoSecundario}>
            Editar
          </Link>
          <form action={excluirCliente.bind(null, cliente.id)}>
            <button type="submit" className={classeBotaoPerigo}>
              Excluir
            </button>
          </form>
        </div>
      </div>
      <p className="text-texto-secundario mb-6">{LABEL_TIPO_CLIENTE[cliente.tipo]}</p>

      <div className={`grid grid-cols-2 gap-4 mb-8 text-sm ${classeCard}`}>
        <div>
          <p className="text-texto-secundario">CPF/CNPJ</p>
          <p className="tabular-nums">{cliente.cpfCnpj || "—"}</p>
        </div>
        <div>
          <p className="text-texto-secundario">Telefone</p>
          <p className="tabular-nums">{cliente.telefone || "—"}</p>
        </div>
        <div>
          <p className="text-texto-secundario">Email</p>
          <p>{cliente.email || "—"}</p>
        </div>
        <div>
          <p className="text-texto-secundario">Observações</p>
          <p className="whitespace-pre-wrap">{cliente.observacoes || "—"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className={classeTituloSecao}>Processos vinculados</h2>
        <Link href={`/processos/novo?clienteId=${cliente.id}`} className={classeBotaoPrimario}>
          Novo processo
        </Link>
      </div>

      {cliente.processos.length === 0 ? (
        <EmptyState
          mensagem="Nenhum processo vinculado."
          acaoHref={`/processos/novo?clienteId=${cliente.id}`}
          acaoLabel="Adicionar o primeiro processo"
        />
      ) : (
        <ul className="space-y-2">
          {cliente.processos.map((processo) => (
            <li key={processo.id}>
              <Link href={`/processos/${processo.id}`} className={`block ${classeCardHover}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {processo.numeroProcesso ?? "Sem número"}
                    </p>
                    <p className="text-sm text-texto-secundario">
                      {LABEL_AREA[processo.area]} ·{" "}
                      {processo.varaTribunal ?? "Vara não informada"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tier={tierStatus(processo.status)}>
                      {LABEL_STATUS_PROCESSO[processo.status]}
                    </Badge>
                    <p className="text-xs text-texto-secundario mt-1 tabular-nums">
                      {formatarData(processo.criadoEm)}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
