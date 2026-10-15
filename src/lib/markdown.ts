/*
 * Markdown básico das descrições de fontes (design F4): parágrafos, quebras de
 * linha, listas com "- " ou "1. ", **negrito** e *itálico*. Gera uma árvore
 * de dados, nunca HTML; quem exibe transforma em elementos React.
 */

export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] };

export type Block =
  | { type: "paragraph"; lines: Inline[][] }
  | { type: "list"; ordered: boolean; items: Inline[][] };

const BULLET = /^- (.*)$/;
const NUMBERED = /^\d+\. (.*)$/;

export function parseMarkdown(text: string): Block[] {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (normalized === "") return [];

  return normalized.split(/\n[ \t]*\n/).map((chunk) => {
    const lines = chunk.split("\n").map((line) => line.trimEnd());
    for (const [pattern, ordered] of [
      [BULLET, false],
      [NUMBERED, true],
    ] as const) {
      if (lines.every((line) => pattern.test(line))) {
        return {
          type: "list",
          ordered,
          items: lines.map((line) => parseInline(line.match(pattern)![1]!)),
        };
      }
    }
    return { type: "paragraph", lines: lines.map((line) => parseInline(line)) };
  });
}

const SPACE = /\s/;

/**
 * Posição do marcador que fecha o trecho aberto em `start`, ou -1. Como no
 * CommonMark, o trecho não pode começar nem terminar com espaço ("2 * 3 * 4"
 * não é itálico).
 */
function closing(text: string, marker: string, start: number): number {
  if (start >= text.length || SPACE.test(text[start]!)) return -1;
  let end = text.indexOf(marker, start);
  while (end !== -1 && SPACE.test(text[end - 1]!)) {
    end = text.indexOf(marker, end + 1);
  }
  return end;
}

/** Negrito e itálico; marcadores sem par ficam como texto. */
export function parseInline(
  text: string,
  allow: { strong: boolean; em: boolean } = { strong: true, em: true },
): Inline[] {
  const out: Inline[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer) out.push({ type: "text", text: buffer });
    buffer = "";
  };

  let i = 0;
  while (i < text.length) {
    if (allow.strong && text.startsWith("**", i)) {
      const end = closing(text, "**", i + 2);
      if (end > i + 2) {
        flush();
        out.push({
          type: "strong",
          children: parseInline(text.slice(i + 2, end), {
            ...allow,
            strong: false,
          }),
        });
        i = end + 2;
        continue;
      }
    }
    if (allow.em && text[i] === "*" && text[i + 1] !== "*") {
      const end = closing(text, "*", i + 1);
      if (end > i + 1) {
        flush();
        out.push({
          type: "em",
          children: parseInline(text.slice(i + 1, end), {
            ...allow,
            em: false,
          }),
        });
        i = end + 1;
        continue;
      }
    }
    buffer += text[i];
    i++;
  }
  flush();
  return out;
}
