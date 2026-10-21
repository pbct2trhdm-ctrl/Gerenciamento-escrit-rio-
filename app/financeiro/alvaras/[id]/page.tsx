import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calcularAlvara } from "@/lib/alvara";
import { formatarData, formatarMoeda, LABEL_STATUS_ALVARA } from "@/lib/formatacao";
import { marcarAlvaraRepassado, removerAnexoAlvara, excluirAlvara } from "@/lib/actions/alvaras";
import { LinkVoltar } from "@/components/link-voltar";
import { Badge } from "@/components/badge";
import {
  classeBotaoConfirma,
  classeBotaoPerigo,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeCard,
  classeTituloSecao,
} from "@/lib/estilos";

function Linha({
  rotulo,
  valor,
  sinal,
  destaque,
}: {
  rotulo: string;
  valor: number;
  sinal?: "-" | "=";
  destaque?: boolean;
}) {
  if (sinal === "-" && valor === 0) return null;
  return (
    <div
      className={`flex justify-between gap-4 py-1.5 ${
        destaque ? "border-t border-borda-suave font-semibold" : ""
      }`}
    >
      <span>
        {sinal === "-" ? "(−) " : sinal === "=" ? "(=) " : ""}
        {rotulo}
      </span>
      <span className="tabular-nums">{formatarMoeda(valor)}</span>
    </div>
  );
}

export default async function AlvaraDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const alvara = await prisma.alvara.findUnique({
    where: { id },
    include: {
      processo: { include: { cliente: true } },
      parcelasQuitadas: true,
      honorarioSucumbencial: true,
    },
  });
  if (!alvara) notFound();

  const calculo = calcularAlvara(alvara);

  return (
    <div className="max-w-2xl">
      <LinkVoltar href="/financeiro/alvaras" label="Voltar para Alvarás" />
      <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
        <h2 className={classeTituloSecao}>Alvará · {alvara.processo.cliente.nome}</h2>
        <Badge tier={alvara.status === "REPASSADO" ? "tranquilo" : "atencao"}>
          {LABEL_STATUS_ALVARA[alvara.status]}
        </Badge>
      </div>
      <p className="text-texto-secundario mb-6">
        <Link href={`/processos/${alvara.processoId}`} className="underline">
          {alvara.processo.numeroProcesso ?? "Processo sem número"}
        </Link>
        {alvara.dataRecebimento && ` · recebido em ${formatarData(alvara.dataRecebimento)}`}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <a href={`/financeiro/alvaras/${alvara.id}/prestacao-contas`} className={classeBotaoPrimario}>
          Baixar prestação de contas (PDF)
        </a>
        <Link href={`/financeiro/alvaras/${alvara.id}/editar`} className={classeBotaoSecundario}>
          Editar
        </Link>
        <form action={excluirAlvara.bind(null, alvara.id)}>
          <button type="submit" className={classeBotaoPerigo}>
            Excluir
          </button>
        </form>
        {alvara.status !== "REPASSADO" && (
          <form action={marcarAlvaraRepassado.bind(null, alvara.id)}>
            <button type="submit" className={classeBotaoConfirma}>
              Marcar como repassado
            </button>
          </form>
        )}
      </div>

      <div className={`${classeCard} text-sm`}>
        <Linha rotulo="Valor bruto do alvará" valor={alvara.valorTotal} />
        <Linha rotulo="IR retido na fonte" valor={alvara.impostoRetido} sinal="-" />
        <Linha rotulo="Tarifas bancárias" valor={alvara.tarifas} sinal="-" />
        <Linha rotulo="Valor líquido recebido" valor={calculo.valorLiquido} sinal="=" destaque />
        <Linha
          rotulo={`Honorários contratuais${
            alvara.percentualContratual ? ` (${alvara.percentualContratual}%)` : ""
          }`}
          valor={alvara.honorariosContratuais}
          sinal="-"
        />
        <Linha rotulo="Honorários de sucumbência" valor={alvara.honorariosSucumbencia} sinal="-" />
        <Linha rotulo="Reembolso de despesas adiantadas" valor={alvara.reembolsoDespesas} sinal="-" />
        <Linha rotulo="Valor a repassar ao cliente" valor={calculo.valorRepassado} sinal="=" destaque />
      </div>

      <div className={`${classeCard} mt-6 text-sm`}>
        <p className="font-medium mb-2">Documentos</p>
        <ul className="space-y-2">
          {(
            [
              ["alvara", "PDF do alvará judicial", alvara.arquivoAlvaraNome],
              ["comprovante", "Comprovante do repasse", alvara.comprovanteRepasseNome],
            ] as const
          ).map(([tipo, rotulo, nome]) => (
            <li key={tipo} className="flex items-center justify-between gap-3 flex-wrap">
              <span>
                <span className="text-texto-secundario">{rotulo}: </span>
                {nome ? (
                  <a
                    href={`/financeiro/alvaras/${alvara.id}/anexo/${tipo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline break-all"
                  >
                    {nome}
                  </a>
                ) : (
                  <Link href={`/financeiro/alvaras/${alvara.id}/editar`} className="text-texto-secundario underline">
                    anexar
                  </Link>
                )}
              </span>
              {nome && (
                <form action={removerAnexoAlvara.bind(null, alvara.id, tipo)}>
                  <button type="submit" className="text-xs text-critico underline">
                    Remover
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-texto-secundario">
          Os documentos anexados vão juntos, ao final do PDF da prestação de contas.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className={classeCard}>
          <p className="text-texto-secundario">Fica no escritório</p>
          <p className="text-lg font-semibold tabular-nums">{formatarMoeda(calculo.valorRetido)}</p>
          {alvara.parcelasQuitadas.length > 0 && (
            <p className="mt-1 text-xs text-texto-secundario">
              Quita a parcela {alvara.parcelasQuitadas.map((p) => p.numero).join(", ")} do contrato
              de honorários.
            </p>
          )}
          {alvara.honorarioSucumbencial && alvara.honorariosSucumbencia > 0 && (
            <p className="mt-1 text-xs text-texto-secundario">
              Inclui a sucumbência vinculada ({alvara.honorarioSucumbencial.status === "RECEBIDO" ? "marcada como recebida" : "aguardando data de recebimento"}).
            </p>
          )}
        </div>
        <div className={classeCard}>
          <p className="text-texto-secundario">Vai para o cliente</p>
          <p className="text-lg font-semibold tabular-nums">{formatarMoeda(calculo.valorRepassado)}</p>
          <p className="mt-1 text-xs text-texto-secundario">
            {alvara.dataRepasse ? `Repasse em ${formatarData(alvara.dataRepasse)}` : "Repasse ainda não registrado"}
            {[alvara.bancoDestino, alvara.agenciaDestino && `ag. ${alvara.agenciaDestino}`, alvara.contaDestino && `cc ${alvara.contaDestino}`]
              .filter(Boolean)
              .join(" · ")
              .replace(/^/, alvara.bancoDestino || alvara.contaDestino ? " · " : "")}
            {alvara.chavePixDestino && ` · Pix ${alvara.chavePixDestino}`}
          </p>
        </div>
      </div>
    </div>
  );
}
