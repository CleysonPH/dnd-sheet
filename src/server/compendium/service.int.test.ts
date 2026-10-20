import { beforeEach, describe, expect, it } from "vitest";

import { createAction } from "@/engine/attacks/schema";
import { createEffect } from "@/engine/effects/schema";
import { SHEET_SCHEMA_VERSION } from "@/engine/sheet/document";
import { createSource } from "@/engine/sources/rules";
import type { Source } from "@/engine/sources/schema";
import { searchKey } from "@/engine/sources/search";
import { AuthError } from "@/server/auth/guards";
import { getDb } from "@/server/db";
import { compendiumEntry } from "@/server/db/schema";
import { createTestUser, resetDatabase, signIn } from "@/server/test/helpers";

import {
  MAX_COMPENDIUM_ENTRIES,
  createEntry,
  deleteEntry,
  saveEntry,
  searchEntries,
  sendToCompendium,
} from "./service";

async function setup() {
  await createTestUser({ email: "lyra@mesa.com" });
  await createTestUser({ email: "mestre@mesa.com", role: "admin" });
  return {
    lyra: await signIn("lyra@mesa.com"),
    mestre: await signIn("mestre@mesa.com"),
  };
}

async function created(result: Awaited<ReturnType<typeof createEntry>>) {
  if (!result.ok) throw new Error(`falha ao criar: ${result.error}`);
  return result.id;
}

const names = async (headers: Headers, query: string, kinds?: string[]) =>
  (await searchEntries(headers, { query, kinds })).map((e) => e.source.name);

describe("compêndio", () => {
  beforeEach(resetDatabase);

  it("usuário comum busca, mas não cria, salva, exclui nem envia", async () => {
    const { lyra, mestre } = await setup();
    const id = await created(
      await createEntry(mestre, { kind: "feat", name: "Robusto" }),
    );
    const forbidden = { code: "FORBIDDEN" };

    expect(await names(lyra, "robusto")).toEqual(["Robusto"]);
    await expect(
      createEntry(lyra, { kind: "feat", name: "Alerta" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      saveEntry(lyra, id, createSource("feat", "Outro", id)),
    ).rejects.toMatchObject(forbidden);
    await expect(deleteEntry(lyra, id)).rejects.toBeInstanceOf(AuthError);
    await expect(
      sendToCompendium(lyra, createSource("feat", "Alerta", "x")),
    ).rejects.toMatchObject(forbidden);
    expect(await names(mestre, "")).toEqual(["Robusto"]);
  });

  it("admin cria, salva com um efeito e encontra por parte do nome", async () => {
    const { mestre } = await setup();
    const id = await created(
      await createEntry(mestre, { kind: "feat", name: "Robusto" }),
    );
    const robusto: Source = {
      ...createSource("feat", "Robusto", id),
      effects: [
        {
          ...createEffect("e1"),
          target: "hitPointsMax",
          expression: "nivel * 2",
        },
      ],
    };
    expect(await saveEntry(mestre, id, robusto)).toEqual({ status: "saved" });

    const [entry] = await searchEntries(mestre, { query: "robu" });
    expect(entry).toEqual({ id, source: robusto });
  });

  it("admin salva uma entrada com ações, e a cópia leva as ações", async () => {
    const { mestre } = await setup();
    const id = await created(
      await createEntry(mestre, { kind: "spell", name: "Raio de Fogo" }),
    );
    const fireBolt: Source = {
      ...createSource("spell", "Raio de Fogo", id),
      actions: [createAction({ kind: "spell" }, "a1")],
    };
    expect(await saveEntry(mestre, id, fireBolt)).toEqual({ status: "saved" });
    const [entry] = await searchEntries(mestre, { query: "raio" });
    expect(entry?.source.actions).toEqual(fireBolt.actions);
  });

  it("busca sem acentos, filtra por tipo, ordena por nome", async () => {
    const { lyra, mestre } = await setup();
    for (const [kind, name] of [
      ["spell", "Raio de Fogo"],
      ["spell", "Bola de Fôgo"],
      ["item", "Frasco de Fogo Alquímico"],
      ["feat", "Iniciado em Magia"],
    ] as const) {
      await created(await createEntry(mestre, { kind, name }));
    }

    expect(await names(lyra, "FOGO")).toEqual([
      "Bola de Fôgo",
      "Frasco de Fogo Alquímico",
      "Raio de Fogo",
    ]);
    expect(await names(lyra, "fogo", ["spell"])).toEqual([
      "Bola de Fôgo",
      "Raio de Fogo",
    ]);
    expect(await names(lyra, "", ["feat", "trait"])).toEqual([
      "Iniciado em Magia",
    ]);
    expect(await names(lyra, "100%_")).toEqual([]);
    expect(await names(lyra, "", ["desconhecido"])).toEqual([]);
  });

  it("a busca para em 50 resultados", async () => {
    const { lyra } = await setup();
    await getDb()
      .insert(compendiumEntry)
      .values(
        Array.from({ length: 55 }, (_, i) => {
          const source = createSource(
            "item",
            `Item ${String(i).padStart(2, "0")}`,
            `i${i}`,
          );
          return {
            id: source.id,
            kind: source.kind,
            name: source.name,
            searchName: searchKey(source.name),
            schemaVersion: SHEET_SCHEMA_VERSION,
            data: source,
          };
        }),
      );
    const found = await names(lyra, "item");
    expect(found).toHaveLength(50);
    expect(found[0]).toBe("Item 00");
  });

  it("salvar inválido, com tipo trocado ou inexistente não grava", async () => {
    const { mestre } = await setup();
    const id = await created(
      await createEntry(mestre, { kind: "feat", name: "Robusto" }),
    );
    const invalidEffect = {
      ...createSource("feat", "Robusto", id),
      effects: [{ ...createEffect("e1"), expression: "2 * nivel +" }],
    };
    expect(await saveEntry(mestre, id, invalidEffect)).toEqual({
      status: "invalid",
    });
    expect(
      await saveEntry(mestre, id, createSource("trait", "Robusto", id)),
    ).toEqual({ status: "invalid" });
    expect(
      await saveEntry(mestre, "nao-existe", createSource("feat", "X", "x")),
    ).toEqual({ status: "not_found" });
    expect(await deleteEntry(mestre, "nao-existe")).toEqual({
      status: "not_found",
    });
    const [entry] = await searchEntries(mestre, { query: "" });
    expect(entry?.source).toEqual(createSource("feat", "Robusto", id));
  });

  it("enviar uma magia em efeito grava fora de efeito; enviar de novo duplica", async () => {
    const { mestre } = await setup();
    const fireball = {
      ...createSource("spell", "Bola de Fogo", "s1"),
      level: 3,
      active: true,
    };
    const first = await sendToCompendium(mestre, fireball);
    const second = await sendToCompendium(mestre, fireball);
    if (!first.ok || !second.ok) throw new Error("falha ao enviar");
    expect(first.id).not.toBe(second.id);

    const entries = await searchEntries(mestre, { query: "bola" });
    expect(entries).toHaveLength(2);
    expect(entries[0]?.source).toMatchObject({ level: 3, active: false });
    expect(entries.map((e) => e.source.id).sort()).toEqual(
      [first.id, second.id].sort(),
    );
    expect(await sendToCompendium(mestre, { ...fireball, level: 12 })).toEqual({
      ok: false,
      error: "invalid",
    });
  });

  it("a entrada além do limite é recusada", async () => {
    const { mestre } = await setup();
    await getDb()
      .insert(compendiumEntry)
      .values(
        Array.from({ length: MAX_COMPENDIUM_ENTRIES }, (_, i) => {
          const source = createSource("feat", `Talento ${i}`, `f${i}`);
          return {
            id: source.id,
            kind: source.kind,
            name: source.name,
            searchName: searchKey(source.name),
            schemaVersion: SHEET_SCHEMA_VERSION,
            data: source,
          };
        }),
      );
    expect(
      await createEntry(mestre, { kind: "feat", name: "Mais um" }),
    ).toEqual({ ok: false, error: "limit" });
    expect(
      await sendToCompendium(mestre, createSource("feat", "Mais um", "m")),
    ).toEqual({ ok: false, error: "limit" });
  });

  it("entrada gravada no formato 9 é lida no formato atual", async () => {
    const { lyra } = await setup();
    const axe = {
      ...createSource("item", "Machado Grande", "i1"),
      category: "weapon" as const,
    };
    const formatNine: Record<string, unknown> = { ...axe };
    delete formatNine.actions;
    delete formatNine.weaponCategory;
    await getDb()
      .insert(compendiumEntry)
      .values({
        id: axe.id,
        kind: axe.kind,
        name: axe.name,
        searchName: searchKey(axe.name),
        schemaVersion: 9,
        data: formatNine,
      });
    const [entry] = await searchEntries(lyra, { query: "machado" });
    expect(entry?.source).toEqual(axe);
  });

  it("entrada do formato 10 com ações é lida no 11, sem descrição", async () => {
    const { lyra } = await setup();
    const sword = {
      ...createSource("item", "Espada Longa", "i2"),
      category: "weapon" as const,
      actions: [createAction({ kind: "item", category: "weapon" }, "a1")],
    };
    const action: Record<string, unknown> = { ...sword.actions[0] };
    delete action.description;
    await getDb()
      .insert(compendiumEntry)
      .values({
        id: sword.id,
        kind: sword.kind,
        name: sword.name,
        searchName: searchKey(sword.name),
        schemaVersion: 10,
        data: { ...sword, actions: [action] },
      });
    const [entry] = await searchEntries(lyra, { query: "espada" });
    expect(entry?.source).toEqual(sword);
  });

  it("excluir tira a entrada do compêndio", async () => {
    const { mestre } = await setup();
    const id = await created(
      await createEntry(mestre, { kind: "feat", name: "Robusto" }),
    );
    expect(await deleteEntry(mestre, id)).toEqual({ status: "deleted" });
    expect(await names(mestre, "")).toEqual([]);
  });
});
