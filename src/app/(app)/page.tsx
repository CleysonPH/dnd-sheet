import { Suspense } from "react";

import { getPageSession } from "@/server/auth/page";

// Página inicial provisória: vira a lista de fichas na change character-sheets.
async function Welcome() {
  const { user } = await getPageSession("user");
  return (
    <>
      <h1 className="text-2xl font-semibold">Olá, {user.name}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Suas fichas de personagem vão aparecer aqui.
      </p>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <Welcome />
    </Suspense>
  );
}
