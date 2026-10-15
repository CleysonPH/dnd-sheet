import Link from "next/link";
import { Suspense } from "react";

import { Brand } from "@/components/form";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { isAdmin } from "@/server/auth/guards";
import { getPageSession } from "@/server/auth/page";

const NAV_LINK =
  "rounded-md px-2 py-1 text-sm whitespace-nowrap text-muted hover:bg-surface-2 hover:text-text";

async function Header() {
  const { user } = await getPageSession("user");
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-3">
        <Link href="/" aria-label="Minhas fichas">
          <Brand compact />
        </Link>
        <span className="flex-1" />
        {isAdmin(user) && (
          <Link href="/admin/contas" className={NAV_LINK}>
            Contas
          </Link>
        )}
        <Link href="/conta" className={NAV_LINK}>
          Minha conta
        </Link>
        <span className="hidden max-w-40 truncate text-sm text-muted md:inline">
          {user.name}
        </span>
        <ThemeToggle />
        <SignOutButton className={NAV_LINK} />
      </nav>
    </header>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense
        fallback={<div className="h-14 border-b border-line bg-surface" />}
      >
        <Header />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
