import { beforeEach, describe, expect, it } from "vitest";

import { getDb } from "@/server/db";
import { createTestUser, resetDatabase } from "@/server/test/helpers";

import { createAuth } from "./config";

/*
 * Limite de pedidos guardado no banco (spec operations, design Y2): duas
 * instâncias, como duas funções serverless, contam juntas.
 */

const instance = () =>
  createAuth({
    db: getDb(),
    secret: "segredo-de-teste-com-mais-de-32-caracteres",
    baseURL: "http://localhost:3000",
    sendPasswordResetMail: async () => {},
  });

const instances = [instance(), instance()];

function requestReset(index: number, ip: string) {
  return instances[index % 2]!.handler(
    new Request("http://localhost:3000/api/auth/request-password-reset", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify({ email: "lyra@mesa.com" }),
    }),
  );
}

beforeEach(resetDatabase);

describe("limite de pedidos entre instâncias", () => {
  it("o 4º pedido em 1 minuto é recusado alternando as instâncias", async () => {
    await createTestUser({ email: "lyra@mesa.com" });

    const statuses = [];
    for (let i = 0; i < 4; i++) {
      statuses.push((await requestReset(i, "10.0.2.1")).status);
    }

    expect(statuses).toEqual([200, 200, 200, 429]);
  });

  it("outro endereço não é afetado", async () => {
    await createTestUser({ email: "lyra@mesa.com" });
    for (let i = 0; i < 4; i++) await requestReset(i, "10.0.2.2");

    expect((await requestReset(0, "10.0.2.3")).status).toBe(200);
  });
});
