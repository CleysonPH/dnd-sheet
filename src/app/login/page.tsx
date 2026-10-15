import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard } from "@/components/form";

import { LoginForm } from "./login-form";
import { ResetNotice } from "./reset-notice";

export const metadata: Metadata = { title: "Entrar · Ficha D&D" };

// Sem cadastro: contas são criadas pelo admin (spec authentication).
export default function LoginPage() {
  return (
    <AuthCard
      title="Entrar"
      description="Não tem conta? Peça ao administrador da mesa."
    >
      <Suspense>
        <ResetNotice />
      </Suspense>
      <LoginForm />
      <p className="mt-4 text-center text-sm">
        <Link href="/esqueci-senha" className="text-muted hover:underline">
          Esqueci a senha
        </Link>
      </p>
    </AuthCard>
  );
}
