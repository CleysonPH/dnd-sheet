import type { Metadata } from "next";
import { Suspense } from "react";

import { ChangePasswordForm } from "@/components/change-password-form";
import { getPageSession } from "@/server/auth/page";

export const metadata: Metadata = { title: "Minha conta · Ficha D&D" };

async function Account() {
  const { user } = await getPageSession("user");
  return (
    <>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-zinc-500">Nome</dt>
        <dd>{user.name}</dd>
        <dt className="text-zinc-500">E-mail</dt>
        <dd>{user.email}</dd>
      </dl>
      <h2 className="mt-8 text-lg font-semibold">Trocar senha</h2>
      <div className="mt-4 max-w-sm">
        <ChangePasswordForm mode="voluntary" />
      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Minha conta</h1>
      <div className="mt-6">
        <Suspense>
          <Account />
        </Suspense>
      </div>
    </div>
  );
}
