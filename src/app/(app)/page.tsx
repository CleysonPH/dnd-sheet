import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";

import { getPageSession } from "@/server/auth/page";
import { listSheets, type SheetSummary } from "@/server/sheets/service";

import { CreateSheetForm } from "./create-sheet-form";

export const metadata: Metadata = { title: "Minhas fichas · Ficha D&D" };

const updatedFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function describe(sheet: SheetSummary): string {
  const parts = [sheet.species, sheet.class].filter(Boolean);
  if (sheet.level !== null) parts.push(`nível ${sheet.level}`);
  return parts.join(" · ");
}

async function SheetList() {
  await getPageSession("user");
  const sheets = await listSheets(await headers());

  if (sheets.length === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Você ainda não tem fichas. Crie a primeira acima.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {sheets.map((sheet) => (
        <li key={sheet.id}>
          <Link
            href={`/fichas/${sheet.id}`}
            className="flex flex-col gap-0.5 px-4 py-3 hover:bg-zinc-50 sm:flex-row sm:items-baseline sm:gap-4 dark:hover:bg-zinc-900"
          >
            <span className="font-medium">{sheet.name}</span>
            <span className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">
              {describe(sheet)}
            </span>
            <span className="text-xs text-zinc-500">
              alterada em {updatedFormat.format(sheet.updatedAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Minhas fichas</h1>
      <div className="mt-6">
        <CreateSheetForm />
      </div>
      <div className="mt-8">
        <Suspense>
          <SheetList />
        </Suspense>
      </div>
    </>
  );
}
