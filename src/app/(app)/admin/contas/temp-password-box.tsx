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
      className="rounded-md border border-manual/40 bg-manual-soft p-3 text-sm text-text"
    >
      <p>{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="rounded bg-bg px-2 py-1 font-mono text-base tracking-wide">
          {password}
        </code>
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-manual/60 px-2 py-1 hover:bg-surface-2"
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
