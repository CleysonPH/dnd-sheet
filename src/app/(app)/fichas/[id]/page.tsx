import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SheetEditor } from "@/components/sheet/sheet-editor";
import { isAdmin } from "@/server/auth/guards";
import { getPageSession } from "@/server/auth/page";
import { getSheet } from "@/server/sheets/service";

import { saveSheetAction } from "./actions";

export const metadata: Metadata = { title: "Ficha · Ficha D&D" };

async function Sheet({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await getPageSession("user");
  const { id } = await params;
  // Ficha de outro usuário e ficha inexistente: mesmo resultado (design C4).
  const sheet = await getSheet(await headers(), id);
  if (!sheet) notFound();

  return (
    <SheetEditor
      // Recarregar após conflito traz outra versão: remonta o editor do zero.
      key={`${sheet.id}:${sheet.version}`}
      id={sheet.id}
      initialDocument={sheet.document}
      initialVersion={sheet.version}
      save={saveSheetAction.bind(null, sheet.id)}
      shareToken={sheet.shareToken}
      isAdmin={isAdmin(user)}
    />
  );
}

export default function SheetPage({ params }: PageProps<"/fichas/[id]">) {
  return (
    <>
      <Link
        href="/"
        className="text-sm text-muted hover:text-text hover:underline"
      >
        ← Minhas fichas
      </Link>
      <div className="mt-4">
        <Suspense>
          <Sheet params={params} />
        </Suspense>
      </div>
    </>
  );
}
