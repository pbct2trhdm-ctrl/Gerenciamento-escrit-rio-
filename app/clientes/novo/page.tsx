import { ClienteForm } from "@/components/cliente-form";
import { criarCliente } from "@/lib/actions/clientes";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default function NovoClientePage() {
  return (
    <div>
      <LinkVoltar href="/clientes" label="Voltar para Clientes" />
      <h1 className={`${classeTituloPagina} mb-6`}>Novo cliente</h1>
      <ClienteForm action={criarCliente} />
    </div>
  );
}
