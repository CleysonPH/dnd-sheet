"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";

import { shareSheetAction } from "@/app/(app)/fichas/[id]/actions";
import { Button, FormMessage } from "@/components/form";

const noSubscribe = () => () => {};

/** Origem da página; vazia no servidor, que não conhece o endereço público. */
function useOrigin(): string {
  return useSyncExternalStore(
    noSubscribe,
    () => window.location.origin,
    () => "",
  );
}

/**
 * Seção "Compartilhar" da ficha do dono (design L5): gerar, copiar, trocar e
 * desativar o link de leitura.
 */
export function SharePanel({
  id,
  initialToken,
}: {
  id: string;
  initialToken: string | null;
}) {
  const [token, setToken] = useState(initialToken);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const origin = useOrigin();
  const url = token ? `${origin}/compartilhada/${token}` : "";

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  function run(action: "enable" | "regenerate" | "disable") {
    setError(null);
    startTransition(async () => {
      const result = await shareSheetAction(id, action);
      if (result.ok) setToken(result.token);
      else setError("Não foi possível alterar o link. Recarregue a página.");
    });
  }

  async function copy() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setError("Não foi possível copiar. Selecione o endereço e copie.");
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="share-title">
      <h2 id="share-title" className="text-sm font-semibold">
        Compartilhar
      </h2>
      {error && <FormMessage>{error}</FormMessage>}
      {token ? (
        <>
          <p className="text-sm text-muted">
            Qualquer pessoa com este link vê a ficha, sem poder alterar.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              readOnly
              aria-label="Link de compartilhamento"
              value={url}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 basis-64 rounded-md border border-line bg-bg px-3 py-2 text-sm"
            />
            <Button type="button" onClick={copy} disabled={pending}>
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => run("regenerate")}
            >
              Gerar novo link
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => run("disable")}
            >
              Desativar link
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted">
            Gere um link para qualquer pessoa ver esta ficha, sem poder alterar.
          </p>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => run("enable")}
          >
            Gerar link
          </Button>
        </div>
      )}
    </section>
  );
}
