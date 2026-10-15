import { describe, expect, it } from "vitest";

import {
  SHEET_SCHEMA_VERSION,
  createSheetDocument,
  sheetDocumentBytes,
  sheetDocumentSchema,
} from "./document";

const valid = {
  ...createSheetDocument("Thorin"),
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

function withPart(part: keyof typeof valid, patch: Record<string, unknown>) {
  return { ...valid, [part]: { ...(valid[part] as object), ...patch } };
}

function firstError(input: unknown) {
  const result = sheetDocumentSchema.safeParse(input);
  return result.success ? null : result.error.issues[0];
}

describe("createSheetDocument", () => {
  it("cria no nível 1 com os valores iniciais da spec", () => {
    const document = createSheetDocument("Thorin");
    expect(document.schemaVersion).toBe(SHEET_SCHEMA_VERSION);
    expect(document.identity).toEqual({
      name: "Thorin",
      species: "",
      class: "",
      level: 1,
      background: "",
    });
    expect(Object.values(document.abilities)).toEqual([10, 10, 10, 10, 10, 10]);
    expect(Object.values(document.savingThrows).every((p) => !p)).toBe(true);
    expect(Object.keys(document.skills)).toHaveLength(18);
    expect(Object.values(document.skills).every((p) => p === "none")).toBe(
      true,
    );
    expect(document.hitPoints).toEqual({
      hitDie: 8,
      damage: 0,
      temp: 0,
      hitDiceSpent: 0,
    });
    expect(document.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(document.speed).toBe(9);
    expect(document.overrides).toEqual({});
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
    expect(firstError({ ...valid, schemaVersion: 1 })).not.toBeNull();
    expect(firstError({ ...valid, schemaVersion: 3 })).not.toBeNull();
  });

  it("exige atributos inteiros de 1 a 30", () => {
    for (const value of [0, 31, 10.5, "10"]) {
      expect(firstError(withPart("abilities", { str: value }))?.message).toBe(
        "O valor vai de 1 a 30",
      );
    }
    expect(firstError(withPart("abilities", { str: 1, cha: 30 }))).toBeNull();
  });

  it("exige as seis chaves de atributo e as 18 perícias, sem sobras", () => {
    const abilities: Record<string, number> = { ...valid.abilities };
    delete abilities.cha;
    expect(firstError({ ...valid, abilities })).not.toBeNull();
    const skills: Record<string, string> = { ...valid.skills };
    delete skills.stealth;
    expect(firstError({ ...valid, skills })).not.toBeNull();
    expect(firstError(withPart("skills", { cooking: "none" }))?.code).toBe(
      "unrecognized_keys",
    );
    expect(firstError(withPart("savingThrows", { luck: true }))?.code).toBe(
      "unrecognized_keys",
    );
  });

  it("aceita só os três níveis de proficiência em perícias", () => {
    expect(firstError(withPart("skills", { stealth: "expertise" }))).toBeNull();
    expect(firstError(withPart("skills", { stealth: "half" }))).not.toBeNull();
    expect(firstError(withPart("savingThrows", { str: "sim" }))).not.toBeNull();
  });

  it("limita os campos de PV e de testes contra a morte", () => {
    for (const hitDie of [6, 8, 10, 12]) {
      expect(firstError(withPart("hitPoints", { hitDie }))).toBeNull();
    }
    expect(firstError(withPart("hitPoints", { hitDie: 4 }))).not.toBeNull();
    for (const field of ["damage", "temp", "hitDiceSpent"]) {
      expect(firstError(withPart("hitPoints", { [field]: -1 }))).not.toBeNull();
      expect(
        firstError(withPart("hitPoints", { [field]: 1.5 })),
      ).not.toBeNull();
      expect(firstError(withPart("hitPoints", { [field]: 999 }))).toBeNull();
    }
    expect(firstError(withPart("deathSaves", { successes: 4 }))).not.toBeNull();
    expect(firstError(withPart("deathSaves", { failures: 3 }))).toBeNull();
  });

  it("aceita deslocamento de 0 a 999 com até uma casa decimal", () => {
    for (const speed of [0, 7.5, 10.1, 999]) {
      expect(firstError({ ...valid, speed })).toBeNull();
    }
    for (const speed of [-3, 1000, 7.25]) {
      expect(firstError({ ...valid, speed })?.message).toBe(
        "Use um número de 0 a 999, com até uma casa decimal",
      );
    }
  });

  it("aceita overrides inteiros só de valores derivados conhecidos", () => {
    expect(
      firstError({
        ...valid,
        overrides: { hitPointsMax: 61, "mod.dex": -2, "skill.stealth": 9 },
      }),
    ).toBeNull();
    expect(
      firstError({ ...valid, overrides: { armorClass: 15 } }),
    ).not.toBeNull();
    expect(
      firstError({ ...valid, overrides: { hitPointsMax: 2.5 } })?.message,
    ).toBe("O valor deve ser inteiro");
    expect(
      firstError({ ...valid, overrides: { hitPointsMax: "61" } }),
    ).not.toBeNull();
  });
});

describe("sheetDocumentBytes", () => {
  it("conta bytes UTF-8, não caracteres", () => {
    expect(sheetDocumentBytes("ã")).toBe(4); // aspas + 2 bytes
  });
});
