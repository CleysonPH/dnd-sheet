import { z } from "zod";

import { parseExpression, type ExpressionScope } from "./expression";

/**
 * Texto de expressão validado pelo parser no escopo dado (design H2): as
 * fontes usam "sheet" e o companheiro, "companion".
 */
export function expressionSchema(scope: ExpressionScope = "sheet") {
  return z
    .string()
    .max(100, "Use no máximo 100 caracteres")
    .superRefine((text, ctx) => {
      const parsed = parseExpression(text, scope);
      if (!parsed.ok) ctx.addIssue({ code: "custom", message: parsed.error });
    });
}
