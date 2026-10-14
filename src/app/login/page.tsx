import type { Metadata } from "next";

import { AuthCard } from "@/components/form";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Ficha D&D" };

// Sem cadastro: contas são criadas pelo admin (spec authentication).
export default function LoginPage() {
  return (
    <AuthCard
      title="Entrar"
      description="Não tem conta? Peça ao administrador da mesa."
    >
      <LoginForm />
    </AuthCard>
  );
}
