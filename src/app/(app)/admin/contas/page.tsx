import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";

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
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Nova conta</h2>
        <div className="mt-3">
          <CreateAccountForm />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Contas ({accounts.length})</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
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
                  className="border-b border-zinc-100 align-top dark:border-zinc-900"
                >
                  <td className="py-3 pr-4">{account.name}</td>
                  <td className="py-3 pr-4">{account.email}</td>
                  <td className="py-3 pr-4">
                    {account.role === "admin" ? "Admin" : "Usuário"}
                  </td>
                  <td className="py-3 pr-4">
                    {account.active ? (
                      "Ativa"
                    ) : (
                      <span className="text-red-600">Desativada</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {dateFormat.format(account.createdAt)}
                  </td>
                  <td className="py-3">
                    {account.id === me.id ? (
                      <span className="text-xs text-zinc-500">Sua conta</span>
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
      </section>
    </>
  );
}

export default function AccountsPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Contas</h1>
      <Suspense>
        <Accounts />
      </Suspense>
    </>
  );
}
