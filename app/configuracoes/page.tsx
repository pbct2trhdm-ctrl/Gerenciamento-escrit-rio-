import { prisma } from "@/lib/prisma";
import {
  LABEL_STATUS_NOTIFICACAO,
  LABEL_TIPO_PRAZO,
  formatarData,
} from "@/lib/formatacao";
import { NotificacaoConfigForm } from "@/components/notificacao-config-form";
import { ConfiguracaoPublicacoesForm } from "@/components/configuracao-publicacoes-form";
import { salvarConfiguracaoNotificacoes } from "@/lib/actions/notificacoes";
import { salvarConfiguracaoPublicacoes } from "@/lib/actions/publicacoes";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { classeCard, classeTituloPagina, classeTituloSecao } from "@/lib/estilos";

export default async function ConfiguracoesPage() {
  const [configuracao, notificacoes, configuracaoPublicacoes] = await Promise.all([
    prisma.configuracaoNotificacao.findUnique({ where: { id: 1 } }),
    prisma.notificacao.findMany({
      orderBy: { dataEnvio: "desc" },
      take: 20,
      include: { prazo: { include: { processo: { include: { cliente: true } } } } },
    }),
    prisma.configuracaoPublicacoes.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className={`${classeTituloPagina} mb-6`}>Configurações</h1>

      <h2 className={`${classeTituloSecao} mb-3`}>Notificações de prazo por WhatsApp</h2>
      <p className="text-sm text-texto-secundario mb-4">
        Uma vez por dia, no horário abaixo, o sistema verifica os prazos pendentes e
        envia um aviso de WhatsApp para os que estiverem a X dias do vencimento
        (a antecedência configurada aqui, ou a sobrescrita em cada prazo).
      </p>
      <div className={`${classeCard} mb-10`}>
        <NotificacaoConfigForm
          configuracao={configuracao}
          action={salvarConfiguracaoNotificacoes}
        />
      </div>

      <h2 className={`${classeTituloSecao} mb-3`}>Publicações (DJEN)</h2>
      <p className="text-sm text-texto-secundario mb-4">
        Uma vez por dia, no horário abaixo, o sistema busca novas publicações no Diário
        de Justiça Eletrônico Nacional para a OAB/seccional informadas, tenta vincular
        automaticamente a um processo cadastrado e avisa por WhatsApp (configuração
        acima) quando houver publicações novas.
      </p>
      <div className={`${classeCard} mb-10`}>
        <ConfiguracaoPublicacoesForm
          configuracao={configuracaoPublicacoes}
          action={salvarConfiguracaoPublicacoes}
        />
      </div>

      <h2 className={`${classeTituloSecao} mb-3`}>Últimos envios</h2>
      {notificacoes.length === 0 ? (
        <EmptyState mensagem="Nenhuma notificação enviada ainda." />
      ) : (
        <ul className="space-y-2">
          {notificacoes.map((notificacao) => (
            <li key={notificacao.id} className={`text-sm ${classeCard}`}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium">
                    {notificacao.prazo.processo.cliente.nome} ·{" "}
                    {LABEL_TIPO_PRAZO[notificacao.prazo.tipo] ?? notificacao.prazo.tipo}
                  </p>
                  <p className="text-xs text-texto-secundario tabular-nums">
                    {formatarData(notificacao.dataEnvio)} ·{" "}
                    {notificacao.prazo.processo.numeroProcesso ?? "sem número"}
                  </p>
                </div>
                <Badge tier={notificacao.status === "ENVIADO" ? "tranquilo" : "critico"}>
                  {LABEL_STATUS_NOTIFICACAO[notificacao.status]}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
