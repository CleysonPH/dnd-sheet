import type { ComponentProps, ReactNode } from "react";

import { D20Icon } from "./icons";
import { ThemeToggle } from "./theme-toggle";

/*
 * Componentes base da app (design V6). Cores só pelos tokens de globals.css.
 */

/** Superfície padrão: cartão com borda, com título opcional em caixa alta. */
export function Card({
  title,
  actions,
  className = "",
  children,
  ...props
}: Omit<ComponentProps<"section">, "title"> & {
  title?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-5 ${className}`}
      {...props}
    >
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && (
            <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">
              {title}
            </h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const BADGE_TONES = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-accent-text",
  danger: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
  manual: "bg-manual-soft text-manual",
} as const;

/** Etiqueta curta: papel, estado, nível... */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof BADGE_TONES;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Marca da app: ícone de d20 e nome. `compact` esconde o nome no celular. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold whitespace-nowrap">
      <D20Icon className="size-6 text-accent" />
      <span className={compact ? "max-sm:sr-only" : undefined}>
        Ficha D&amp;D
      </span>
    </span>
  );
}

/** Cartão centralizado das telas de acesso (login e troca de senha). */
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <ThemeToggle className="absolute top-4 right-4" />
      <Brand />
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-lg shadow-black/10">
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

export function TextField({
  label,
  error,
  ...input
}: ComponentProps<"input"> & { label: string; error?: string }) {
  const id = input.id ?? input.name;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full min-w-0 rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent aria-invalid:border-danger"
        {...input}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border border-line hover:bg-surface-2",
  danger: "bg-danger-solid text-white hover:opacity-90",
  success: "bg-success-soft text-success hover:opacity-90",
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof BUTTON_VARIANTS }) {
  return (
    <button
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export function FormMessage({
  kind = "error",
  children,
}: {
  kind?: "error" | "success";
  children: ReactNode;
}) {
  const styles =
    kind === "error"
      ? "border-danger/40 bg-danger-soft text-danger"
      : "border-success/40 bg-success-soft text-success";
  return (
    <p role="alert" className={`rounded-md border px-3 py-2 text-sm ${styles}`}>
      {children}
    </p>
  );
}
