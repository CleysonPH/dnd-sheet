import nodemailer from "nodemailer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDb } from "@/server/db";
import { passwordResetMail } from "@/server/mail/password-reset";
import { createTestUser, resetDatabase } from "@/server/test/helpers";

import { createAuth } from "./config";

/*
 * Falha no envio (design P3): com o SMTP fora do ar, a resposta do pedido é a
 * mesma e o erro vai para o log. Usa uma instância própria do Better Auth com
 * um transporte apontando para uma porta fechada.
 */

const closedPort = nodemailer.createTransport({
  host: "127.0.0.1",
  port: 1,
  connectionTimeout: 1000,
});

const auth = createAuth({
  db: getDb(),
  secret: "segredo-de-teste-com-mais-de-32-caracteres",
  baseURL: "http://localhost:3000",
  sendPasswordResetMail: async (input) => {
    await closedPort.sendMail({
      from: "ficha@localhost",
      ...passwordResetMail(input),
    });
  },
});

function requestReset(email: string) {
  return auth.handler(
    new Request("http://localhost:3000/api/auth/request-password-reset", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-forwarded-for": "10.0.1.1",
      },
      body: JSON.stringify({ email }),
    }),
  );
}

beforeEach(resetDatabase);
afterEach(() => vi.restoreAllMocks());

describe("falha no envio", () => {
  it("responde como sempre e registra o erro no log", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await createTestUser({ email: "lyra@mesa.com" });
    const missing = await (await requestReset("ninguem@mesa.com")).json();

    const response = await requestReset("lyra@mesa.com");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(missing);
    await vi.waitFor(
      () =>
        expect(log).toHaveBeenCalledWith(
          "Falha ao enviar o e-mail de redefinição:",
          expect.anything(),
        ),
      { timeout: 5000 },
    );
  });
});
