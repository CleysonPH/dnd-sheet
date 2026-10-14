import { describe, expect, it } from "vitest";

import {
  SHEET_SCHEMA_VERSION,
  createSheetDocument,
  sheetDocumentBytes,
  sheetDocumentSchema,
} from "./document";

const valid = {
  schemaVersion: SHEET_SCHEMA_VERSION,
  identity: {
    name: "Thorin",
    species: "Anão",
    class: "Bárbaro",
    level: 5,
    background: "Soldado",
  },
};

function withIdentity(patch: Record<string, unknown>) {
  return { ...valid, identity: { ...valid.identity, ...patch } };
}

function firstError(input: unknown) {
  const result = sheetDocumentSchema.safeParse(input);
  return result.success ? null : result.error.issues[0];
}

describe("createSheetDocument", () => {
  it("cria no nível 1 com os demais campos vazios", () => {
    expect(createSheetDocument("Thorin")).toEqual({
      schemaVersion: SHEET_SCHEMA_VERSION,
      identity: {
        name: "Thorin",
        species: "",
        class: "",
        level: 1,
        background: "",
      },
    });
  });

  it("tira os espaços das pontas do nome", () => {
    expect(createSheetDocument("  Grog ").identity.name).toBe("Grog");
  });

  it("recusa nome em branco", () => {
    expect(() => createSheetDocument("   ")).toThrow();
  });
});

describe("sheetDocumentSchema", () => {
  it("aceita um documento completo", () => {
    expect(sheetDocumentSchema.parse(valid)).toEqual(valid);
  });

  it("exige nome entre 1 e 100 caracteres", () => {
    expect(firstError(withIdentity({ name: "" }))?.message).toBe(
      "O nome é obrigatório",
    );
    expect(firstError(withIdentity({ name: "x".repeat(101) }))?.message).toBe(
      "Use no máximo 100 caracteres",
    );
    expect(firstError(withIdentity({ name: "x".repeat(100) }))).toBeNull();
  });

  it("limita espécie, classe e antecedente a 100 caracteres", () => {
    for (const field of ["species", "class", "background"]) {
      expect(firstError(withIdentity({ [field]: "" }))).toBeNull();
      expect(
        firstError(withIdentity({ [field]: "x".repeat(101) }))?.path,
      ).toEqual(["identity", field]);
    }
  });

  it("exige nível inteiro de 1 a 20", () => {
    for (const level of [0, 21, 2.5, "vinte"]) {
      expect(firstError(withIdentity({ level }))?.message).toBe(
        "O nível vai de 1 a 20",
      );
    }
    expect(firstError(withIdentity({ level: 1 }))).toBeNull();
    expect(firstError(withIdentity({ level: 20 }))).toBeNull();
  });

  it("recusa campos desconhecidos", () => {
    expect(firstError({ ...valid, extra: true })?.code).toBe(
      "unrecognized_keys",
    );
    expect(firstError(withIdentity({ hp: 10 }))?.code).toBe(
      "unrecognized_keys",
    );
  });

  it("recusa outra versão de formato", () => {
    expect(firstError({ ...valid, schemaVersion: 2 })).not.toBeNull();
  });
});

describe("sheetDocumentBytes", () => {
  it("conta bytes UTF-8, não caracteres", () => {
    expect(sheetDocumentBytes("ã")).toBe(4); // aspas + 2 bytes
  });
});
