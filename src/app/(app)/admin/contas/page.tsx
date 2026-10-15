import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";

import { Badge, Card } from "@/components/form";
import { listAccounts } from "@/server/accounts/service";
import { getPageSession } from "@/server/auth/page";

import { AccountRowActions } from "./account-row-actions";
import { CreateAccountForm } from "./create-account-form";

export const metadata: Metadata = { title: "Contas · Ficha D&D" };

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

async function Accounts() {
  // Não-admin recebe "não encontrado" (spec account-management).
  const { user: me } = await getPageSession("admin");
  const accounts = await listAccounts(await headers());

  return (
    <>
      <Card title="Nova conta" className="mt-6">
        <CreateAccountForm />
      </Card>

      <Card title={`Contas (${accounts.length})`} className="mt-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="py-2 pr-4 font-medium">Nome</th>
                <th className="py-2 pr-4 font-medium">E-mail</th>
                <th className="py-2 pr-4 font-medium">Papel</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 pr-4 font-medium">Criada em</th>
                <th className="py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr
                  key={account.id}
                  className="border-b border-line align-top last:border-0"
                >
                  <td className="py-3 pr-4">{account.name}</td>
                  <td className="py-3 pr-4">{account.email}</td>
                  <td className="py-3 pr-4">
                    {account.role === "admin" ? (
                      <Badge tone="accent">Admin</Badge>
                    ) : (
                      <Badge>Usuário</Badge>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {account.active ? (
                      <Badge tone="success">Ativa</Badge>
                    ) : (
                      <Badge tone="danger">Desativada</Badge>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {dateFormat.format(account.createdAt)}
                  </td>
                  <td className="py-3">
                    {account.id === me.id ? (
                      <span className="text-xs text-muted">Sua conta</span>
                    ) : (
                      <AccountRowActions
                        userId={account.id}
                        name={account.name}
                        role={account.role}
                        active={account.active}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

export default function AccountsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Contas</h1>
      <Suspense>
        <Accounts />
      </Suspense>
    </div>
  );
}
