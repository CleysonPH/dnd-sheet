"use client";

import { useState } from "react";

/**
 * Mostra a senha provisória recém-gerada. Ela só existe no estado desta
 * resposta: recarregar a página a faz sumir (spec account-management).
 */
export function TempPasswordBox({
  label,
  password,
}: {
  label: string;
  password: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
  }

  return (
    <div
      role="status"
      className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
    >
      <p>{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="rounded bg-white px-2 py-1 font-mono text-base tracking-wide dark:bg-black">
          {password}
        </code>
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-amber-400 px-2 py-1 hover:bg-amber-100 dark:hover:bg-amber-900"
        >
          {copied ? "Copiada" : "Copiar"}
        </button>
      </div>
      <p className="mt-2 text-xs">
        Ela não será exibida de novo. Se perder, redefina a senha.
      </p>
    </div>
  );
}
