"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
    // O Next preserva o estado do layout entre navegações: sem isto, o botão
    // volta desativado no próximo login feito na mesma aba.
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className={`text-sm disabled:opacity-50 ${className}`}
    >
      Sair
    </button>
  );
}
