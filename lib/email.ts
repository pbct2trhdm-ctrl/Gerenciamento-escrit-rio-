import path from "path";
import nodemailer from "nodemailer";
import { NOME_ESCRITORIO } from "@/lib/escritorio";

/**
 * Envio de e-mail pela conta Gmail do escritório, autenticada com uma "senha
 * de app" do Google (GMAIL_USUARIO e GMAIL_SENHA_APP no .env). As mensagens
 * enviadas ficam na pasta Enviados da própria conta.
 */

export type ResultadoEnvioEmail = { sucesso: true } | { sucesso: false; erro: string };

export function emailConfigurado(): boolean {
  return Boolean(process.env.GMAIL_USUARIO && process.env.GMAIL_SENHA_APP);
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Converte o texto simples em HTML (parágrafos) com a logo no rodapé. */
function montarHtml(corpo: string): string {
  const paragrafos = corpo
    .split(/\n{2,}/)
    .map((paragrafo) => `<p style="margin:0 0 14px">${escaparHtml(paragrafo).replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#13303f;max-width:600px">
${paragrafos}
<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px">
<img src="cid:logo-escritorio" alt="${escaparHtml(NOME_ESCRITORIO)}" width="220" style="display:block">
</div>`;
}

export async function enviarEmail(
  destinatario: string,
  assunto: string,
  corpo: string
): Promise<ResultadoEnvioEmail> {
  const usuario = process.env.GMAIL_USUARIO;
  const senha = process.env.GMAIL_SENHA_APP;
  if (!usuario || !senha) {
    return {
      sucesso: false,
      erro: "E-mail não configurado. Inclua GMAIL_USUARIO e GMAIL_SENHA_APP no arquivo .env e reinicie o app.",
    };
  }

  try {
    const transporte = nodemailer.createTransport({
      service: "gmail",
      auth: { user: usuario, pass: senha.replace(/\s/g, "") },
    });

    await transporte.sendMail({
      from: `"Pastana Mota Advocacia" <${usuario}>`,
      to: destinatario,
      subject: assunto,
      text: corpo,
      html: montarHtml(corpo),
      attachments: [
        {
          filename: "logo.png",
          path: path.join(process.cwd(), "public", "logo.png"),
          cid: "logo-escritorio",
        },
      ],
    });
    return { sucesso: true };
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "erro desconhecido";
    if (/Invalid login|Username and Password not accepted|535/i.test(mensagem)) {
      return {
        sucesso: false,
        erro: "O Gmail recusou o login. Confira GMAIL_USUARIO e a senha de app (GMAIL_SENHA_APP) no .env.",
      };
    }
    return { sucesso: false, erro: `Falha ao enviar e-mail: ${mensagem}` };
  }
}
