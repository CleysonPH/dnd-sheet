"use client";

import { THEME_STORAGE_KEY } from "@/lib/theme";

import { MoonIcon, SunIcon } from "./icons";

/**
 * Alterna entre escuro e claro. Os dois ícones são renderizados e o CSS mostra
 * o certo, então o HTML do servidor não depende do tema.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";
    if (next === "light") root.dataset.theme = "light";
    else delete root.dataset.theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Sem localStorage (modo privado restrito): a troca vale só para a página.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
      title="Alternar tema claro/escuro"
      className={`rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-text ${className}`}
    >
      <SunIcon className="theme-icon-sun size-5" />
      <MoonIcon className="theme-icon-moon size-5" />
    </button>
  );
}
