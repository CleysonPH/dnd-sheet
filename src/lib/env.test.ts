import { describe, expect, it } from "vitest";

import { parseEnv } from "@/lib/env";

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
