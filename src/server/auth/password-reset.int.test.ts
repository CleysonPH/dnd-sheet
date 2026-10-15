import { eq, like } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import {
  deactivateAccount,
  reactivateAccount,
  updateAccountEmail,
} from "@/server/accounts/service";
import { getDb } from "@/server/db";
import { user, verification } from "@/server/db/schema";
import {
  clearMailbox,
  expectNoMessage,
  extractResetToken,
  waitForMessage,
} from "@/server/test/mailpit";
import {
  TEST_PASSWORD,
  createTestUser,
  resetDatabase,
  signIn,
} from "@/server/test/helpers";

import { getAuth } from "./index";

/*
 * Redefinição de senha pela API HTTP do Better Auth (spec authentication,
 * design P2 a P6). Cada teste usa um IP próprio, porque o limite de pedidos
 * guarda a contagem por IP durante todo o arquivo.
 */

const NEW_PASSWORD = "dragao-vermelho";
let ipCounter = 0;

async function post(path: string, body: unknown, ip: string) {
  return getAuth().handler(
    new Request(`http://localhost:3000/api/auth${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify(body),
    }),
  );
}

let ip = "";
const requestReset = (email: string) =>
  post("/request-password-reset", { email }, ip);
const resetPassword = (token: string, newPassword = NEW_PASSWORD) =>
  post("/reset-password", { token, newPassword }, ip);

/** Pede o link para Lyra e devolve o token do e-mail. */
async function linkFor(email: string) {
  expect((await requestReset(email)).status).toBe(200);
  return extractResetToken(await waitForMessage(email));
}

beforeEach(async () => {
  await resetDatabase();
  await clearMailbox();
  ip = `10.0.0.${++ipCounter}`;
});

describe("pedido de redefinição", () => {
  it("Lyra pede com maiúsculas e recebe o link", async () => {
    await createTestUser({ name: "Lyra", email: "lyra@mesa.com" });

    const response = await requestReset("Lyra@Mesa.com");

    expect(response.status).toBe(200);
    const message = await waitForMessage("lyra@mesa.com");
    expect(message.Subject).toBe("Redefinir senha · Ficha D&D");
    expect(message.Text).toContain(
      "http://localhost:3000/redefinir-senha?token=",
    );
  });

  it("e-mail inexistente recebe a mesma resposta e nada é enviado", async () => {
    await createTestUser({ email: "lyra@mesa.com" });
    const existing = await (await requestReset("lyra@mesa.com")).json();

    const response = await requestReset("ninguem@mesa.com");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(existing);
    await expectNoMessage("ninguem@mesa.com");
  });

  it("o 4º pedido em 1 minuto é recusado e não envia e-mail", async () => {
    await createTestUser({ email: "lyra@mesa.com" });
    for (let i = 0; i < 3; i++) {
      expect((await requestReset("ninguem@mesa.com")).status).toBe(200);
    }

    const response = await requestReset("lyra@mesa.com");

    expect(response.status).toBe(429);
    await expectNoMessage("lyra@mesa.com");
  });
});

describe("redefinição pelo link", () => {
  it("troca a senha e a antiga deixa de funcionar", async () => {
    await createTestUser({ email: "lyra@mesa.com" });
    const token = await linkFor("lyra@mesa.com");

    expect((await resetPassword(token)).status).toBe(200);

    await expect(signIn("lyra@mesa.com", NEW_PASSWORD)).resolves.toBeDefined();
    await expect(signIn("lyra@mesa.com", TEST_PASSWORD)).rejects.toThrow();
  });

  it("encerra as sessões abertas", async () => {
    await createTestUser({ email: "lyra@mesa.com" });
    const phone = await signIn("lyra@mesa.com");
    const token = await linkFor("lyra@mesa.com");

    await resetPassword(token);

    expect(await getAuth().api.getSession({ headers: phone })).toBeNull();
  });

  it("conclui a troca de senha obrigatória pendente", async () => {
    const created = await createTestUser({
      email: "lyra@mesa.com",
      mustChangePassword: true,
    });
    const token = await linkFor("lyra@mesa.com");

    await resetPassword(token);

    const [row] = await getDb()
      .select({ mustChangePassword: user.mustChangePassword })
      .from(user)
      .where(eq(user.id, created.id));
    expect(row?.mustChangePassword).toBe(false);
  });

  it("o mesmo link não vale duas vezes", async () => {
    await createTestUser({ email: "lyra@mesa.com" });
    const token = await linkFor("lyra@mesa.com");
    await resetPassword(token);

    const response = await resetPassword(token, "outra-senha-qualquer");

    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("INVALID_TOKEN");
    await expect(signIn("lyra@mesa.com", NEW_PASSWORD)).resolves.toBeDefined();
  });

  it("link expirado é recusado e a senha não muda", async () => {
    await createTestUser({ email: "lyra@mesa.com" });
    const token = await linkFor("lyra@mesa.com");
    await getDb()
      .update(verification)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(like(verification.identifier, "reset-password:%"));

    const response = await resetPassword(token);

    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("INVALID_TOKEN");
    await expect(signIn("lyra@mesa.com")).resolves.toBeDefined();
  });

  it("o link vale 1 hora", async () => {
    await createTestUser({ email: "lyra@mesa.com" });
    const before = Date.now();
    await linkFor("lyra@mesa.com");

    const [row] = await getDb()
      .select({ expiresAt: verification.expiresAt })
      .from(verification)
      .where(like(verification.identifier, "reset-password:%"));
    const ttl = row!.expiresAt.getTime() - before;
    expect(ttl).toBeGreaterThan(59 * 60_000);
    expect(ttl).toBeLessThanOrEqual(60 * 60_000 + 5_000);
  });

  it("senha de 7 caracteres é recusada e o link continua valendo", async () => {
    await createTestUser({ email: "lyra@mesa.com" });
    const token = await linkFor("lyra@mesa.com");

    expect((await resetPassword(token, "1234567")).status).toBe(400);

    expect((await resetPassword(token)).status).toBe(200);
  });
});

describe("conta desativada", () => {
  async function adminHeaders() {
    await createTestUser({ email: "mestre@mesa.com", role: "admin" });
    return signIn("mestre@mesa.com");
  }

  it("não recebe o link e a resposta é a mesma", async () => {
    const admin = await adminHeaders();
    const lyra = await createTestUser({ email: "lyra@mesa.com" });
    await deactivateAccount(admin, lyra.id);

    const response = await requestReset("lyra@mesa.com");

    expect(response.status).toBe(200);
    await expectNoMessage("lyra@mesa.com");
  });

  it("link pedido antes da desativação não vale depois da reativação", async () => {
    const admin = await adminHeaders();
    const lyra = await createTestUser({ email: "lyra@mesa.com" });
    const token = await linkFor("lyra@mesa.com");

    await deactivateAccount(admin, lyra.id);
    await reactivateAccount(admin, lyra.id);
    const response = await resetPassword(token);

    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("INVALID_TOKEN");
    await expect(signIn("lyra@mesa.com")).resolves.toBeDefined();
  });
});

describe("e-mail alterado pelo admin", () => {
  it("o link pedido antes da alteração deixa de valer", async () => {
    await createTestUser({ email: "mestre@mesa.com", role: "admin" });
    const admin = await signIn("mestre@mesa.com");
    const lyra = await createTestUser({ email: "lyra@mesa.com" });
    const token = await linkFor("lyra@mesa.com");

    await updateAccountEmail(admin, lyra.id, "lyra@gmail.com");
    const response = await resetPassword(token);

    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("INVALID_TOKEN");
  });
});
