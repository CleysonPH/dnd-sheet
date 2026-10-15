import type { z } from "zod";

/*
 * Conversão do texto digitado nos campos numéricos (design S6). O texto vira
 * número só quando tem o formato certo; os limites vêm do schema do documento,
 * para não repetir intervalos e mensagens.
 */

export type ParseResult =
  { ok: true; value: number } | { ok: false; error: string };

function check(value: number, schema: z.ZodType<number>): ParseResult {
  const result = schema.safeParse(value);
  return result.success
    ? { ok: true, value: result.data }
    : { ok: false, error: result.error.issues[0]?.message ?? "Valor inválido" };
}

/** Inteiro com sinal opcional: "12", "-3", "+4". Outros formatos viram erro do schema. */
export function parseInteger(raw: string, schema: z.ZodType<number>) {
  const text = raw.trim();
  return check(/^[+-]?\d+$/.test(text) ? Number(text) : NaN, schema);
}

/**
 * Decimal sem sinal com até `places` casas, aceitando vírgula ou ponto:
 * "7,5", "9", "0,25".
 */
export function parseDecimal(
  raw: string,
  schema: z.ZodType<number>,
  places = 1,
) {
  const text = raw.trim().replace(",", ".");
  const pattern = new RegExp(`^\\d+(\\.\\d{1,${places}})?$`);
  return check(pattern.test(text) ? Number(text) : NaN, schema);
}

/** Modificadores e bônus: "+3", "-1", "+0". */
export function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

/** Decimal no formato brasileiro: 7.5 -> "7,5". */
export function formatDecimal(value: number): string {
  return String(value).replace(".", ",");
}
