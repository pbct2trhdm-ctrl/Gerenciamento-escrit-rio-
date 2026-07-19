import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClienteForm } from "@/components/cliente-form";
import { atualizarCliente } from "@/lib/actions/clientes";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({ where: { id } });

  if (!cliente) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Editar cliente</h1>
      <ClienteForm cliente={cliente} action={atualizarCliente.bind(null, id)} />
    </div>
  );
}
