import type { Metadata } from "next";
import { Suspense } from "react";

import { ChangePasswordForm } from "@/components/change-password-form";
import { Card } from "@/components/form";
import { getPageSession } from "@/server/auth/page";

export const metadata: Metadata = { title: "Minha conta · Ficha D&D" };

async function Account() {
  const { user } = await getPageSession("user");
  return (
    <div className="grid items-start gap-4 md:grid-cols-2">
      <Card title="Dados da conta">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Nome</dt>
          <dd className="min-w-0 truncate">{user.name}</dd>
          <dt className="text-muted">E-mail</dt>
          <dd className="min-w-0 truncate">{user.email}</dd>
        </dl>
      </Card>
      <Card title="Trocar senha">
        <ChangePasswordForm mode="voluntary" />
      </Card>
    </div>
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
