import type { Cliente, Processo } from "@/app/generated/prisma/client";
import { classeInputAuto, classeBotaoSecundario } from "@/lib/estilos";

export function VincularPublicacaoForm({
  processos,
  action,
}: {
  processos: (Pick<Processo, "id" | "numeroProcesso"> & { cliente: Pick<Cliente, "nome"> })[];
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="flex items-center gap-2 flex-wrap">
      <select name="processoId" required defaultValue="" className={classeInputAuto}>
        <option value="" disabled>
          Vincular a um processo…
        </option>
        {processos.map((processo) => (
          <option key={processo.id} value={processo.id}>
            {processo.cliente.nome} · {processo.numeroProcesso ?? "sem número"}
          </option>
        ))}
      </select>
      <button type="submit" className={`${classeBotaoSecundario} !px-3 !py-1 text-xs`}>
        Vincular
      </button>
    </form>
  );
}
