import { describe, expect, it } from "vitest";

import { TEMP_PASSWORD_ALPHABET, generateTempPassword } from "./temp-password";

describe("generateTempPassword", () => {
  it("tem 16 caracteres, acima do mínimo de 12 da spec", () => {
    expect(generateTempPassword()).toHaveLength(16);
  });

  it("usa só o alfabeto sem caracteres ambíguos", () => {
    const password = Array.from({ length: 50 }, () =>
      generateTempPassword(),
    ).join("");
    for (const char of password) {
      expect(TEMP_PASSWORD_ALPHABET).toContain(char);
    }
    expect(password).not.toMatch(/[0O1lI]/);
  });

  it("gera senhas diferentes a cada chamada", () => {
    const passwords = new Set(
      Array.from({ length: 1000 }, () => generateTempPassword()),
    );
    expect(passwords.size).toBe(1000);
  });
});
