import { ClienteForm } from "@/components/cliente-form";
import { criarCliente } from "@/lib/actions/clientes";
import { classeTituloPagina } from "@/lib/estilos";

export default function NovoClientePage() {
  return (
    <div>
      <h1 className={`${classeTituloPagina} mb-6`}>Novo cliente</h1>
      <ClienteForm action={criarCliente} />
    </div>
  );
}
