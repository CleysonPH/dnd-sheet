import { MAILPIT_URL } from "./mailpit-url";

/*
 * Leitura dos e-mails enviados nos testes de integração, pela API do Mailpit
 * (design P8).
 */

export type MailpitMessage = {
  ID: string;
  Subject: string;
  To: { Address: string }[];
  Text: string;
  HTML: string;
};

async function api(path: string, init?: RequestInit) {
  const response = await fetch(`${MAILPIT_URL}/api/v1${path}`, init);
  if (!response.ok) {
    throw new Error(`Mailpit respondeu ${response.status} em ${path}`);
  }
  return response;
}

/** Apaga todas as mensagens. */
export async function clearMailbox() {
  await api("/messages", { method: "DELETE" });
}

/** Mensagens enviadas para um endereço, da mais recente para a mais antiga. */
export async function messagesTo(to: string): Promise<MailpitMessage[]> {
  const query = encodeURIComponent(`to:"${to}"`);
  const { messages } = (await (await api(`/search?query=${query}`)).json()) as {
    messages: { ID: string }[];
  };
  return Promise.all(
    messages.map(
      async ({ ID }) =>
        (await (await api(`/message/${ID}`)).json()) as MailpitMessage,
    ),
  );
}

/**
 * Espera chegar um e-mail para o endereço. O envio do link não é aguardado
 * (design P3), então o e-mail pode chegar depois da resposta.
 */
export async function waitForMessage(
  to: string,
  timeoutMs = 5000,
): Promise<MailpitMessage> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const [message] = await messagesTo(to);
    if (message) return message;
    if (Date.now() > deadline) {
      throw new Error(`Nenhum e-mail para ${to} em ${timeoutMs} ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Espera um tempo e confere que nenhum e-mail chegou para o endereço. Usado
 * nos casos em que o envio não deve acontecer.
 */
export async function expectNoMessage(to: string, waitMs = 500) {
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  const messages = await messagesTo(to);
  if (messages.length > 0) {
    throw new Error(
      `Esperava nenhum e-mail para ${to}, chegaram ${messages.length}`,
    );
  }
}

/** Token do link de redefinição (`/redefinir-senha?token=…`) do e-mail. */
export function extractResetToken(message: MailpitMessage): string {
  const match = /\/redefinir-senha\?token=([\w-]+)/.exec(message.Text);
  if (!match) throw new Error("O e-mail não tem o link de redefinição");
  return match[1]!;
}
