import { describe, expect, it } from "vitest";

import { createEffect, type Effect } from "@/engine/effects/schema";
import type { GrantTarget } from "@/engine/effects/targets";
import {
  createSheetDocument,
  type SheetDocument,
} from "@/engine/sheet/document";
import { createSource } from "@/engine/sources/rules";
import type { Item, Source } from "@/engine/sources/schema";

import { deriveTraits, untrainedArmor } from "./derive";

let nextId = 0;
const id = () => `id${nextId++}`;

function grant(target: GrantTarget, value: string): Effect {
  return {
    ...createEffect(id()),
    target,
    op: "grant",
    expression: "",
    value,
  };
}

function feat(name: string, effects: Effect[]): Source {
  return { ...createSource("feat", name, id()), effects };
}

function item(name: string, patch: Partial<Item>, effects: Effect[] = []) {
  return {
    ...createSource("item", name, id()),
    equipped: true,
    ...patch,
    effects,
  } satisfies Item;
}

function sheet(patch: Partial<SheetDocument>): SheetDocument {
  return { ...createSheetDocument("Teste"), ...patch };
}

const thorinProficiencies = {
  ...createSheetDocument("Thorin").proficiencies,
  armor: { light: true, medium: true, heavy: false, shield: false },
};

describe("deriveTraits", () => {
  it("talento que concede armadura pesada soma à ficha, com a origem", () => {
    const talent = feat("Treinamento com Armadura Pesada", [
      grant("proficiency.armor", "heavy"),
    ]);
    const traits = deriveTraits(
      sheet({ proficiencies: thorinProficiencies, sources: [talent] }),
    );
    expect(traits.armor.map((entry) => entry.key)).toEqual([
      "light",
      "medium",
      "heavy",
    ]);
    expect(traits.armor[2]).toMatchObject({
      closed: true,
      fromSheet: false,
      sources: [{ id: talent.id, name: "Treinamento com Armadura Pesada" }],
    });
    expect(traits.armor[0]).toMatchObject({ fromSheet: true, sources: [] });
  });

  it("anel desequipado deixa de conceder; a marca da ficha continua", () => {
    const ring = item("Anel de Resistência ao Fogo", { category: "gear" }, [
      grant("defense.resistance", "fire"),
    ]);
    expect(deriveTraits(sheet({ sources: [ring] })).resistances).toHaveLength(
      1,
    );

    const unequipped = { ...ring, equipped: false };
    expect(deriveTraits(sheet({ sources: [unequipped] })).resistances).toEqual(
      [],
    );

    const marked = deriveTraits(
      sheet({
        sources: [unequipped],
        defenses: {
          ...createSheetDocument("x").defenses,
          resistances: ["fire"],
        },
      }),
    );
    expect(marked.resistances).toEqual([
      {
        key: "fire",
        label: "fire",
        closed: true,
        fromSheet: true,
        sources: [],
      },
    ]);
  });

  it("idioma igual na ficha e numa fonte vira um item com as duas origens", () => {
    const dwarf = feat("Anão", [grant("language", "anão")]);
    const traits = deriveTraits(
      sheet({
        proficiencies: { ...thorinProficiencies, languages: ["Anão", "Comum"] },
        sources: [dwarf],
      }),
    );
    expect(traits.languages).toEqual([
      {
        key: "tag:anão",
        label: "Anão",
        closed: false,
        fromSheet: true,
        sources: [{ id: dwarf.id, name: "Anão" }],
      },
      {
        key: "tag:comum",
        label: "Comum",
        closed: false,
        fromSheet: true,
        sources: [],
      },
    ]);
  });

  it("armas: categorias fechadas primeiro, depois as específicas", () => {
    const elf = feat("Treino Élfico", [
      grant("proficiency.weapon", "Espada longa"),
      grant("proficiency.weapon", "simple"),
    ]);
    const traits = deriveTraits(
      sheet({
        proficiencies: {
          ...thorinProficiencies,
          weapons: { simple: false, martial: true, other: ["Arco longo"] },
        },
        sources: [elf],
      }),
    );
    expect(traits.weapons.map((entry) => entry.label)).toEqual([
      "simple",
      "martial",
      "Arco longo",
      "Espada longa",
    ]);
  });

  it("efeitos de outras operações não entram nas listas", () => {
    const ring = feat("Anel de Proteção", [createEffect(id())]);
    const traits = deriveTraits(sheet({ sources: [ring] }));
    expect(Object.values(traits).every((list) => list.length === 0)).toBe(true);
  });
});

describe("untrainedArmor", () => {
  const chainMail = () =>
    item("Cota de Malha", {
      category: "armor",
      armorType: "heavy",
      armorBase: 16,
    });

  it("Elara de cota de malha, sem treinamento, gera o aviso", () => {
    const mail = chainMail();
    const document = sheet({ sources: [mail] });
    expect(untrainedArmor(document, deriveTraits(document))).toEqual([
      { item: mail, training: "heavy" },
    ]);
  });

  it("com Pesada concedida não há aviso", () => {
    const document = sheet({
      sources: [
        chainMail(),
        feat("Treinamento", [grant("proficiency.armor", "heavy")]),
      ],
    });
    expect(untrainedArmor(document, deriveTraits(document))).toEqual([]);
  });

  it("escudo ativo sem treinamento com escudo gera o aviso", () => {
    const shield = item("Escudo", { category: "shield", shieldBonus: 2 });
    const document = sheet({
      proficiencies: thorinProficiencies,
      sources: [shield],
    });
    expect(untrainedArmor(document, deriveTraits(document))).toEqual([
      { item: shield, training: "shield" },
    ]);
  });

  it("armadura desequipada não gera aviso", () => {
    const document = sheet({ sources: [{ ...chainMail(), equipped: false }] });
    expect(untrainedArmor(document, deriveTraits(document))).toEqual([]);
  });
});
