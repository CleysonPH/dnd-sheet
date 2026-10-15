import { describe, expect, it } from "vitest";

import {
  attunedCount,
  createSource,
  isItemActive,
  alwaysPreparedCount,
  preparedCount,
  spellsByLevel,
  totalWeight,
} from "./rules";
import { sourcesSchema, type Item, type Spell } from "./schema";

function item(name: string, patch: Partial<Item> = {}): Item {
  return { ...createSource("item", name, name), ...patch };
}

function spell(name: string, patch: Partial<Spell> = {}): Spell {
  return { ...createSource("spell", name, name), ...patch };
}

const axe = item("Machado Grande", {
  category: "weapon",
  weight: 3.5,
  equipped: true,
});
const javelins = item("Azagaia", {
  category: "weapon",
  weight: 1,
  quantity: 4,
});

describe("isItemActive", () => {
  it("item equipado sem sintonização é ativo", () => {
    expect(isItemActive(axe)).toBe(true);
    expect(isItemActive({ ...axe, equipped: false })).toBe(false);
  });

  it("item que requer sintonização só é ativo equipado e sintonizado", () => {
    const ring = item("Anel de Proteção", {
      equipped: true,
      requiresAttunement: true,
    });
    expect(isItemActive(ring)).toBe(false);
    expect(isItemActive({ ...ring, attuned: true })).toBe(true);
    expect(isItemActive({ ...ring, attuned: true, equipped: false })).toBe(
      false,
    );
  });
});

describe("totalWeight", () => {
  it("1 Machado Grande de 3,5 kg e 4 Azagaias de 1 kg somam 7,5 kg", () => {
    expect(totalWeight([axe, javelins])).toBe(7.5);
  });

  it("quantidade 0 não pesa", () => {
    expect(totalWeight([axe, { ...javelins, quantity: 0 }])).toBe(3.5);
  });

  it("não acumula erro de ponto flutuante", () => {
    const coins = item("Moeda", { weight: 0.01, quantity: 30 });
    const rope = item("Corda", { weight: 0.1, quantity: 3 });
    expect(totalWeight([coins, rope])).toBe(0.6);
  });

  it("ignora fontes que não são itens", () => {
    expect(totalWeight([createSource("feat", "Sentinela", "f"), axe])).toBe(
      3.5,
    );
  });
});

describe("attunedCount", () => {
  it("conta os itens sintonizados", () => {
    const attuned = (name: string) =>
      item(name, { requiresAttunement: true, attuned: true });
    const sources = ["a", "b", "c", "d"].map(attuned);
    expect(attunedCount(sources)).toBe(4);
    expect(attunedCount([axe, ...sources.slice(0, 3)])).toBe(3);
  });
});

describe("magias", () => {
  const mageHand = spell("Mãos Mágicas", { level: 0 });
  const sleep = spell("Sono", { level: 1, preparation: "prepared" });
  const charm = spell("Enfeitiçar Pessoa", { level: 1 });

  it("agrupa por círculo e ordena por nome", () => {
    expect(
      spellsByLevel([sleep, mageHand, charm]).map((group) => [
        group.level,
        group.spells.map((s) => s.name),
      ]),
    ).toEqual([
      [0, ["Mãos Mágicas"]],
      [1, ["Enfeitiçar Pessoa", "Sono"]],
    ]);
  });

  it("conta só as preparadas de 1º círculo ou acima", () => {
    expect(preparedCount([mageHand, sleep, charm])).toBe(1);
  });

  it("conta as sempre preparadas à parte", () => {
    const mistyStep = spell("Passo Nebuloso", {
      level: 2,
      preparation: "always",
    });
    const bless = spell("Bênção", { level: 1, preparation: "always" });
    const elara = [mageHand, sleep, charm, mistyStep, bless];
    expect(preparedCount(elara)).toBe(1);
    expect(alwaysPreparedCount(elara)).toBe(2);
  });
});

describe("createSource", () => {
  it("cria fontes válidas de cada tipo", () => {
    const sources = (["feat", "trait", "item", "spell"] as const).map(
      (kind, i) => createSource(kind, ` Nova ${kind} `, String(i)),
    );
    expect(sourcesSchema.safeParse(sources).success).toBe(true);
    expect(sources[0]!.name).toBe("Nova feat");
  });

  it("magia nova não está preparada", () => {
    expect(createSource("spell", "Sono", "s1").preparation).toBe("none");
  });
});
