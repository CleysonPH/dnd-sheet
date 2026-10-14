import { beforeEach, describe, expect, it } from "vitest";

import { getAuth } from "@/server/auth";
import {
  requireAdmin,
  requireSession,
  requireUser,
} from "@/server/auth/guards";
import {
  TEST_PASSWORD,
  createTestUser,
  resetDatabase,
  signIn,
} from "@/server/test/helpers";

import {
  createAccount,
  deactivateAccount,
  listAccounts,
  reactivateAccount,
  resetAccountPassword,
  setAccountRole,
} from "./service";

async function signInAdmin() {
  const admin = await createTestUser({
    name: "Mestre",
    email: "mestre@mesa.com",
    role: "admin",
  });
  return { admin, headers: await signIn("mestre@mesa.com") };
}

describe("administração de contas", () => {
  beforeEach(resetDatabase);

  describe("acesso", () => {
    it("usuário comum não chama nenhuma operação", async () => {
      const lyra = await createTestUser({ email: "lyra@mesa.com" });
      const headers = await signIn("lyra@mesa.com");
      const forbidden = { code: "FORBIDDEN" };

      await expect(listAccounts(headers)).rejects.toMatchObject(forbidden);
      await expect(
        createAccount(headers, { name: "X", email: "x@mesa.com" }),
      ).rejects.toMatchObject(forbidden);
      await expect(deactivateAccount(headers, lyra.id)).rejects.toMatchObject(
        forbidden,
      );
      await expect(
        setAccountRole(headers, lyra.id, "admin"),
      ).rejects.toMatchObject(forbidden);
      await expect(
        resetAccountPassword(headers, lyra.id),
      ).rejects.toMatchObject(forbidden);
    });
  });

  describe("listar", () => {
    it("mostra contas ativas e desativadas", async () => {
      const { headers } = await signInAdmin();
      for (const email of ["a@mesa.com", "b@mesa.com", "c@mesa.com"]) {
        await createTestUser({ email });
      }
      const [first] = (await listAccounts(headers)).filter(
        (a) => a.email === "a@mesa.com",
      );
      await deactivateAccount(headers, first!.id);

      const accounts = await listAccounts(headers);

      expect(accounts).toHaveLength(4);
      expect(accounts.find((a) => a.email === "a@mesa.com")?.active).toBe(
        false,
      );
      expect(accounts.find((a) => a.email === "mestre@mesa.com")).toMatchObject(
        { role: "admin", active: true, name: "Mestre" },
      );
      expect(accounts[0]?.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("criar", () => {
    it("cria conta ativa, comum, com troca obrigatória", async () => {
      const { headers } = await signInAdmin();

      const result = await createAccount(headers, {
        name: "Lyra",
        email: "lyra@mesa.com",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.account).toMatchObject({
        name: "Lyra",
        email: "lyra@mesa.com",
        role: "user",
        active: true,
      });
      expect(result.tempPassword.length).toBeGreaterThanOrEqual(12);

      const lyra = await signIn("lyra@mesa.com", result.tempPassword);
      const session = await requireSession(lyra);
      expect(session.user.mustChangePassword).toBe(true);
    });

    it("gera senhas diferentes para contas diferentes", async () => {
      const { headers } = await signInAdmin();
      const a = await createAccount(headers, {
        name: "A",
        email: "a@mesa.com",
      });
      const b = await createAccount(headers, {
        name: "B",
        email: "b@mesa.com",
      });
      expect(a.ok && b.ok && a.tempPassword !== b.tempPassword).toBe(true);
    });

    it("recusa e-mail já cadastrado, com qualquer caixa", async () => {
      const { headers } = await signInAdmin();
      await createAccount(headers, { name: "Lyra", email: "lyra@mesa.com" });

      const result = await createAccount(headers, {
        name: "Outra",
        email: "LYRA@Mesa.com",
      });

      expect(result).toEqual({
        ok: false,
        error: "EMAIL_IN_USE",
        fieldErrors: { email: "Este e-mail já está em uso" },
      });
    });

    it("recusa nome vazio e e-mail inválido indicando o campo", async () => {
      const { headers } = await signInAdmin();

      const result = await createAccount(headers, {
        name: "  ",
        email: "nao-e-email",
      });

      expect(result).toEqual({
        ok: false,
        error: "INVALID_INPUT",
        fieldErrors: {
          name: "Informe o nome",
          email: "E-mail em formato inválido",
        },
      });
      expect(await listAccounts(headers)).toHaveLength(1);
    });
  });

  describe("desativar e reativar", () => {
    it("desativar encerra as sessões e bloqueia o login", async () => {
      const { headers } = await signInAdmin();
      const lyra = await createTestUser({ email: "lyra@mesa.com" });
      const lyraSession = await signIn("lyra@mesa.com");

      expect(await deactivateAccount(headers, lyra.id)).toEqual({ ok: true });

      await expect(requireSession(lyraSession)).rejects.toMatchObject({
        code: "UNAUTHENTICATED",
      });
      await expect(
        getAuth().api.signInEmail({
          body: { email: "lyra@mesa.com", password: TEST_PASSWORD },
        }),
      ).rejects.toMatchObject({
        body: {
          code: "BANNED_USER",
          message: "Conta desativada. Fale com o administrador.",
        },
      });
    });

    it("reativar devolve o acesso com a mesma senha", async () => {
      const { headers } = await signInAdmin();
      const lyra = await createTestUser({ email: "lyra@mesa.com" });
      await deactivateAccount(headers, lyra.id);

      expect(await reactivateAccount(headers, lyra.id)).toEqual({ ok: true });

      await expect(signIn("lyra@mesa.com")).resolves.toBeDefined();
      const accounts = await listAccounts(headers);
      expect(accounts.find((a) => a.id === lyra.id)?.active).toBe(true);
    });
  });

  describe("redefinir senha", () => {
    it("gera nova provisória, invalida a antiga, encerra sessões e exige troca", async () => {
      const { headers } = await signInAdmin();
      const lyra = await createTestUser({ email: "lyra@mesa.com" });
      const lyraSession = await signIn("lyra@mesa.com");

      const result = await resetAccountPassword(headers, lyra.id);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      await expect(requireSession(lyraSession)).rejects.toMatchObject({
        code: "UNAUTHENTICATED",
      });
      await expect(signIn("lyra@mesa.com", TEST_PASSWORD)).rejects.toThrow();
      const fresh = await signIn("lyra@mesa.com", result.tempPassword);
      const session = await requireSession(fresh);
      expect(session.user.mustChangePassword).toBe(true);
    });
  });

  describe("papel", () => {
    it("promover dá acesso à área de admin na próxima ação", async () => {
      const { headers } = await signInAdmin();
      const lyra = await createTestUser({ email: "lyra@mesa.com" });
      const lyraSession = await signIn("lyra@mesa.com");

      expect(await setAccountRole(headers, lyra.id, "admin")).toEqual({
        ok: true,
      });

      await expect(requireAdmin(lyraSession)).resolves.toBeDefined();
    });

    it("rebaixar tira o acesso na próxima ação", async () => {
      const { headers } = await signInAdmin();
      const outro = await createTestUser({
        email: "outro@mesa.com",
        role: "admin",
      });
      const outroSession = await signIn("outro@mesa.com");

      await setAccountRole(headers, outro.id, "user");

      await expect(requireAdmin(outroSession)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("o admin não altera o próprio acesso", () => {
    it("recusa desativar, rebaixar e redefinir a própria conta", async () => {
      const { admin, headers } = await signInAdmin();
      const self = { ok: false, error: "SELF_ACTION" };

      expect(await deactivateAccount(headers, admin.id)).toEqual(self);
      expect(await setAccountRole(headers, admin.id, "user")).toEqual(self);
      expect(await resetAccountPassword(headers, admin.id)).toEqual(self);

      const session = await requireAdmin(headers);
      expect(session.user).toMatchObject({ role: "admin", banned: false });
    });
  });

  it("recusa ações sobre uma conta inexistente", async () => {
    const { headers } = await signInAdmin();
    expect(await deactivateAccount(headers, "nao-existe")).toEqual({
      ok: false,
      error: "NOT_FOUND",
    });
  });

  it("admin também tem acesso de usuário comum", async () => {
    const { headers } = await signInAdmin();
    await expect(requireUser(headers)).resolves.toBeDefined();
  });
});
