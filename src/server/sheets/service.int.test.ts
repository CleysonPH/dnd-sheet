import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { createSheetDocument } from "@/engine/sheet/document";
import { createEffect } from "@/engine/effects/schema";
import { createTracker } from "@/engine/resources/schema";
import { createSource } from "@/engine/sources/rules";
import { getDb } from "@/server/db";
import { sheet } from "@/server/db/schema";
import { createTestUser, resetDatabase, signIn } from "@/server/test/helpers";

import {
  createSheet,
  deleteSheet,
  getSheet,
  listSheets,
  saveSheet,
} from "./service";

async function setup() {
  await createTestUser({ email: "lyra@mesa.com" });
  await createTestUser({ email: "grog@mesa.com" });
  await createTestUser({ email: "mestre@mesa.com", role: "admin" });
  return {
    lyra: await signIn("lyra@mesa.com"),
    grog: await signIn("grog@mesa.com"),
    mestre: await signIn("mestre@mesa.com"),
  };
}

async function newSheet(headers: Headers, name: string) {
  const result = await createSheet(headers, { name });
  if (!result.ok) throw new Error("falha ao criar ficha de teste");
  return result.id;
}

function edited(name: string, patch: Record<string, unknown> = {}) {
  const document = createSheetDocument(name);
  return { ...document, identity: { ...document.identity, ...patch } };
}

async function stored(id: string) {
  const [row] = await getDb().select().from(sheet).where(eq(sheet.id, id));
  return row;
}

describe("fichas", () => {
  beforeEach(resetDatabase);

  describe("criar e listar", () => {
    it("cria no nível 1 e abre com o documento inicial", async () => {
      const { lyra } = await setup();

      const result = await createSheet(lyra, { name: " Thorin " });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const loaded = await getSheet(lyra, result.id);
      expect(loaded).toEqual({
        id: result.id,
        version: 1,
        document: createSheetDocument("Thorin"),
      });
    });

    it("recusa nome em branco", async () => {
      const { lyra } = await setup();
      expect(await createSheet(lyra, { name: "   " })).toEqual({
        ok: false,
        fieldErrors: { name: "O nome é obrigatório" },
      });
      expect(await listSheets(lyra)).toEqual([]);
    });

    it("lista só as fichas do dono, da alteração mais recente para a mais antiga", async () => {
      const { lyra, grog } = await setup();
      const thorin = await newSheet(lyra, "Thorin");
      await newSheet(lyra, "Grog");
      await newSheet(grog, "Ficha do Grog");
      await saveSheet(lyra, thorin, {
        baseVersion: 1,
        document: edited("Thorin", { class: "Bárbaro", level: 5 }),
      });

      const sheets = await listSheets(lyra);

      expect(sheets.map((s) => s.name)).toEqual(["Thorin", "Grog"]);
      expect(sheets[0]).toMatchObject({
        id: thorin,
        species: "",
        class: "Bárbaro",
        level: 5,
      });
      expect(sheets[0]?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("restritas ao dono", () => {
    it("outro usuário e admin não abrem a ficha", async () => {
      const { lyra, grog, mestre } = await setup();
      const id = await newSheet(lyra, "Thorin");

      expect(await getSheet(grog, id)).toBeNull();
      expect(await getSheet(mestre, id)).toBeNull();
      expect(await listSheets(mestre)).toEqual([]);
    });

    it("ficha inexistente devolve null", async () => {
      const { lyra } = await setup();
      expect(await getSheet(lyra, "nao-existe")).toBeNull();
    });

    it("outro usuário não salva nem exclui", async () => {
      const { lyra, mestre } = await setup();
      const id = await newSheet(lyra, "Thorin");

      expect(
        await saveSheet(mestre, id, {
          baseVersion: 1,
          document: edited("Hackeado"),
        }),
      ).toEqual({ status: "not_found" });
      expect(await deleteSheet(mestre, id, { confirmName: "Thorin" })).toEqual({
        status: "not_found",
      });
      expect(await stored(id)).toMatchObject({ name: "Thorin", version: 1 });
    });

    it("exige sessão sem troca de senha pendente", async () => {
      await createTestUser({
        email: "nova@mesa.com",
        mustChangePassword: true,
      });
      const nova = await signIn("nova@mesa.com");
      await expect(listSheets(nova)).rejects.toMatchObject({
        code: "PASSWORD_CHANGE_REQUIRED",
      });
      await expect(listSheets(new Headers())).rejects.toMatchObject({
        code: "UNAUTHENTICATED",
      });
    });
  });

  describe("salvar", () => {
    it("grava, incrementa a versão e copia o nome para a coluna", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");

      const result = await saveSheet(lyra, id, {
        baseVersion: 1,
        document: edited("Thorin Escudo", { species: "Anão" }),
      });

      expect(result).toEqual({ status: "saved", version: 2 });
      const loaded = await getSheet(lyra, id);
      expect(loaded?.version).toBe(2);
      expect(loaded?.document.identity).toMatchObject({
        name: "Thorin Escudo",
        species: "Anão",
      });
      expect((await stored(id))?.name).toBe("Thorin Escudo");
    });

    it("recusa salvar a partir de uma versão antiga, sem alterar a ficha", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");
      // Celular salva primeiro.
      await saveSheet(lyra, id, {
        baseVersion: 1,
        document: edited("Thorin", { level: 3 }),
      });

      // Computador ainda está na versão 1.
      const result = await saveSheet(lyra, id, {
        baseVersion: 1,
        document: edited("Thorin", { class: "Mago" }),
      });

      expect(result).toEqual({ status: "conflict" });
      const loaded = await getSheet(lyra, id);
      expect(loaded?.version).toBe(2);
      expect(loaded?.document.identity).toMatchObject({ level: 3, class: "" });
    });

    it("ficha inexistente devolve not_found", async () => {
      const { lyra } = await setup();
      expect(
        await saveSheet(lyra, "nao-existe", {
          baseVersion: 1,
          document: edited("X"),
        }),
      ).toEqual({ status: "not_found" });
    });

    it("recusa conteúdo fora do formato sem alterar a ficha", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");
      const invalid = { status: "invalid", reason: "schema" };

      expect(
        await saveSheet(lyra, id, {
          baseVersion: 1,
          document: edited("Thorin", { level: "vinte" }),
        }),
      ).toEqual(invalid);
      expect(
        await saveSheet(lyra, id, {
          baseVersion: 1,
          document: { ...edited("Thorin"), hackeado: true },
        }),
      ).toEqual(invalid);
      expect(
        await saveSheet(lyra, id, { baseVersion: 1.5, document: edited("T") }),
      ).toEqual(invalid);
      expect(await stored(id)).toMatchObject({ name: "Thorin", version: 1 });
    });

    it("grava os números da ficha e os valores manuais", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");
      const document = {
        ...edited("Thorin", { level: 5 }),
        abilities: { str: 16, dex: 14, con: 16, int: 8, wis: 12, cha: 10 },
        hitPoints: {
          hitDie: 12 as const,
          damage: 15,
          temp: 5,
          hitDiceSpent: 2,
        },
        overrides: { hitPointsMax: 61, "skill.perception": 6 },
      };

      expect(await saveSheet(lyra, id, { baseVersion: 1, document })).toEqual({
        status: "saved",
        version: 2,
      });
      expect((await getSheet(lyra, id))?.document).toEqual(document);
    });

    it("grava uma fonte de cada tipo", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");
      const sources = [
        createSource("feat", "Sentinela", "f1"),
        { ...createSource("trait", "Fúria", "t1"), from: "Bárbaro" },
        {
          ...createSource("item", "Anel de Proteção", "i1"),
          equipped: true,
          requiresAttunement: true,
          attuned: true,
        },
        {
          ...createSource("spell", "Sono", "s1"),
          level: 1,
          preparation: "prepared",
        },
      ];
      const document = { ...edited("Thorin"), sources };

      expect(await saveSheet(lyra, id, { baseVersion: 1, document })).toEqual({
        status: "saved",
        version: 2,
      });
      expect((await getSheet(lyra, id))?.document.sources).toEqual(sources);
    });

    it("grava o atributo de conjuração e o de uma magia", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Ária");
      const mistyStep = {
        ...createSource("spell", "Passo Nebuloso", "s1"),
        level: 2,
        castingAbility: "int" as const,
      };
      const document = {
        ...edited("Ária"),
        spellcastingAbility: "cha" as const,
        sources: [mistyStep],
      };

      expect(await saveSheet(lyra, id, { baseVersion: 1, document })).toEqual({
        status: "saved",
        version: 2,
      });
      const saved = (await getSheet(lyra, id))?.document;
      expect(saved?.spellcastingAbility).toBe("cha");
      expect(saved?.sources).toEqual([mistyStep]);
    });

    it("grava a inspiração heroica", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");
      const document = { ...edited("Thorin"), heroicInspiration: true };

      expect(await saveSheet(lyra, id, { baseVersion: 1, document })).toEqual({
        status: "saved",
        version: 2,
      });
      expect((await getSheet(lyra, id))?.document.heroicInspiration).toBe(true);
    });

    it("grava uma magia sempre preparada e recusa truque sempre preparado", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Elara");
      const mistyStep = {
        ...createSource("spell", "Passo Nebuloso", "s1"),
        level: 2,
        spellClass: "Tocado pelas Fadas",
        preparation: "always" as const,
      };

      const saved = await saveSheet(lyra, id, {
        baseVersion: 1,
        document: { ...edited("Elara"), sources: [mistyStep] },
      });
      expect(saved).toEqual({ status: "saved", version: 2 });
      expect((await getSheet(lyra, id))?.document.sources).toEqual([mistyStep]);

      expect(
        await saveSheet(lyra, id, {
          baseVersion: 2,
          document: {
            ...edited("Elara"),
            sources: [{ ...mistyStep, level: 0 }],
          },
        }),
      ).toEqual({ status: "invalid", reason: "schema" });
    });

    it("grava fontes com efeitos", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");
      const defense = {
        ...createSource("trait", "Defesa sem Armadura", "t1"),
        effects: [
          {
            ...createEffect("e1"),
            op: "altBase" as const,
            expression: "10 + des.mod + con.mod",
            noArmor: true,
          },
        ],
      };
      const document = { ...edited("Thorin"), sources: [defense] };

      expect(await saveSheet(lyra, id, { baseVersion: 1, document })).toEqual({
        status: "saved",
        version: 2,
      });
      expect((await getSheet(lyra, id))?.document.sources).toEqual([defense]);
    });

    it("recusa efeito com operação incompatível ou expressão inválida", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");
      const withEffect = (effect: Record<string, unknown>) => ({
        ...edited("Thorin"),
        sources: [
          {
            ...createSource("feat", "Robusto", "f1"),
            effects: [{ ...createEffect("e1"), ...effect }],
          },
        ],
      });
      const invalid = { status: "invalid", reason: "schema" };

      expect(
        await saveSheet(lyra, id, {
          baseVersion: 1,
          document: withEffect({ target: "hitPointsMax", op: "set" }),
        }),
      ).toEqual(invalid);
      expect(
        await saveSheet(lyra, id, {
          baseVersion: 1,
          document: withEffect({ expression: "2 * nivel +" }),
        }),
      ).toEqual(invalid);
      expect((await stored(id))?.version).toBe(1);
    });

    it("grava trackers e espaços de magia", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Ária");
      const base = edited("Ária");
      const document = {
        ...base,
        sources: [
          {
            ...createSource("trait", "Inspiração de Bardo", "t1"),
            trackers: [
              {
                ...createTracker("k1"),
                name: "Inspiração",
                max: "max(1, car.mod)",
                used: 1,
              },
            ],
          },
        ],
        spellSlots: base.spellSlots.map((slot, i) =>
          i === 0 ? { max: 4, used: 1 } : slot,
        ),
        pactSlots: { level: 2, max: 2, used: 0 },
      };

      expect(await saveSheet(lyra, id, { baseVersion: 1, document })).toEqual({
        status: "saved",
        version: 2,
      });
      expect((await getSheet(lyra, id))?.document).toEqual(document);
    });

    it("recusa tracker com máximo inválido", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Ária");
      const document = {
        ...edited("Ária"),
        sources: [
          {
            ...createSource("trait", "Inspiração de Bardo", "t1"),
            trackers: [{ ...createTracker("k1"), max: "max(1, carisma)" }],
          },
        ],
      };

      expect(await saveSheet(lyra, id, { baseVersion: 1, document })).toEqual({
        status: "invalid",
        reason: "schema",
      });
      expect((await stored(id))?.version).toBe(1);
    });

    it("recusa item sintonizado que não requer sintonização", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");
      const ring = {
        ...createSource("item", "Anel", "i1"),
        attuned: true,
      };

      const result = await saveSheet(lyra, id, {
        baseVersion: 1,
        document: { ...edited("Thorin"), sources: [ring] },
      });

      expect(result).toEqual({ status: "invalid", reason: "schema" });
      expect((await stored(id))?.version).toBe(1);
    });

    it("recusa valor manual de um valor que não existe", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");

      const result = await saveSheet(lyra, id, {
        baseVersion: 1,
        document: { ...edited("Thorin"), overrides: { attackBonus: 18 } },
      });

      expect(result).toEqual({ status: "invalid", reason: "schema" });
      expect((await stored(id))?.version).toBe(1);
    });

    it("abre uma ficha gravada no formato 1 já no formato atual", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");
      const identity = { ...edited("Thorin", { level: 5 }).identity };
      await getDb()
        .update(sheet)
        .set({ data: { schemaVersion: 1, identity } })
        .where(eq(sheet.id, id));

      expect((await getSheet(lyra, id))?.document).toEqual({
        ...createSheetDocument("Thorin"),
        identity,
      });
    });

    it("recusa documento acima de 256 KB", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");

      const result = await saveSheet(lyra, id, {
        baseVersion: 1,
        document: edited("Thorin", { background: "x".repeat(300 * 1024) }),
      });

      expect(result).toEqual({ status: "invalid", reason: "too_large" });
      expect((await stored(id))?.version).toBe(1);
    });
  });

  describe("excluir", () => {
    it("apaga de vez quando o nome confere", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");

      expect(await deleteSheet(lyra, id, { confirmName: "Thorin" })).toEqual({
        status: "deleted",
      });
      expect(await getSheet(lyra, id)).toBeNull();
      expect(await listSheets(lyra)).toEqual([]);
    });

    it("não apaga com o nome errado", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");

      expect(await deleteSheet(lyra, id, { confirmName: "thor" })).toEqual({
        status: "confirmation_mismatch",
      });
      expect(await getSheet(lyra, id)).not.toBeNull();
    });

    it("salvar depois de excluída devolve not_found", async () => {
      const { lyra } = await setup();
      const id = await newSheet(lyra, "Thorin");
      await deleteSheet(lyra, id, { confirmName: "Thorin" });

      expect(
        await saveSheet(lyra, id, {
          baseVersion: 1,
          document: edited("Thorin", { level: 2 }),
        }),
      ).toEqual({ status: "not_found" });
    });
  });
});
