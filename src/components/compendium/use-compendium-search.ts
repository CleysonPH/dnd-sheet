"use client";

import { useEffect, useState } from "react";

import { searchCompendiumAction } from "@/app/(app)/compendium-actions";
import type { CompendiumEntry } from "@/server/compendium/service";

/** Atraso da busca enquanto se digita (design B7). */
export const SEARCH_DELAY_MS = 300;

/**
 * Busca do compêndio com atraso: devolve os resultados atuais e uma função
 * para trocá-los depois de uma gravação.
 */
export function useCompendiumSearch(
  query: string,
  kinds: string[],
  initial: CompendiumEntry[] = [],
) {
  const [results, setResults] = useState(initial);
  const key = `${query}\u0000${kinds.join(",")}`;
  const [searched, setSearched] = useState(initial.length > 0 ? key : null);

  useEffect(() => {
    if (key === searched) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const found = await searchCompendiumAction(query, kinds);
      if (cancelled) return;
      setResults(found);
      setSearched(key);
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `key` resume `query` e `kinds`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, searched]);

  // Busca pendente: o que está na tela ainda não é desta busca.
  return { results, setResults, loading: key !== searched };
}
