"use client";

import { useActionState } from "react";

import { accountRowAction, type RowActionState } from "./actions";
import { TempPasswordBox } from "./temp-password-box";

// Não há ação de excluir: desativar é a única forma de remover o acesso.
export function AccountRowActions({
  userId,
  name,
  role,
  active,
}: {
  userId: string;
  name: string;
  role: "user" | "admin";
  active: boolean;
}) {
  const [state, formAction, pending] = useActionState<RowActionState, FormData>(
    accountRowAction.bind(null, userId),
    {},
  );

  const button = (action: string, label: string) => (
    <button
      type="submit"
      name="action"
      value={action}
      disabled={pending}
      className="rounded-md border border-line px-2 py-1 text-xs hover:bg-surface-2 disabled:opacity-50"
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction} className="flex flex-wrap gap-2">
        {active
          ? button("deactivate", "Desativar")
          : button("reactivate", "Reativar")}
        {button("reset", "Redefinir senha")}
        {role === "admin"
          ? button("demote", "Tornar usuário")
          : button("promote", "Tornar admin")}
      </form>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      {state.tempPassword && (
        <TempPasswordBox
          label={`Nova senha provisória de ${name}:`}
          password={state.tempPassword}
        />
      )}
    </div>
  );
}
