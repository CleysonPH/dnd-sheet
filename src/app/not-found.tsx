import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        O endereço que você abriu não existe.
      </p>
      <Link href="/" className="text-sm underline">
        Voltar ao início
      </Link>
    </main>
  );
}
