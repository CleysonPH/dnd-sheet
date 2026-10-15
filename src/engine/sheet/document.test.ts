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
    expect(document.sources).toEqual([]);
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
    expect(firstError({ ...valid, schemaVersion: 4 })).not.toBeNull();
    expect(firstError({ ...valid, schemaVersion: 6 })).not.toBeNull();
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
      firstError({ ...valid, overrides: { attackBonus: 15 } }),
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

describe("sources", () => {
  const feat = {
    id: "f1",
    kind: "feat",
    name: "Sentinela",
    description: "",
    effects: [],
    trackers: [],
    category: "general",
  };
  const trait = {
    id: "t1",
    kind: "trait",
    name: "Fúria",
    description: "Enquanto em **Fúria**",
    effects: [],
    trackers: [],
    origin: "class",
    from: "Bárbaro",
  };
  const item = {
    id: "i1",
    kind: "item",
    name: "Anel de Proteção",
    description: "",
    category: "other",
    quantity: 1,
    weight: 0,
    price: "",
    equipped: true,
    requiresAttunement: true,
    attuned: true,
    armorType: "light",
    armorBase: 10,
    shieldBonus: 2,
    effects: [],
    trackers: [],
  };
  const spell = {
    id: "s1",
    kind: "spell",
    name: "Sono",
    description: "",
    level: 1,
    school: "enchantment",
    spellClass: "Mago",
    castingTime: "1 ação",
    range: "27 m",
    duration: "1 minuto",
    verbal: true,
    somatic: true,
    material: true,
    materialText: "um punhado de areia",
    concentration: true,
    ritual: false,
    prepared: true,
    active: false,
    effects: [],
    trackers: [],
  };

  function withSources(sources: unknown[]) {
    return firstError({ ...valid, sources });
  }

  it("aceita uma fonte de cada tipo", () => {
    expect(withSources([feat, trait, item, spell])).toBeNull();
  });

  it("recusa tipo desconhecido e campos fora do tipo", () => {
    expect(withSources([{ ...feat, kind: "potion" }])).not.toBeNull();
    expect(withSources([{ ...feat, origin: "class" }])?.code).toBe(
      "unrecognized_keys",
    );
  });

  it("exige nome de 1 a 100 caracteres e descrição até 5000", () => {
    expect(withSources([{ ...feat, name: "  " }])?.message).toBe(
      "O nome é obrigatório",
    );
    expect(withSources([{ ...feat, name: "x".repeat(101) }])).not.toBeNull();
    expect(
      withSources([{ ...feat, description: "x".repeat(5000) }]),
    ).toBeNull();
    expect(
      withSources([{ ...feat, description: "x".repeat(5001) }])?.message,
    ).toBe("Use no máximo 5000 caracteres");
  });

  it("limita quantidade, peso e preço dos itens", () => {
    for (const quantity of [-1, 10000, 1.5]) {
      expect(withSources([{ ...item, quantity }])).not.toBeNull();
    }
    for (const weight of [0, 0.25, 3.5, 9999]) {
      expect(withSources([{ ...item, weight }])).toBeNull();
    }
    for (const weight of [-1, 0.125, 10000]) {
      expect(withSources([{ ...item, weight }])?.message).toBe(
        "Use um número de 0 a 9999, com até duas casas decimais",
      );
    }
    expect(withSources([{ ...item, price: "x".repeat(51) }])).not.toBeNull();
  });

  it("limita a CA base de armadura e o bônus de escudo", () => {
    expect(
      withSources([{ ...item, armorBase: 30, shieldBonus: 10 }]),
    ).toBeNull();
    expect(withSources([{ ...item, armorBase: 31 }])).not.toBeNull();
    expect(withSources([{ ...item, shieldBonus: 11 }])).not.toBeNull();
    expect(withSources([{ ...item, armorType: "mithral" }])).not.toBeNull();
  });

  it("limita o círculo das magias de 0 a 9", () => {
    expect(withSources([{ ...spell, level: 0, prepared: false }])).toBeNull();
    expect(withSources([{ ...spell, level: 9 }])).toBeNull();
    expect(withSources([{ ...spell, level: 10 }])).not.toBeNull();
  });

  it("recusa ids repetidos", () => {
    expect(withSources([feat, { ...trait, id: "f1" }])?.message).toBe(
      "Id de fonte repetido",
    );
  });

  it("só sintoniza itens que requerem sintonização", () => {
    expect(
      withSources([{ ...item, requiresAttunement: false, attuned: true }])
        ?.message,
    ).toBe("Só itens que requerem sintonização podem ser sintonizados");
    expect(
      withSources([{ ...item, requiresAttunement: false, attuned: false }]),
    ).toBeNull();
  });

  it("não aceita truque preparado", () => {
    expect(withSources([{ ...spell, level: 0, prepared: true }])?.message).toBe(
      "Truques não são preparados",
    );
  });

  it("aceita até 300 fontes", () => {
    const many = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ ...feat, id: `f${i}` }));
    expect(withSources(many(300))).toBeNull();
    expect(withSources(many(301))?.message).toBe("Use no máximo 300 fontes");
  });
});
