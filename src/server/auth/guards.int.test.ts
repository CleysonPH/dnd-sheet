import { beforeEach, describe, expect, it } from "vitest";

import { createTestUser, resetDatabase, signIn } from "@/server/test/helpers";

import { requireAdmin, requireSession, requireUser } from "./guards";

const NO_SESSION = new Headers();

describe("guards", () => {
  beforeEach(resetDatabase);

  it("recusam quem não tem sessão", async () => {
    await expect(requireSession(NO_SESSION)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    await expect(requireUser(NO_SESSION)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    await expect(requireAdmin(NO_SESSION)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("recusam um cookie de sessão inválido", async () => {
    const forged = new Headers({ cookie: "better-auth.session_token=forjado" });
    await expect(requireUser(forged)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("com troca de senha pendente, só requireSession passa", async () => {
    await createTestUser({ email: "lyra@mesa.com", mustChangePassword: true });
    const headers = await signIn("lyra@mesa.com");

    await expect(requireSession(headers)).resolves.toBeDefined();
    await expect(requireUser(headers)).rejects.toMatchObject({
      code: "PASSWORD_CHANGE_REQUIRED",
    });
    await expect(requireAdmin(headers)).rejects.toMatchObject({
      code: "PASSWORD_CHANGE_REQUIRED",
    });
  });

  it("usuário comum passa em requireUser e é recusado em requireAdmin", async () => {
    await createTestUser({ email: "lyra@mesa.com" });
    const headers = await signIn("lyra@mesa.com");

    const session = await requireUser(headers);
    expect(session.user.email).toBe("lyra@mesa.com");
    await expect(requireAdmin(headers)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("admin passa em requireAdmin", async () => {
    await createTestUser({ email: "mestre@mesa.com", role: "admin" });
    const headers = await signIn("mestre@mesa.com");

    const session = await requireAdmin(headers);
    expect(session.user.role).toBe("admin");
  });
});
