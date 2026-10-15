import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Brand } from "@/components/form";
import { SheetViewer } from "@/components/sheet/sheet-viewer";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSharedSheet } from "@/server/sheets/share";

// Sem indexação: o link é para quem o recebeu (design L3).
export const metadata: Metadata = {
  title: "Ficha compartilhada · Ficha D&D",
  robots: { index: false, follow: false },
};

async function SharedSheet({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // Código inexistente, link desativado, ficha excluída ou dono desativado.
  const shared = await getSharedSheet(token);
  if (!shared) notFound();
  return <SheetViewer document={shared.document} />;
}

/** Ficha compartilhada por link, sem sessão e só para leitura (design L3). */
export default function SharedSheetPage({
  params,
}: PageProps<"/compartilhada/[token]">) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Brand compact />
          <span className="flex-1 text-sm text-muted">
            · Ficha compartilhada, só leitura
          </span>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Suspense>
          <SharedSheet params={params} />
        </Suspense>
      </main>
    </>
  );
}
