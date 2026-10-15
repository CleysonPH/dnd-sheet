import { describe, expect, it } from "vitest";

import { parseInline, parseMarkdown } from "./markdown";

const t = (text: string) => ({ type: "text", text }) as const;

describe("parseMarkdown", () => {
  it("texto vazio não gera blocos", () => {
    expect(parseMarkdown("  \n ")).toEqual([]);
  });

  it("separa parágrafos por linha em branco e mantém quebras de linha", () => {
    expect(parseMarkdown("linha 1\nlinha 2\n\noutro")).toEqual([
      { type: "paragraph", lines: [[t("linha 1")], [t("linha 2")]] },
      { type: "paragraph", lines: [[t("outro")]] },
    ]);
  });

  it("reconhece listas com - e com 1.", () => {
    expect(parseMarkdown("- a\n- b\n\n1. x\n2. y")).toEqual([
      { type: "list", ordered: false, items: [[t("a")], [t("b")]] },
      { type: "list", ordered: true, items: [[t("x")], [t("y")]] },
    ]);
  });

  it("um bloco com linhas misturadas é parágrafo", () => {
    expect(parseMarkdown("Enquanto em fúria:\n- vantagem")[0]?.type).toBe(
      "paragraph",
    );
  });

  it("aceita \\r\\n", () => {
    expect(parseMarkdown("a\r\n\r\nb")).toHaveLength(2);
  });

  it("descrição de Fúria: negrito e lista", () => {
    expect(
      parseMarkdown(
        "Enquanto em **Fúria**:\n\n- vantagem em testes de FOR\n- resistência a dano físico",
      ),
    ).toEqual([
      {
        type: "paragraph",
        lines: [
          [
            t("Enquanto em "),
            { type: "strong", children: [t("Fúria")] },
            t(":"),
          ],
        ],
      },
      {
        type: "list",
        ordered: false,
        items: [
          [t("vantagem em testes de FOR")],
          [t("resistência a dano físico")],
        ],
      },
    ]);
  });
});

describe("parseInline", () => {
  it("negrito e itálico", () => {
    expect(parseInline("**a** e *b*")).toEqual([
      { type: "strong", children: [t("a")] },
      t(" e "),
      { type: "em", children: [t("b")] },
    ]);
  });

  it("itálico dentro de negrito", () => {
    expect(parseInline("**a *b* c**")).toEqual([
      {
        type: "strong",
        children: [t("a "), { type: "em", children: [t("b")] }, t(" c")],
      },
    ]);
  });

  it("marcadores sem par ficam como texto", () => {
    expect(parseInline("2 * 3 e **sem fim")).toEqual([t("2 * 3 e **sem fim")]);
    expect(parseInline("****")).toEqual([t("****")]);
    expect(parseInline("2 * 3 * 4")).toEqual([t("2 * 3 * 4")]);
  });

  it("HTML fica como texto", () => {
    expect(parseInline("<script>alert(1)</script> <b>x</b>")).toEqual([
      t("<script>alert(1)</script> <b>x</b>"),
    ]);
  });
});
