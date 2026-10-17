import { describe, expect, it } from "vitest";

import { createEffect } from "@/engine/effects/schema";
import {
  createSheetDocument,
  type SheetDocument,
} from "@/engine/sheet/document";
import { createSource } from "@/engine/sources/rules";
import type { Feat, Item, Source, Spell, Trait } from "@/engine/sources/schema";
import { deriveStats } from "@/engine/stats/derive";

import {
  actionContext,
  deriveActionLine,
  deriveAttackList,
  deriveSourceActions,
  levelMultiplier,
  type ActionLine,
} from "./derive";
import { createAction, createPart, type Action, type Part } from "./schema";

function sheet(
  name: string,
  level: number,
  abilities: Partial<SheetDocument["abilities"]>,
  patch: Partial<SheetDocument> = {},
): SheetDocument {
  const doc = createSheetDocument(name);
  return {
    ...doc,
    identity: { ...doc.identity, level },
    abilities: { ...doc.abilities, ...abilities },
    ...patch,
  };
}

function withWeapons(
  doc: SheetDocument,
  weapons: Partial<SheetDocument["proficiencies"]["weapons"]>,
): SheetDocument {
  return {
    ...doc,
    proficiencies: {
      ...doc.proficiencies,
      weapons: { ...doc.proficiencies.weapons, ...weapons },
    },
  };
}

function action(patch: Partial<Action>, ...parts: Partial<Part>[]): Action {
  return {
    ...createAction({ kind: "feat" }, "a1"),
    ...patch,
    parts: parts.map((part, i) => createPart(`p${i}`, part)),
  };
}

function weapon(
  name: string,
  patch: Partial<Item>,
  ...actions: Action[]
): Item {
  return {
    ...createSource("item", name, name),
    category: "weapon",
    equipped: true,
    ...patch,
    actions,
  };
}

function spell(name: string, patch: Partial<Spell>, ...actions: Action[]) {
  return { ...createSource("spell", name, name), ...patch, actions } as Spell;
}

/** Linhas da fonte na ficha, com a fonte incluída nas fontes da ficha. */
function lines(doc: SheetDocument, source: Source): ActionLine[] {
  const full = { ...doc, sources: [...doc.sources, source] };
  return deriveSourceActions(source, actionContext(full, deriveStats(full)));
}

function line(doc: SheetDocument, source: Source): ActionLine {
  const [first] = lines(doc, source);
  if (!first) throw new Error("sem linha");
  return first;
}

const dice = (l: ActionLine) =>
  l.parts.map(({ count, die, modifier, type, upcast }) => ({
    count,
    die,
    modifier,
    type,
    upcast,
  }));

/** Thorin: nível 5 (PB +3), FOR 16, DES 12, proficiente com marciais. */
const thorin = withWeapons(sheet("Thorin", 5, { str: 16, dex: 12 }), {
  simple: true,
  martial: true,
});

/** Ária: barda nível 5, FOR 8, DES 14, CAR 18, conjuração CAR, só simples. */
const aria = withWeapons(
  sheet(
    "Ária",
    5,
    { str: 8, dex: 14, cha: 18 },
    { spellcastingAbility: "cha" },
  ),
  { simple: true },
);

/** Elara: maga, INT 16, conjuração Inteligência. */
const elara = (level: number, patch: Partial<SheetDocument> = {}) =>
  sheet("Elara", level, { int: 16 }, { spellcastingAbility: "int", ...patch });

const battleaxe = weapon(
  "Machado de Batalha",
  { weaponCategory: "martial" },
  action(
    { id: "one", name: "Uma mão" },
    { die: "d8", ability: "attack", type: "slashing" },
  ),
  action(
    { id: "two", name: "Duas mãos" },
    { die: "d10", ability: "attack", type: "slashing" },
  ),
);

const rapier = weapon(
  "Rapieira",
  { weaponCategory: "martial" },
  action(
    { attackAbility: "finesse" },
    { die: "d8", ability: "attack", type: "piercing" },
  ),
);

const fireBolt = spell(
  "Raio de Fogo",
  {},
  action(
    { range: "ranged", attackAbility: "spellcasting" },
    { die: "d10", type: "fire", scaleByLevel: true },
  ),
);

describe("levelMultiplier", () => {
  it("1, 2, 3 e 4 nos níveis 1, 5, 11 e 17", () => {
    expect([1, 4, 5, 10, 11, 16, 17, 20].map(levelMultiplier)).toEqual([
      1, 1, 2, 2, 3, 3, 4, 4,
    ]);
  });
});

describe("acerto e dano de armas", () => {
  it("Machado de Batalha de Thorin: +6 com 1d8+3 e 1d10+3", () => {
    const [one, two] = lines(thorin, battleaxe);
    expect(one?.toHit?.value).toBe(6);
    expect(one && dice(one)).toEqual([
      { count: 1, die: "d8", modifier: 3, type: "slashing", upcast: 0 },
    ]);
    expect(two?.toHit?.value).toBe(6);
    expect(two?.parts[0]).toMatchObject({ die: "d10", modifier: 3 });
    expect(one?.toHit?.parts.map((p) => p.label)).toEqual([
      "Modificador de FOR",
      "Proficiência",
    ]);
  });

  it("Exaustão 1 tira 2 do acerto, com a parcela, e não do dano", () => {
    const one = line({ ...thorin, exhaustion: 1 }, battleaxe);
    expect(one.toHit?.value).toBe(4);
    expect(one.toHit?.parts).toContainEqual({
      label: "Exaustão 1",
      amount: -2,
      kind: "add",
    });
    expect(one.parts[0]?.modifier).toBe(3);
  });

  it("Espada Longa +1: +7 e 1d8+4, com a parcela do bônus", () => {
    const longsword = weapon(
      "Espada Longa +1",
      { weaponCategory: "martial" },
      action(
        { attackBonus: "1" },
        { die: "d8", ability: "attack", bonus: "1", type: "slashing" },
      ),
    );
    const l = line(thorin, longsword);
    expect(l.toHit?.value).toBe(7);
    expect(l.toHit?.parts).toContainEqual({
      label: "Bônus da ação",
      amount: 1,
      kind: "add",
    });
    expect(l.parts[0]?.modifier).toBe(4);
  });

  it("Rapieira de Ária: +2 sem proficiência e 1d8+2 por acuidade", () => {
    const l = line(aria, rapier);
    expect(l.toHit?.value).toBe(2);
    expect(l.toHit?.parts.map((p) => p.label)).toEqual(["Acuidade (DES)"]);
    expect(l.parts[0]?.modifier).toBe(2);
  });

  it("proficiência pelo nome da arma, sem diferenciar maiúsculas", () => {
    expect(
      line(withWeapons(aria, { other: ["rapieira"] }), rapier).toHit?.value,
    ).toBe(5);
  });

  it("proficiência concedida por um talento ativo", () => {
    const training: Feat = {
      ...createSource("feat", "Treinamento Marcial", "f1"),
      effects: [
        {
          ...createEffect("e1"),
          target: "proficiency.weapon",
          op: "grant",
          value: "martial",
        },
      ],
    };
    expect(line({ ...aria, sources: [training] }, rapier).toHit?.value).toBe(5);
  });

  it("nunca proficiente ignora a categoria", () => {
    const never = weapon(
      "Machado de Batalha",
      { weaponCategory: "martial" },
      action({ proficiency: "never" }, { ability: "attack" }),
    );
    expect(line(thorin, never).toHit?.value).toBe(3);
  });

  it("acuidade escolhe a Força quando ela é maior", () => {
    const dagger = weapon(
      "Adaga",
      { weaponCategory: "simple" },
      action({ attackAbility: "finesse" }, { die: "d4", ability: "attack" }),
    );
    const l = line(thorin, dagger);
    expect(l.toHit?.value).toBe(6);
    expect(l.toHit?.parts[0]?.label).toBe("Acuidade (FOR)");
  });

  it("Clava com FOR 8: 1d4-1; Ataque Desarmado sem dados: 4", () => {
    const club = weapon(
      "Clava",
      {},
      action({}, { die: "d4", ability: "str", type: "bludgeoning" }),
    );
    expect(line(aria, club).parts[0]?.modifier).toBe(-1);
    const unarmed: Trait = {
      ...createSource("trait", "Ataque Desarmado", "t1"),
      actions: [action({}, { count: 0, ability: "str", bonus: "1" })],
    };
    expect(line(thorin, unarmed).parts[0]).toMatchObject({
      count: 0,
      modifier: 4,
    });
  });
});

describe("ações de conjuração", () => {
  it("Raio de Fogo de Elara no nível 3: +5 e 1d10", () => {
    const l = line(elara(3), fireBolt);
    expect(l.toHit?.value).toBe(5);
    expect(l.parts[0]).toMatchObject({ count: 1, die: "d10", modifier: 0 });
  });

  it("usa o valor manual do ataque mágico", () => {
    const l = line(elara(3, { overrides: { spellAttack: 8 } }), fireBolt);
    expect(l.toHit?.value).toBe(8);
  });

  it("soma os efeitos de ataque mágico", () => {
    const wand: Item = {
      ...createSource("item", "Varinha", "w1"),
      equipped: true,
      effects: [
        {
          ...createEffect("e1"),
          target: "spellAttack",
          op: "add",
          expression: "1",
        },
      ],
    };
    expect(line(elara(3, { sources: [wand] }), fireBolt).toHit?.value).toBe(6);
  });

  it("conta a Exaustão uma vez só", () => {
    expect(line(elara(3, { exhaustion: 1 }), fireBolt).toHit?.value).toBe(3);
  });

  it("magia com atributo próprio INT 12 numa ficha de CAR: +4", () => {
    const own = { ...fireBolt, castingAbility: "int" as const };
    const doc = { ...aria, abilities: { ...aria.abilities, int: 12 } };
    expect(line(doc, own).toHit?.value).toBe(4);
  });

  it("o truque escala no nível 5 e no 11", () => {
    expect(line(elara(4), fireBolt).parts[0]?.count).toBe(1);
    expect(line(elara(5), fireBolt).parts[0]?.count).toBe(2);
    expect(line(elara(11), fireBolt).parts[0]?.count).toBe(3);
  });

  it("Rajada Mística: 2 ataques no nível 5 e 1 no nível 1", () => {
    const blast = spell(
      "Rajada Mística",
      {},
      action(
        { attackAbility: "spellcasting", scaleAttacks: true },
        { die: "d10", type: "force" },
      ),
    );
    const l = line(aria, blast);
    expect(l.attacks).toBe(2);
    expect(l.toHit?.value).toBe(7);
    expect(l.parts[0]?.count).toBe(1);
    expect(
      line({ ...aria, identity: { ...aria.identity, level: 1 } }, blast)
        .attacks,
    ).toBe(1);
  });
});

describe("salvaguardas e ações automáticas", () => {
  it("Zombaria Viciosa: SAB CD 15 e 2d6 psíquico", () => {
    const mockery = spell(
      "Zombaria Viciosa",
      {},
      action(
        { resolution: "save", saveAbility: "wis" },
        { die: "d6", type: "psychic", scaleByLevel: true },
      ),
    );
    const l = line(aria, mockery);
    expect(l.toHit).toBeNull();
    expect(l.dc?.value).toBe(15);
    expect(l.saveAbility).toBe("wis");
    expect(l.onSuccess).toBe("none");
    expect(l.parts[0]).toMatchObject({ count: 2, die: "d6" });
  });

  it("Bola de Fogo: DES CD 14, metade no sucesso e +1d6 por círculo", () => {
    const fireball = spell(
      "Bola de Fogo",
      { level: 3, preparation: "prepared" },
      action(
        { resolution: "save", saveAbility: "dex", onSuccess: "half" },
        { count: 8, die: "d6", type: "fire", upcast: 1 },
      ),
    );
    const l = line(elara(5), fireball);
    expect(l.dc?.value).toBe(14);
    expect(l.onSuccess).toBe("half");
    expect(l.parts[0]).toMatchObject({ count: 8, upcast: 1 });
  });

  it("ajuste soma na CD de magia", () => {
    const adjusted = spell(
      "Teste",
      {},
      action({ resolution: "save", dcAdjust: 2 }, {}),
    );
    expect(line(elara(5), adjusted).dc?.value).toBe(16);
  });

  it("Sopro de Kriv: CD por expressão 14 e 3d10 no nível 11", () => {
    const breath: Trait = {
      ...createSource("trait", "Sopro de Dragão", "t1"),
      actions: [
        action(
          {
            resolution: "save",
            dcMode: "expression",
            dcExpression: "8 + con.mod + pb",
            onSuccess: "half",
          },
          { die: "d10", type: "fire", scaleByLevel: true },
        ),
      ],
    };
    const l = line(sheet("Kriv", 11, { con: 14 }), breath);
    expect(l.dc?.value).toBe(14);
    expect(l.parts[0]).toMatchObject({ count: 3, die: "d10" });
  });

  it("Palavra Curativa: 2d4+4 cura, sem acerto nem CD", () => {
    const healingWord = spell(
      "Palavra Curativa",
      { level: 1, preparation: "prepared" },
      action(
        { resolution: "auto" },
        {
          count: 2,
          die: "d4",
          ability: "spellcasting",
          type: "healing",
          upcast: 2,
        },
      ),
    );
    const l = line(aria, healingWord);
    expect(l.toHit).toBeNull();
    expect(l.dc).toBeNull();
    expect(dice(l)).toEqual([
      { count: 2, die: "d4", modifier: 4, type: "healing", upcast: 2 },
    ]);
  });

  it("o atributo do ataque vale como nenhum fora de uma ação de ataque", () => {
    const auto = spell(
      "Teste",
      {},
      action(
        { resolution: "auto", attackAbility: "cha" },
        { ability: "attack" },
      ),
    );
    expect(line(aria, auto).parts[0]?.modifier).toBe(0);
  });

  it("ignora os dados por círculo em truques e em talentos", () => {
    const part = { count: 1, die: "d6" as const, upcast: 3 };
    const cantrip = spell("Truque", {}, action({}, part));
    const feat: Feat = {
      ...createSource("feat", "Talento", "f1"),
      actions: [action({}, part)],
    };
    expect(line(aria, cantrip).parts[0]?.upcast).toBe(0);
    expect(line(aria, feat).parts[0]?.upcast).toBe(0);
  });

  it("deriveActionLine leva o nome da fonte e da ação", () => {
    const doc = { ...thorin, sources: [battleaxe] };
    const [first] = battleaxe.actions;
    if (!first) throw new Error("sem ação");
    const l = deriveActionLine(
      first,
      battleaxe,
      actionContext(doc, deriveStats(doc)),
    );
    expect(l).toMatchObject({
      sourceName: "Machado de Batalha",
      name: "Uma mão",
      range: "melee",
      attacks: 1,
    });
  });
});

describe("deriveAttackList", () => {
  const strike = (name: string) => action({ name }, {});
  const inspiration: Trait = {
    ...createSource("trait", "Inspiração de Bardo", "t1"),
    actions: [strike("Inspirar")],
  };
  const healingWord = spell(
    "Palavra Curativa",
    { level: 1, preparation: "prepared" },
    action({ resolution: "auto" }, { type: "healing" }),
  );
  const mockery = spell(
    "Zombaria Viciosa",
    {},
    action({ resolution: "save" }, { type: "psychic" }),
  );

  function names(sources: Source[]): string[] {
    const doc = { ...aria, sources };
    return deriveAttackList(doc, deriveStats(doc)).map((l) => l.sourceName);
  }

  it("ordem: itens, talentos e traços, magias por círculo", () => {
    expect(names([healingWord, mockery, inspiration, rapier])).toEqual([
      "Rapieira",
      "Inspiração de Bardo",
      "Zombaria Viciosa",
      "Palavra Curativa",
    ]);
  });

  it("item desequipado fica fora; equipado sem sintonização entra", () => {
    expect(names([{ ...rapier, equipped: false }])).toEqual([]);
    expect(names([{ ...rapier, requiresAttunement: true }])).toEqual([
      "Rapieira",
    ]);
  });

  it("magia não preparada fora; sempre preparada e truque dentro", () => {
    expect(names([{ ...healingWord, preparation: "none" }])).toEqual([]);
    expect(names([{ ...healingWord, preparation: "always" }])).toEqual([
      "Palavra Curativa",
    ]);
    expect(names([mockery])).toEqual(["Zombaria Viciosa"]);
  });

  it("fonte sem ações não gera linha; uma linha por ação", () => {
    const plain = createSource("feat", "Robusto", "f2");
    expect(names([plain])).toEqual([]);
    expect(names([{ ...battleaxe }])).toEqual([
      "Machado de Batalha",
      "Machado de Batalha",
    ]);
  });
});
