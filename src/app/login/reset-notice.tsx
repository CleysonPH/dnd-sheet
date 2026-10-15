"use client";

import { useSearchParams } from "next/navigation";

import { FormMessage } from "@/components/form";
import { RESET_MESSAGES } from "@/lib/auth-messages";

/** Aviso depois da redefinição pelo link (design P5). */
export function ResetNotice() {
  if (useSearchParams().get("redefinida") !== "1") return null;
  return (
    <div className="mb-4">
      <FormMessage kind="success">{RESET_MESSAGES.done}</FormMessage>
    </div>
  );
}
