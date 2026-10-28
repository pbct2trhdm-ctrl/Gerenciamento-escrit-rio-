import Link from "next/link";
import { analisarPrazosDePublicacoes, type ItemRevisao } from "@/lib/revisao-prazos";
import { aplicarRevisaoPrazos, definirPoloNaRevisao } from "@/lib/actions/prazos";
import { formatarData } from "@/lib/formatacao";
import { LinkVoltar } from "@/components/link-voltar";
import { BotaoEnvio } from "@/components/botao-envio";
import { SeloAConferir } from "@/components/prazo-a-conferir";
import {
  classeBotaoPerigo,
  classeBotaoSecundario,
  classeCard,
  classeInputAuto,
  classeTituloPagina,
  classeTituloSecao,
} from "@/lib/estilos";

function Identificacao({ item }: { item: ItemRevisao }) {
  return (
    <>
      <span className="font-medium">{item.cliente}</span>
      <span className="text-texto-secundario"> · {item.numeroProcesso ?? "sem número"}</span>
    </>
  );
}

export default async function RevisarPrazosPage({
  searchParams,
}: {
  searchParams: Promise<{ removidos?: string }>;
}) {
  const { removidos } = await searchParams;
  const itens = await analisarPrazosDePublicacoes();

  const daContraria = itens.filter((i) => i.classificacao === "contraria");
  const semPolo = itens.filter((i) => i.classificacao === "sem_polo");
  const indefinidos = itens.filter((i) => i.classificacao === "indefinido");
  const doCliente = itens.filter((i) => i.classificacao === "cliente");
  const processosSemPolo = [...new Map(semPolo.map((i) => [i.processoId, i])).values()];

  return (
    <div className="max-w-4xl">
      <LinkVoltar href="/prazos" label="Voltar para Prazos/Agenda" />
      <h1 className={`${classeTituloPagina} mb-1`}>Revisar prazos das publicações</h1>
      <p className="text-texto-secundario mb-6">
        Analisa os {itens.length} prazo(s) pendente(s) gerado(s) de publicações do DJEN e aponta os
        que eram dirigidos à parte contrária. Prazos cadastrados à mão e audiências não entram.
      </p>

      {removidos !== undefined && (
        <div className="mb-6 rounded-lg border border-tranquilo/30 bg-tranquilo-fundo px-4 py-3 text-sm text-tranquilo">
          {removidos} prazo(s) da parte contrária removido(s). As publicações registram o motivo.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 text-sm">
        {[
          ["Da parte contrária", daContraria.length, "text-critico"],
          ["Do seu cliente", doCliente.length, "text-tranquilo"],
          ["Sem lado do cliente", semPolo.length, "text-atencao"],
          ["Não deu para decidir", indefinidos.length, "text-texto-secundario"],
        ].map(([rotulo, qtd, cor]) => (
          <div key={rotulo as string} className={classeCard}>
            <p className="text-texto-secundario">{rotulo}</p>
            <p className={`text-xl font-semibold ${cor}`}>{qtd}</p>
          </div>
        ))}
      </div>

      <h2 className={`${classeTituloSecao} mb-2`}>Prazos da parte contrária</h2>
      {daContraria.length === 0 ? (
        <p className="text-sm text-texto-secundario mb-8">Nenhum encontrado.</p>
      ) : (
        <form action={aplicarRevisaoPrazos} className="mb-10">
          <p className="text-sm text-texto-secundario mb-3">
            Os ainda &quot;a conferir&quot; vêm marcados. Os que você já confirmou vêm desmarcados —
            marque-os se quiser removê-los também.
          </p>
          <ul className="space-y-2 mb-4">
            {daContraria.map((item) => (
              <li key={item.prazoId} className={`${classeCard} text-sm`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="prazoId"
                    value={item.prazoId}
                    defaultChecked={item.aConferir}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="flex-1">
                    <span className="flex items-center gap-2 flex-wrap">
                      <Identificacao item={item} />
                      {item.aConferir ? (
                        <SeloAConferir />
                      ) : (
                        <span className="rounded-full border border-borda-suave px-2 py-0.5 text-xs text-texto-secundario">
                          confirmado por você
                        </span>
                      )}
                    </span>
                    <span className="block mt-1 text-texto-secundario">
                      Vence em {formatarData(item.dataFinal)}
                      {item.dias ? ` · ${item.dias} dias` : ""} · ordem dirigida ao {item.destinatario}
                      {item.poloDescoberto ? " (lado do cliente descoberto pelas publicações)" : ""}
                    </span>
                  </span>
                </label>
                <details className="mt-2 ml-7">
                  <summary className="cursor-pointer text-xs text-texto-secundario hover:text-accent">
                    Ver trecho da publicação de {formatarData(item.dataPublicacao)}
                  </summary>
                  <p className="mt-1 text-xs whitespace-pre-wrap">{item.trechoPublicacao}…</p>
                  <Link href={`/publicacoes/${item.publicacaoId}`} className="text-xs text-accent underline">
                    Abrir publicação
                  </Link>
                </details>
              </li>
            ))}
          </ul>
          <BotaoEnvio className={classeBotaoPerigo} textoAguardando="Removendo…">
            Remover prazos selecionados
          </BotaoEnvio>
        </form>
      )}

      {processosSemPolo.length > 0 && (
        <>
          <h2 className={`${classeTituloSecao} mb-2`}>Processos sem o lado do cliente definido</h2>
          <p className="text-sm text-texto-secundario mb-3">
            Não deu para descobrir pelas publicações se o cliente é autor ou réu. Informe para que os
            prazos desses processos possam ser revisados.
          </p>
          <ul className="space-y-2 mb-10">
            {processosSemPolo.map((item) => (
              <li key={item.processoId} className={`${classeCard} text-sm flex items-center justify-between gap-3 flex-wrap`}>
                <span>
                  <Identificacao item={item} />
                  <span className="text-texto-secundario">
                    {" "}
                    · {semPolo.filter((i) => i.processoId === item.processoId).length} prazo(s)
                  </span>
                </span>
                <form action={definirPoloNaRevisao.bind(null, item.processoId)} className="flex items-center gap-2">
                  <select name="poloCliente" required defaultValue="" className={classeInputAuto} aria-label="Lado do cliente">
                    <option value="" disabled>
                      O cliente é…
                    </option>
                    <option value="ATIVO">Autor / requerente</option>
                    <option value="PASSIVO">Réu / requerido</option>
                  </select>
                  <BotaoEnvio className={classeBotaoSecundario} textoAguardando="Salvando…">
                    Salvar
                  </BotaoEnvio>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}

      {indefinidos.length > 0 && (
        <>
          <h2 className={`${classeTituloSecao} mb-2`}>Não deu para decidir</h2>
          <p className="text-sm text-texto-secundario mb-3">
            O texto não deixa claro a quem se dirige a ordem (ou traz prazos diferentes). Confira
            cada um na publicação.
          </p>
          <ul className="space-y-1 mb-10 text-sm">
            {indefinidos.map((item) => (
              <li key={item.prazoId}>
                <Link href={`/publicacoes/${item.publicacaoId}`} className="underline">
                  <Identificacao item={item} /> · vence em {formatarData(item.dataFinal)}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
