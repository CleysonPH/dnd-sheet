import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { getMailEnv } from "@/lib/env";

export type Mail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let transporter: Transporter | undefined;

/** Transporte SMTP único, criado na primeira chamada (design P1). */
function getTransporter(): Transporter {
  if (!transporter) {
    const env = getMailEnv();
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
    });
  }
  return transporter;
}

/** Envia um e-mail pelo SMTP configurado. Lança erro se o envio falhar. */
export async function sendMail(mail: Mail): Promise<void> {
  await getTransporter().sendMail({ from: getMailEnv().MAIL_FROM, ...mail });
}
