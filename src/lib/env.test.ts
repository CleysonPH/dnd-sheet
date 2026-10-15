import { describe, expect, it } from "vitest";

import { parseEnv, parseMailEnv } from "@/lib/env";

const valid = {
  DATABASE_URL: "postgresql://dnd:dnd@localhost:5432/dnd_sheet",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("aceita um ambiente completo", () => {
    expect(parseEnv(valid)).toEqual(valid);
  });

  it("aceita o esquema postgres://", () => {
    const url = "postgres://dnd:dnd@db:5432/dnd_sheet";
    expect(parseEnv({ ...valid, DATABASE_URL: url }).DATABASE_URL).toBe(url);
  });

  it("rejeita DATABASE_URL ausente", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: undefined })).toThrow(
      /DATABASE_URL/,
    );
  });

  it("rejeita uma URL que não é do Postgres", () => {
    expect(() =>
      parseEnv({ ...valid, DATABASE_URL: "mysql://localhost:3306/db" }),
    ).toThrow(/DATABASE_URL/);
  });

  it("rejeita BETTER_AUTH_SECRET com menos de 32 caracteres", () => {
    expect(() =>
      parseEnv({ ...valid, BETTER_AUTH_SECRET: "a".repeat(31) }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });

  it("rejeita BETTER_AUTH_URL ausente", () => {
    expect(() => parseEnv({ ...valid, BETTER_AUTH_URL: undefined })).toThrow(
      /BETTER_AUTH_URL/,
    );
  });
});

const mail = {
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  MAIL_FROM: "Ficha D&D <ficha@localhost>",
};

describe("parseMailEnv", () => {
  it("aceita o Mailpit, sem usuário nem senha", () => {
    expect(parseMailEnv({ ...mail, SMTP_USER: "", SMTP_PASSWORD: "" })).toEqual(
      {
        SMTP_HOST: "localhost",
        SMTP_PORT: 1025,
        SMTP_SECURE: false,
        SMTP_USER: undefined,
        SMTP_PASSWORD: undefined,
        MAIL_FROM: "Ficha D&D <ficha@localhost>",
      },
    );
  });

  it("aceita TLS direto com usuário e senha", () => {
    const env = parseMailEnv({
      ...mail,
      SMTP_PORT: "465",
      SMTP_SECURE: "true",
      SMTP_USER: "mesa@gmail.com",
      SMTP_PASSWORD: "senha-de-app",
    });
    expect(env.SMTP_SECURE).toBe(true);
    expect(env.SMTP_USER).toBe("mesa@gmail.com");
  });

  it.each(["SMTP_HOST", "SMTP_PORT", "MAIL_FROM"] as const)(
    "rejeita %s ausente",
    (name) => {
      expect(() => parseMailEnv({ ...mail, [name]: undefined })).toThrow(
        new RegExp(name),
      );
    },
  );

  it("rejeita usuário sem senha", () => {
    expect(() =>
      parseMailEnv({ ...mail, SMTP_USER: "mesa@gmail.com" }),
    ).toThrow(/SMTP_PASSWORD/);
  });

  it("rejeita porta inválida", () => {
    expect(() => parseMailEnv({ ...mail, SMTP_PORT: "abc" })).toThrow(
      /SMTP_PORT/,
    );
  });
});
