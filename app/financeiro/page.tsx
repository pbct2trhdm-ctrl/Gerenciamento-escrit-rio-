import Link from "next/link";
import { idsAlvarasDuplicados } from "@/lib/alvara-duplicados";
import { prisma } from "@/lib/prisma";
import { formatarMoeda, formatarData } from "@/lib/formatacao";
import {
  dentroDoMes,
  primeiroDiaMes,
  diasDesde,
  DIAS_ALERTA_ALVARA,
} from "@/lib/financeiro";
import { classeCard, classeTituloSecao } from "@/lib/estilos";

export default async function FinanceiroVisaoGeralPage() {
  const hoje = new Date();
  const inicioMes = primeiroDiaMes(hoje);

  const [parcelasPendentes, sucumbenciasAbertas, parcelasPagas, sucumbenciasRecebidas, alvaras, despesas, obrigacoesPagas, retiradas] =
    await Promise.all([
      prisma.parcela.findMany({
        where: { status: "PENDENTE" },
        include: { honorario: { include: { processo: { include: { cliente: true } } } } },
      }),
      prisma.honorarioSucumbencial.findMany({
        where: { status: { in: ["DEFINIDO", "EM_EXECUCAO"] } },
        include: { processo: { include: { cliente: true } } },
      }),
      prisma.parcela.findMany({
        where: { status: "PAGO" },
        include: { honorario: { include: { processo: { include: { cliente: true } } } } },
      }),
      prisma.honorarioSucumbencial.findMany({
        where: { status: "RECEBIDO" },
        include: {
          processo: { include: { cliente: true } },
          alvaras: { select: { honorariosSucumbencia: true } },
        },
      }),
      prisma.alvara.findMany({
        include: { processo: { include: { cliente: true } } },
      }),
      prisma.despesa.findMany(),
      prisma.obrigacaoSocietaria.findMany({ where: { status: "PAGO" } }),
      prisma.retiradaLucro.findMany(),
    ]);

  const totalAReceberHonorarios = parcelasPendentes.reduce((soma, p) => soma + p.valor, 0);
  const totalSucumbenciaAReceber = sucumbenciasAbertas.reduce(
    (soma, s) => soma + (s.valorDefinido ?? 0),
    0
  );

  // Parcelas e sucumbências recebidas por meio de alvará entram no caixa
  // pelo valor retido do alvará — aqui ficam de fora para não contar duas vezes.
  const recebidoParcelasMes = parcelasPagas
    .filter((p) => !p.quitadaPorAlvaraId)
    .filter((p) => p.dataPagamento && dentroDoMes(p.dataPagamento, inicioMes))
    .reduce((soma, p) => soma + p.valor, 0);
  const recebidoSucumbenciaMes = sucumbenciasRecebidas
    .filter((s) => !s.alvaras.some((a) => a.honorariosSucumbencia > 0))
    .filter((s) => s.dataRecebimento && dentroDoMes(s.dataRecebimento, inicioMes))
    .reduce((soma, s) => soma + (s.valorDefinido ?? s.valorEstimado ?? 0), 0);
  const alvarasDoMes = alvaras.filter(
    (a) => a.dataRecebimento && dentroDoMes(a.dataRecebimento, inicioMes)
  );
  const recebidoAlvarasMes = alvarasDoMes.reduce((soma, a) => soma + a.valorRetido, 0);
  const alvarasMesBruto = alvarasDoMes.reduce((soma, a) => soma + a.valorTotal, 0);
  const alvarasMesClientes = alvarasDoMes.reduce((soma, a) => soma + a.valorRepassado, 0);
  const alvarasMesDescontos = alvarasDoMes.reduce((soma, a) => soma + a.impostoRetido + a.tarifas, 0);
  const totalRecebidoMes = recebidoParcelasMes + recebidoSucumbenciaMes + recebidoAlvarasMes;

  const totalDespesasMes = despesas
    .filter((d) => dentroDoMes(d.data, inicioMes))
    .reduce((soma, d) => soma + d.valor, 0);

  const obrigacoesPagasMes = obrigacoesPagas
    .filter((o) => o.dataPagamento && dentroDoMes(o.dataPagamento, inicioMes))
    .reduce((soma, o) => soma + o.valor, 0);
  const retiradasMes = retiradas
    .filter((r) => dentroDoMes(r.data, inicioMes))
    .reduce((soma, r) => soma + r.valor, 0);

  const saldoMes = totalRecebidoMes - totalDespesasMes - obrigacoesPagasMes - retiradasMes;

  const parcelasSemNf = parcelasPagas.filter((p) => !p.notaFiscalEmitida);
  const sucumbenciasSemNf = sucumbenciasRecebidas.filter((s) => !s.notaFiscalEmitida);
  // Alvará em que nada ficou para o cliente: quase sempre detalhamento errado
  // (ex.: valor retido igual ao total, herdado do cadastro antigo).
  const alvarasSemParteCliente = alvaras.filter(
    (a) => a.valorTotal > 0 && a.valorRepassado <= 0
  );
  const duplicados = idsAlvarasDuplicados(alvaras);
  const alvarasDuplicados = alvaras.filter((a) => duplicados.has(a.id));
  const alvarasAguardando = alvaras.filter(
    (a) =>
      a.status === "AGUARDANDO_REPASSE" &&
      a.dataRecebimento &&
      diasDesde(a.dataRecebimento, hoje) > DIAS_ALERTA_ALVARA
  );

  const cards = [
    {
      label: "A receber (honorários + sucumbência)",
      valor: totalAReceberHonorarios + totalSucumbenciaAReceber,
      detalhe: `Honorários: ${formatarMoeda(totalAReceberHonorarios)} · Sucumbência: ${formatarMoeda(totalSucumbenciaAReceber)}`,
    },
    {
      label: "Receita do escritório no mês",
      valor: totalRecebidoMes,
      detalhe: `Honorários: ${formatarMoeda(recebidoParcelasMes)} · Sucumbência: ${formatarMoeda(recebidoSucumbenciaMes)} · Alvarás (parte do escritório): ${formatarMoeda(recebidoAlvarasMes)}`,
    },
    {
      label: "Despesas no mês",
      valor: totalDespesasMes,
      detalhe: null,
    },
    {
      label: "Saldo do mês",
      valor: saldoMes,
      detalhe: "Receita do escritório − despesas − obrigações pagas − retiradas",
    },
  ];

  // Dinheiro de clientes já recebido em alvarás e ainda não repassado —
  // está na conta do escritório, mas não é do escritório.
  const alvarasPendentesRepasse = alvaras.filter(
    (a) => a.status === "AGUARDANDO_REPASSE" && a.dataRecebimento
  );
  const valoresDeClientes = alvarasPendentesRepasse.reduce((soma, a) => soma + a.valorRepassado, 0);

  return (
    <div>
      {valoresDeClientes > 0 && (
        <Link
          href="/financeiro/alvaras"
          className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm hover:bg-accent/15 transition-colors"
        >
          <span>
            <span className="font-semibold text-accent">
              {formatarMoeda(valoresDeClientes)} de clientes
            </span>{" "}
            recebidos em {alvarasPendentesRepasse.length} alvará(s) e ainda não repassados — não
            é dinheiro do escritório.
          </span>
          <span className="text-accent shrink-0">Ver alvarás →</span>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={classeCard}>
            <p className="text-sm text-texto-secundario">{card.label}</p>
            <p
              className={`text-xl font-semibold mt-1 tabular-nums ${
                card.valor < 0 ? "text-critico" : "text-texto-principal"
              }`}
            >
              {formatarMoeda(card.valor)}
            </p>
            {card.detalhe && (
              <p className="text-xs text-texto-secundario/80 mt-1">{card.detalhe}</p>
            )}
          </div>
        ))}
      </div>

      {alvarasDoMes.length > 0 && (
        <div className={`${classeCard} mb-8`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={classeTituloSecao}>Alvarás recebidos no mês</h2>
            <Link href="/financeiro/alvaras" className="text-sm text-accent underline">
              Ver alvarás
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-texto-secundario">Valor bruto recebido</p>
              <p className="text-lg font-semibold tabular-nums">{formatarMoeda(alvarasMesBruto)}</p>
            </div>
            <div>
              <p className="text-texto-secundario">IR e tarifas</p>
              <p className="text-lg font-semibold tabular-nums">{formatarMoeda(alvarasMesDescontos)}</p>
            </div>
            <div>
              <p className="text-texto-secundario">Parte do escritório</p>
              <p className="text-lg font-semibold tabular-nums text-tranquilo">
                {formatarMoeda(recebidoAlvarasMes)}
              </p>
              <p className="text-xs text-texto-secundario">entra na receita</p>
            </div>
            <div>
              <p className="text-texto-secundario">Parte dos clientes</p>
              <p className="text-lg font-semibold tabular-nums">{formatarMoeda(alvarasMesClientes)}</p>
              <p className="text-xs text-texto-secundario">não é receita — repassar</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className={classeTituloSecao}>Alertas</h2>

        {parcelasSemNf.length === 0 &&
        sucumbenciasSemNf.length === 0 &&
        alvarasAguardando.length === 0 &&
        alvarasSemParteCliente.length === 0 &&
        alvarasDuplicados.length === 0 ? (
          <p className="text-texto-secundario text-sm">Nenhum alerta no momento.</p>
        ) : (
          <div className="space-y-3">
            {parcelasSemNf.length > 0 && (
              <div className="rounded-lg border border-atencao/40 bg-atencao/10 p-4">
                <p className="font-medium text-atencao text-sm mb-2">
                  Parcelas pagas sem nota fiscal emitida ({parcelasSemNf.length})
                </p>
                <ul className="text-sm space-y-1">
                  {parcelasSemNf.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/financeiro/honorarios/${p.honorarioId}`}
                        className="underline"
                      >
                        {p.honorario.processo.cliente.nome} — parcela nº {p.numero} ·{" "}
                        <span className="tabular-nums">{formatarMoeda(p.valor)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sucumbenciasSemNf.length > 0 && (
              <div className="rounded-lg border border-atencao/40 bg-atencao/10 p-4">
                <p className="font-medium text-atencao text-sm mb-2">
                  Sucumbências recebidas sem nota fiscal emitida ({sucumbenciasSemNf.length})
                </p>
                <ul className="text-sm space-y-1">
                  {sucumbenciasSemNf.map((s) => (
                    <li key={s.id}>
                      <Link href={`/financeiro/sucumbencia/${s.id}/editar`} className="underline">
                        {s.processo.cliente.nome} ·{" "}
                        <span className="tabular-nums">
                          {formatarMoeda(s.valorDefinido ?? s.valorEstimado ?? 0)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {alvarasDuplicados.length > 0 && (
              <div className="rounded-lg border border-critico/40 bg-critico/10 p-4">
                <p className="font-medium text-critico text-sm mb-1">
                  Possíveis alvarás duplicados ({alvarasDuplicados.length})
                </p>
                <p className="text-sm text-critico mb-2">
                  Mesmo processo, valor e data de recebimento — a receita está sendo contada mais de
                  uma vez. Abra um deles, confira e exclua o repetido.
                </p>
                <ul className="text-sm space-y-1">
                  {alvarasDuplicados.map((a) => (
                    <li key={a.id}>
                      <Link href={`/financeiro/alvaras/${a.id}`} className="underline">
                        {a.processo.cliente.nome} ·{" "}
                        <span className="tabular-nums">{formatarMoeda(a.valorTotal)}</span> ·
                        cadastrado em {a.criadoEm.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {alvarasSemParteCliente.length > 0 && (
              <div className="rounded-lg border border-critico/40 bg-critico/10 p-4">
                <p className="font-medium text-critico text-sm mb-1">
                  Alvarás sem nenhum valor para o cliente ({alvarasSemParteCliente.length})
                </p>
                <p className="text-sm text-critico mb-2">
                  Todo o valor está contando como receita do escritório. Confira o detalhamento
                  (honorários contratuais, sucumbência e reembolso).
                </p>
                <ul className="text-sm space-y-1">
                  {alvarasSemParteCliente.map((a) => (
                    <li key={a.id}>
                      <Link href={`/financeiro/alvaras/${a.id}/editar`} className="underline">
                        {a.processo.cliente.nome} ·{" "}
                        <span className="tabular-nums">{formatarMoeda(a.valorTotal)}</span> · retido{" "}
                        <span className="tabular-nums">{formatarMoeda(a.valorRetido)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {alvarasAguardando.length > 0 && (
              <div className="rounded-lg border border-critico/40 bg-critico/10 p-4">
                <p className="font-medium text-critico text-sm mb-2">
                  Alvarás aguardando repasse há mais de {DIAS_ALERTA_ALVARA} dias (
                  {alvarasAguardando.length})
                </p>
                <ul className="text-sm space-y-1">
                  {alvarasAguardando.map((a) => (
                    <li key={a.id}>
                      <Link href={`/financeiro/alvaras/${a.id}/editar`} className="underline">
                        {a.processo.cliente.nome} ·{" "}
                        <span className="tabular-nums">{formatarMoeda(a.valorTotal)}</span> ·
                        recebido em{" "}
                        <span className="tabular-nums">
                          {a.dataRecebimento ? formatarData(a.dataRecebimento) : "—"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
