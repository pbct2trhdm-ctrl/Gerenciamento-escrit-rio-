"use client";

import { useFormStatus } from "react-dom";

/**
 * Botão de submit que mostra um texto de espera enquanto a action roda.
 * Com name/value, só o botão clicado troca de texto; os demais ficam
 * desabilitados para evitar um segundo envio no meio do primeiro.
 */
export function BotaoEnvio({
  children,
  textoAguardando,
  className,
  name,
  value,
}: {
  children: React.ReactNode;
  textoAguardando: string;
  className: string;
  name?: string;
  value?: string;
}) {
  const { pending, data } = useFormStatus();
  const esteBotao = pending && (!name || data?.get(name) === value);

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={`${className} disabled:opacity-60 disabled:cursor-wait`}
    >
      {esteBotao ? textoAguardando : children}
    </button>
  );
}
