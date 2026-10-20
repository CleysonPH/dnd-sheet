import { describe, expect, it } from "vitest";

import { createAction } from "@/engine/attacks/schema";
import { SHEET_SCHEMA_VERSION } from "@/engine/sheet/document";

import { SourceFormatError, migrateSource } from "./migrate";
import { createSource } from "./rules";
import { searchKey } from "./search";

describe("searchKey", () => {
  it("ignora acentos, maiúsculas e espaços nas pontas", () => {
    expect(searchKey("  BOLA de fôgo ")).toBe(searchKey("Bola de Fogo"));
    expect(searchKey("Bola de Fogo")).toBe("bola de fogo");
  });

  it("Élfico contém elf", () => {
    expect(searchKey("Élfico")).toContain(searchKey("elf"));
  });
});

describe("migrateSource", () => {
  const robusto = createSource("feat", "Robusto", "r1");

  it("fonte da versão atual passa sem mudanças", () => {
    expect(
      migrateSource(structuredClone(robusto), SHEET_SCHEMA_VERSION),
    ).toEqual(robusto);
  });

  it("aplica os passos desde a versão gravada", () => {
    const old = { ...robusto, name: "robusto antigo" };
    const migrated = migrateSource(old, 9, {
      currentVersion: 10,
      migrations: { 9: (source) => ({ ...source, name: "Robusto" }) },
    });
    expect(migrated).toEqual(robusto);
  });

  it("leva uma fonte do formato 9 ao atual", () => {
    const axe = {
      ...createSource("item", "Machado Grande", "i1"),
      category: "weapon" as const,
    };
    const formatNine: Record<string, unknown> = { ...axe };
    delete formatNine.actions;
    delete formatNine.weaponCategory;
    expect(migrateSource(formatNine, 9)).toEqual(axe);
  });

  it("leva uma fonte do formato 10 com ações ao 11, sem descrição", () => {
    const sword = {
      ...createSource("item", "Espada Longa", "i1"),
      actions: [createAction({ kind: "item", category: "weapon" }, "a1")],
    };
    const withoutDescription: Record<string, unknown> = { ...sword.actions[0] };
    delete withoutDescription.description;
    const formatTen = { ...sword, actions: [withoutDescription] };
    expect(migrateSource(formatTen, 10)).toEqual(sword);
  });

  it("recusa fonte inválida ou versão fora do intervalo", () => {
    expect(() =>
      migrateSource({ ...robusto, name: "" }, SHEET_SCHEMA_VERSION),
    ).toThrow(SourceFormatError);
    expect(() => migrateSource(robusto, 8)).toThrow(SourceFormatError);
    expect(() => migrateSource(robusto, SHEET_SCHEMA_VERSION + 1)).toThrow(
      SourceFormatError,
    );
    expect(() => migrateSource(null, SHEET_SCHEMA_VERSION)).toThrow(
      SourceFormatError,
    );
  });
});
