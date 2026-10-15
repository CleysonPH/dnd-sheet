import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/form";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Esqueci a senha · Ficha D&D" };

// Pública, como o login (spec authentication, design P6).
export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Esqueci a senha"
      description="Informe o e-mail da sua conta. Se ele estiver cadastrado, enviamos um link para você escolher uma nova senha."
    >
      <ForgotPasswordForm />
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-muted hover:underline">
          Voltar ao login
        </Link>
      </p>
    </AuthCard>
  );
}
