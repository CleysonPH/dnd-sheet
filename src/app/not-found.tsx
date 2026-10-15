import Link from "next/link";

import { Card } from "@/components/form";
import { D20Icon } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="flex max-w-sm flex-col items-center gap-3 p-8 text-center">
        <D20Icon className="size-10 text-accent" />
        <h1 className="text-2xl font-semibold">Página não encontrada</h1>
        <p className="text-muted">O endereço que você abriu não existe.</p>
        <Link href="/" className="text-sm text-accent-text hover:underline">
          Voltar ao início
        </Link>
      </Card>
    </main>
  );
}
