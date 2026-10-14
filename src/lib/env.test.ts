import { describe, expect, it } from "vitest";

import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("aceita uma DATABASE_URL do Postgres", () => {
    const url = "postgresql://dnd:dnd@localhost:5432/dnd_sheet";
    expect(parseEnv({ DATABASE_URL: url })).toEqual({ DATABASE_URL: url });
  });

  it("aceita o esquema postgres://", () => {
    const url = "postgres://dnd:dnd@db:5432/dnd_sheet";
    expect(parseEnv({ DATABASE_URL: url }).DATABASE_URL).toBe(url);
  });

  it("rejeita DATABASE_URL ausente", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("rejeita uma URL que não é do Postgres", () => {
    expect(() =>
      parseEnv({ DATABASE_URL: "mysql://localhost:3306/db" }),
    ).toThrow(/DATABASE_URL/);
  });
});
