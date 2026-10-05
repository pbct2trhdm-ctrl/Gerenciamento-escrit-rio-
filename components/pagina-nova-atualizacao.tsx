import { AtualizacaoUploadForm } from "@/components/atualizacao-upload-form";
import { criarAtualizacaoCliente } from "@/lib/actions/atualizacoes-cliente";
import { iaConfigurada } from "@/lib/ia-atualizacao";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

/** Tela de envio do PDF, compartilhada entre processo judicial e administrativo. */
export function PaginaNovaAtualizacao({
  processoId,
  processoAdministrativoId,
  voltarHref,
  subtitulo,
}: {
  processoId?: string;
  processoAdministrativoId?: string;
  voltarHref: string;
  subtitulo: string;
}) {
  return (
    <div>
      <LinkVoltar href={voltarHref} label="Voltar para o processo" />
      <h1 className={`${classeTituloPagina} mb-1`}>Atualizar o cliente</h1>
      <p className="text-texto-secundario mb-6">{subtitulo}</p>

      <p className="max-w-xl text-sm text-texto-secundario mb-6">
        Anexe o PDF do processo. A IA identifica a movimentação mais recente e
        redige uma mensagem em linguagem simples para WhatsApp e e-mail. Você revisa
        e ajusta o texto antes de qualquer envio. O PDF fica guardado neste
        processo e não é enviado ao cliente. Ao enviar, a movimentação é registrada
        nos andamentos do processo.
      </p>

      {!iaConfigurada() && (
        <div className="max-w-xl mb-6 rounded-lg border border-atencao/40 bg-atencao-fundo px-4 py-3 text-sm text-atencao">
          A IA ainda não está configurada (falta ANTHROPIC_API_KEY no arquivo .env).
          Você ainda pode anexar o PDF e escrever a mensagem manualmente. Veja
          Configurações.
        </div>
      )}

      <AtualizacaoUploadForm
        processoId={processoId}
        processoAdministrativoId={processoAdministrativoId}
        action={criarAtualizacaoCliente}
      />
    </div>
  );
}
