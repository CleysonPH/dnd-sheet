import type { Metadata } from "next";
import { Suspense } from "react";

import { ChangePasswordForm } from "@/components/change-password-form";
import { AuthCard } from "@/components/form";
import { SignOutButton } from "@/components/sign-out-button";
import { getPageSession } from "@/server/auth/page";

export const metadata: Metadata = { title: "Trocar senha · Ficha D&D" };

// Única página acessível com troca de senha pendente, além do logout.
async function RequiredChange() {
  await getPageSession("session");
  return (
    <>
      <ChangePasswordForm mode="required" />
      <div className="mt-4 text-center">
        <SignOutButton className="text-muted hover:underline" />
      </div>
    </>
  );
}

export default function ChangePasswordPage() {
  return (
    <AuthCard
      title="Trocar senha"
      description="Antes de continuar, troque a senha provisória por uma senha sua."
    >
      <Suspense>
        <RequiredChange />
      </Suspense>
    </AuthCard>
  );
}
