import { beforeEach, describe, expect, it } from "vitest";

import {
  TEST_PASSWORD,
  createTestUser,
  resetDatabase,
  signIn,
} from "@/server/test/helpers";

import { requireSession, requireUser } from "./guards";
import { changePassword } from "./password";

const NEW_PASSWORD = "nova-senha-segura";

/** Headers de requisição com o cookie de sessão devolvido pela troca. */
function sessionFrom(responseHeaders: Headers) {
  const cookie = responseHeaders
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  return new Headers({ cookie });
}

describe("changePassword", () => {
  beforeEach(resetDatabase);

  it("conclui a troca obrigatória", async () => {
    await createTestUser({ email: "lyra@mesa.com", mustChangePassword: true });
    const headers = await signIn("lyra@mesa.com");

    const result = await changePassword(headers, {
      currentPassword: TEST_PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const session = await requireUser(sessionFrom(result.responseHeaders));
    expect(session.user.mustChangePassword).toBe(false);
    await expect(signIn("lyra@mesa.com", NEW_PASSWORD)).resolves.toBeDefined();
    await expect(signIn("lyra@mesa.com", TEST_PASSWORD)).rejects.toThrow();
  });

  it("troca voluntária mantém a sessão atual válida", async () => {
    await createTestUser({ email: "lyra@mesa.com" });
    const headers = await signIn("lyra@mesa.com");

    const result = await changePassword(headers, {
      currentPassword: TEST_PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    await expect(
      requireUser(sessionFrom(result.responseHeaders)),
    ).resolves.toBeDefined();
  });

  it("encerra as outras sessões", async () => {
    await createTestUser({ email: "lyra@mesa.com" });
    const celular = await signIn("lyra@mesa.com");
    const computador = await signIn("lyra@mesa.com");

    await changePassword(computador, {
      currentPassword: TEST_PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    await expect(requireSession(celular)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("recusa a senha atual errada sem mudar nada", async () => {
    await createTestUser({ email: "lyra@mesa.com", mustChangePassword: true });
    const headers = await signIn("lyra@mesa.com");

    const result = await changePassword(headers, {
      currentPassword: "senha-errada",
      newPassword: NEW_PASSWORD,
    });

    expect(result).toEqual({
      ok: false,
      fieldErrors: { currentPassword: "Senha atual incorreta" },
    });
    await expect(signIn("lyra@mesa.com", TEST_PASSWORD)).resolves.toBeDefined();
    const session = await requireSession(headers);
    expect(session.user.mustChangePassword).toBe(true);
  });

  it("recusa nova senha com 7 caracteres", async () => {
    await createTestUser({ email: "lyra@mesa.com" });
    const headers = await signIn("lyra@mesa.com");

    const result = await changePassword(headers, {
      currentPassword: TEST_PASSWORD,
      newPassword: "1234567",
    });

    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        newPassword: "A senha precisa ter pelo menos 8 caracteres",
      },
    });
  });

  it("recusa nova senha igual à atual", async () => {
    await createTestUser({ email: "lyra@mesa.com" });
    const headers = await signIn("lyra@mesa.com");

    const result = await changePassword(headers, {
      currentPassword: TEST_PASSWORD,
      newPassword: TEST_PASSWORD,
    });

    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        newPassword: "A nova senha precisa ser diferente da atual",
      },
    });
  });

  it("recusa quem não tem sessão", async () => {
    await expect(
      changePassword(new Headers(), {
        currentPassword: TEST_PASSWORD,
        newPassword: NEW_PASSWORD,
      }),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
});
