import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { createSheetDocument } from "@/engine/sheet/document";
import {
  deactivateAccount,
  reactivateAccount,
} from "@/server/accounts/service";
import { getDb } from "@/server/db";
import { sheet } from "@/server/db/schema";
import { createTestUser, resetDatabase, signIn } from "@/server/test/helpers";

import { createSheet, deleteSheet, getSheet, saveSheet } from "./service";
import {
  disableShare,
  enableShare,
  getSharedSheet,
  regenerateShare,
} from "./share";

async function setup() {
  const lyra = await createTestUser({ email: "lyra@mesa.com" });
  await createTestUser({ email: "grog@mesa.com" });
  await createTestUser({ email: "mestre@mesa.com", role: "admin" });
  const headers = await signIn("lyra@mesa.com");
  const created = await createSheet(headers, { name: "Ária" });
  if (!created.ok) throw new Error("falha ao criar ficha de teste");
  return {
    lyraId: lyra.id,
    lyra: headers,
    grog: await signIn("grog@mesa.com"),
    mestre: await signIn("mestre@mesa.com"),
    id: created.id,
  };
}

async function tokenOf(result: Awaited<ReturnType<typeof enableShare>>) {
  if (!result.ok || !result.token) throw new Error("sem token");
  return result.token;
}

describe("link de compartilhamento", () => {
  beforeEach(resetDatabase);

  it("o dono gera o link, e gerar de novo devolve o mesmo", async () => {
    const { lyra, id } = await setup();

    const token = await tokenOf(await enableShare(lyra, id));

    expect(token).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(await enableShare(lyra, id)).toEqual({ ok: true, token });
    expect((await getSheet(lyra, id))?.shareToken).toBe(token);
    expect((await getSharedSheet(token))?.document.identity.name).toBe("Ária");
  });

  it("trocar devolve outro código, e o anterior deixa de ler", async () => {
    const { lyra, id } = await setup();
    const old = await tokenOf(await enableShare(lyra, id));

    const fresh = await tokenOf(await regenerateShare(lyra, id));

    expect(fresh).not.toBe(old);
    expect(await getSharedSheet(old)).toBeNull();
    expect(await getSharedSheet(fresh)).not.toBeNull();
  });

  it("desativar faz a leitura dar null", async () => {
    const { lyra, id } = await setup();
    const token = await tokenOf(await enableShare(lyra, id));

    expect(await disableShare(lyra, id)).toEqual({ ok: true, token: null });

    expect(await getSharedSheet(token)).toBeNull();
    expect((await getSheet(lyra, id))?.shareToken).toBeNull();
  });

  it("outro usuário, inclusive admin, é recusado nas três ações", async () => {
    const { lyra, grog, mestre, id } = await setup();
    const token = await tokenOf(await enableShare(lyra, id));
    const notFound = { ok: false, error: "NOT_FOUND" };

    for (const other of [grog, mestre]) {
      expect(await enableShare(other, id)).toEqual(notFound);
      expect(await regenerateShare(other, id)).toEqual(notFound);
      expect(await disableShare(other, id)).toEqual(notFound);
    }
    expect((await getSheet(lyra, id))?.shareToken).toBe(token);
  });

  it("gravar o código não muda a versão nem a data da ficha", async () => {
    const { lyra, id } = await setup();
    const [before] = await getDb().select().from(sheet).where(eq(sheet.id, id));

    await enableShare(lyra, id);
    await regenerateShare(lyra, id);

    const [after] = await getDb().select().from(sheet).where(eq(sheet.id, id));
    expect(after?.version).toBe(before?.version);
    expect(after?.updatedAt).toEqual(before?.updatedAt);
  });

  it("a leitura traz a versão salva mais recente", async () => {
    const { lyra, id } = await setup();
    const token = await tokenOf(await enableShare(lyra, id));
    const base = createSheetDocument("Ária");
    const document = {
      ...base,
      hitPoints: { ...base.hitPoints, damage: 5 },
    };

    await saveSheet(lyra, id, { baseVersion: 1, document });

    expect((await getSharedSheet(token))?.document.hitPoints.damage).toBe(5);
  });

  it("ficha excluída, código inventado e fora do formato dão null", async () => {
    const { lyra, id } = await setup();
    const token = await tokenOf(await enableShare(lyra, id));

    expect(await getSharedSheet("A".repeat(24))).toBeNull();
    expect(await getSharedSheet("curto")).toBeNull();
    expect(await getSharedSheet(`${token}' or '1'='1`)).toBeNull();

    await deleteSheet(lyra, id, { confirmName: "Ária" });
    expect(await getSharedSheet(token)).toBeNull();
  });

  it("dono desativado dá null, e volta a ler depois de reativado", async () => {
    const { lyra, mestre, lyraId, id } = await setup();
    const token = await tokenOf(await enableShare(lyra, id));

    await deactivateAccount(mestre, lyraId);
    expect(await getSharedSheet(token)).toBeNull();

    await reactivateAccount(mestre, lyraId);
    expect(await getSharedSheet(token)).not.toBeNull();
  });

  it("a resposta só tem o documento", async () => {
    const { lyra, id } = await setup();
    const token = await tokenOf(await enableShare(lyra, id));

    const shared = await getSharedSheet(token);

    expect(Object.keys(shared ?? {})).toEqual(["document"]);
    expect(JSON.stringify(shared)).not.toContain("lyra@mesa.com");
    expect(JSON.stringify(shared)).not.toContain(id);
  });
});
