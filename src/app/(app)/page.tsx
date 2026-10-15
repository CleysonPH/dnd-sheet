import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";

import { Badge, Card } from "@/components/form";
import { D20Icon } from "@/components/icons";
import { getPageSession } from "@/server/auth/page";
import { listSheets, type SheetSummary } from "@/server/sheets/service";

import { CreateSheetForm } from "./create-sheet-form";
import { APP_TIME_ZONE } from "@/lib/time";

export const metadata: Metadata = { title: "Minhas fichas · Ficha D&D" };

const updatedFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: APP_TIME_ZONE,
});

function describe(sheet: SheetSummary): string {
  return [sheet.species, sheet.class].filter(Boolean).join(" · ");
}

async function SheetList() {
  await getPageSession("user");
  const sheets = await listSheets(await headers());

  if (sheets.length === 0) {
    return (
      <Card className="text-center text-muted">
        <D20Icon className="mx-auto mb-2 size-8 text-accent" />
        Você ainda não tem fichas. Crie a primeira acima.
      </Card>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sheets.map((sheet) => (
        <li key={sheet.id}>
          <Link
            href={`/fichas/${sheet.id}`}
            className="flex h-full flex-col gap-1 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent"
          >
            <span className="flex items-start justify-between gap-2">
              <span className="min-w-0 truncate text-lg font-semibold">
                {sheet.name}
              </span>
              {sheet.level !== null && (
                <Badge tone="accent">nível {sheet.level}</Badge>
              )}
            </span>
            <span className="min-h-5 text-sm text-muted">
              {describe(sheet)}
            </span>
            <span className="mt-auto pt-2 text-xs text-muted">
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
      <Card title="Nova ficha" className="mt-6 max-w-xl">
        <CreateSheetForm />
      </Card>
      <div className="mt-8">
        <Suspense>
          <SheetList />
        </Suspense>
      </div>
    </>
  );
}
