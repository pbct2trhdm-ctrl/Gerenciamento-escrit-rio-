"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
}

export async function criarCliente(formData: FormData) {
  const nome = (formData.get("nome") ?? "").toString().trim();
  const tipo = formData.get("tipo") === "PJ" ? "PJ" : "PF";

  if (!nome) {
    throw new Error("Nome é obrigatório");
  }

  const cliente = await prisma.cliente.create({
    data: {
      nome,
      tipo,
      cpfCnpj: textoOuNull(formData.get("cpfCnpj")),
      telefone: textoOuNull(formData.get("telefone")),
      email: textoOuNull(formData.get("email")),
      observacoes: textoOuNull(formData.get("observacoes")),
    },
  });

  revalidatePath("/clientes");
  redirect(`/clientes/${cliente.id}`);
}

export async function atualizarCliente(id: string, formData: FormData) {
  const nome = (formData.get("nome") ?? "").toString().trim();
  const tipo = formData.get("tipo") === "PJ" ? "PJ" : "PF";

  if (!nome) {
    throw new Error("Nome é obrigatório");
  }

  await prisma.cliente.update({
    where: { id },
    data: {
      nome,
      tipo,
      cpfCnpj: textoOuNull(formData.get("cpfCnpj")),
      telefone: textoOuNull(formData.get("telefone")),
      email: textoOuNull(formData.get("email")),
      observacoes: textoOuNull(formData.get("observacoes")),
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

export async function excluirCliente(id: string) {
  await prisma.cliente.delete({ where: { id } });
  revalidatePath("/clientes");
  redirect("/clientes");
}
