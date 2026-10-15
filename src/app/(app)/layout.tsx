import Link from "next/link";
import { Suspense } from "react";

import { SignOutButton } from "@/components/sign-out-button";
import { isAdmin } from "@/server/auth/guards";
import { getPageSession } from "@/server/auth/page";

async function Header() {
  const { user } = await getPageSession("user");
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="font-semibold">
          Ficha D&amp;D
        </Link>
        <span className="flex-1" />
        {isAdmin(user) && (
          <Link href="/admin/contas" className="text-sm hover:underline">
            Contas
          </Link>
        )}
        <Link href="/conta" className="text-sm hover:underline">
          Minha conta
        </Link>
        <span className="hidden text-sm text-zinc-500 sm:inline">
          {user.name}
        </span>
        <SignOutButton />
      </nav>
    </header>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense
        fallback={
          <div className="h-12 border-b border-zinc-200 dark:border-zinc-800" />
        }
      >
        <Header />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
