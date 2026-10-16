import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";

import { CompendiumManager } from "@/components/compendium/compendium-manager";
import { getPageSession } from "@/server/auth/page";
import { searchEntries } from "@/server/compendium/service";

export const metadata: Metadata = { title: "Compêndio · Ficha D&D" };

async function Compendium() {
  // Não-admin recebe "não encontrado" (spec compendium).
  await getPageSession("admin");
  const entries = await searchEntries(await headers(), { query: "" });
  return <CompendiumManager initialEntries={entries} />;
}

export default function CompendiumPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Compêndio</h1>
      <p className="mt-1 text-sm text-muted">
        Talentos, traços, itens e magias prontos, que os jogadores copiam para
        as fichas.
      </p>
      <Suspense>
        <Compendium />
      </Suspense>
    </>
  );
}
