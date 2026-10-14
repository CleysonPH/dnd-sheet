import { beforeEach, describe, expect, it } from "vitest";

import { requireSession } from "@/server/auth/guards";
import { getDb } from "@/server/db";
import { user } from "@/server/db/schema";
import { resetDatabase, signIn } from "@/server/test/helpers";

import { seedAdmin } from "./seed";

const env = {
  SEED_ADMIN_NAME: "Mestre",
  SEED_ADMIN_EMAIL: "Mestre@Mesa.com",
  SEED_ADMIN_PASSWORD: "senha-inicial-123",
};

describe("seedAdmin", () => {
  beforeEach(resetDatabase);

  it("cria um admin ativo que precisa trocar a senha", async () => {
    expect(await seedAdmin(env)).toEqual({
      created: true,
      email: "mestre@mesa.com",
    });

    const headers = await signIn("mestre@mesa.com", env.SEED_ADMIN_PASSWORD);
    const { user: admin } = await requireSession(headers);
    expect(admin).toMatchObject({
      name: "Mestre",
      role: "admin",
      banned: false,
      mustChangePassword: true,
    });
  });

  it("não cria nem altera nada se o e-mail já existe", async () => {
    await seedAdmin(env);
    const before = await getDb().select().from(user);

    const result = await seedAdmin({
      ...env,
      SEED_ADMIN_NAME: "Outro nome",
      SEED_ADMIN_PASSWORD: "outra-senha-456",
    });

    expect(result).toEqual({ created: false, email: "mestre@mesa.com" });
    expect(await getDb().select().from(user)).toEqual(before);
    await expect(
      signIn("mestre@mesa.com", env.SEED_ADMIN_PASSWORD),
    ).resolves.toBeDefined();
  });

  it("falha indicando a variável ausente, sem criar nada", async () => {
    await expect(
      seedAdmin({ ...env, SEED_ADMIN_EMAIL: undefined }),
    ).rejects.toThrow(/SEED_ADMIN_EMAIL/);
    expect(await getDb().select().from(user)).toHaveLength(0);
  });
});
