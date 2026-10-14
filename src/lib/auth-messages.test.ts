import { describe, expect, it } from "vitest";

import { LOGIN_MESSAGES, loginErrorMessage } from "@/lib/auth-messages";

describe("loginErrorMessage", () => {
  it("usa a mesma mensagem para e-mail inexistente e senha errada", () => {
    expect(
      loginErrorMessage({ status: 401, code: "INVALID_EMAIL_OR_PASSWORD" }),
    ).toBe(LOGIN_MESSAGES.invalidCredentials);
  });

  it("identifica conta desativada", () => {
    expect(loginErrorMessage({ status: 403, code: "BANNED_USER" })).toBe(
      LOGIN_MESSAGES.deactivated,
    );
  });

  it("identifica excesso de tentativas", () => {
    expect(loginErrorMessage({ status: 429 })).toBe(
      LOGIN_MESSAGES.tooManyAttempts,
    );
  });

  it("cai numa mensagem genérica para o resto", () => {
    expect(loginErrorMessage({ status: 500 })).toBe(LOGIN_MESSAGES.unexpected);
    expect(loginErrorMessage(null)).toBe(LOGIN_MESSAGES.unexpected);
  });
});
