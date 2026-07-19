import { ClienteForm } from "@/components/cliente-form";
import { criarCliente } from "@/lib/actions/clientes";

export default function NovoClientePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Novo cliente</h1>
      <ClienteForm action={criarCliente} />
    </div>
  );
}
