import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { createSheetDocument } from "@/engine/sheet/document";
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
