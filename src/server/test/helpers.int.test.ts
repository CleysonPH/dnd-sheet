import { beforeEach, describe, expect, it } from "vitest";

import { getAuth } from "@/server/auth";

import { createTestUser, resetDatabase, signIn } from "./helpers";

describe("infraestrutura de integração", () => {
  beforeEach(resetDatabase);

  it("cria uma conta e obtém uma sessão real", async () => {
    await createTestUser({ email: "lyra@mesa.com", mustChangePassword: true });
    const headers = await signIn("lyra@mesa.com");

    const session = await getAuth().api.getSession({ headers });

    expect(session?.user.email).toBe("lyra@mesa.com");
    expect(session?.user.mustChangePassword).toBe(true);
    expect(session?.user.role).toBe("user");
  });
});
