import type { Mail } from "./index";

/** Validade do link de redefinição, em segundos (design P5). */
export const RESET_LINK_TTL_SECONDS = 60 * 60;

/** Link para a página de redefinição (design P2). */
export function passwordResetUrl(baseUrl: string, token: string): string {
  const url = new URL("/redefinir-senha", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** E-mail com o link de redefinição de senha. */
export function passwordResetMail(input: {
  to: string;
  name: string;
  url: string;
}): Mail {
  const { to, name, url } = input;
  return {
    to,
    subject: "Redefinir senha · Ficha D&D",
    text: [
      `Olá, ${name}.`,
      "",
      "Recebemos um pedido para redefinir a sua senha na Ficha D&D. Para escolher uma nova senha, abra o link abaixo:",
      "",
      url,
      "",
      "O link vale por 1 hora e só pode ser usado uma vez. Se você não pediu a redefinição, ignore este e-mail: a sua senha continua a mesma.",
    ].join("\n"),
    html: [
      `<p>Olá, ${escapeHtml(name)}.</p>`,
      "<p>Recebemos um pedido para redefinir a sua senha na Ficha D&amp;D. Para escolher uma nova senha, abra o link abaixo:</p>",
      `<p><a href="${escapeHtml(url)}">Redefinir senha</a></p>`,
      "<p>O link vale por 1 hora e só pode ser usado uma vez. Se você não pediu a redefinição, ignore este e-mail: a sua senha continua a mesma.</p>",
    ].join("\n"),
  };
}
