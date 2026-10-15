import { describe, expect, it } from "vitest";

import {
  evaluate,
  EvaluationError,
  parseExpression,
  referencedAbilities,
  type ExpressionVariables,
} from "./expression";

/** Thorin: FOR 16, DES 14, CON 16, INT 8, SAB 12, CAR 10, nível 5, PB +3. */
const thorin: ExpressionVariables = {
  scores: { str: 16, dex: 14, con: 16, int: 8, wis: 12, cha: 10 },
  mods: { str: 3, dex: 2, con: 3, int: -1, wis: 1, cha: 0 },
  level: 5,
  pb: 3,
  spellcastingAbility: null,
};

function run(text: string, variables = thorin): number {
  const parsed = parseExpression(text);
  if (!parsed.ok) throw new Error(parsed.error);
  return evaluate(parsed.expression, variables);
}

function error(text: string): string | undefined {
  const parsed = parseExpression(text);
  return parsed.ok ? undefined : parsed.error;
}

describe("parseExpression + evaluate", () => {
  it("Defesa sem Armadura do Bárbaro: 10 + des.mod + con.mod = 15", () => {
    expect(run("10 + des.mod + con.mod")).toBe(15);
  });

  it("respeita a precedência e os parênteses", () => {
    expect(run("2 + 3 * 4")).toBe(14);
    expect(run("(2 + 3) * 4")).toBe(20);
    expect(run("10 - 2 - 3")).toBe(5);
  });

  it("aceita menos unário", () => {
    expect(run("-2 + 5")).toBe(3);
    expect(run("--2")).toBe(2);
    expect(run("int.mod * -1")).toBe(1);
  });

  it("divisão arredonda para baixo, inclusive negativos", () => {
    expect(run("nivel / 2")).toBe(2);
    expect(run("-3 / 2")).toBe(-2);
  });

  it("min e max com vários argumentos", () => {
    expect(run("max(1, car.mod)")).toBe(1);
    expect(run("min(des.mod, 2)")).toBe(2);
    expect(run("max(for, des, con)")).toBe(16);
  });

  it("variáveis: valores, modificadores, nível com e sem acento, PB", () => {
    expect(run("for + des")).toBe(30);
    expect(run("2 * nivel")).toBe(10);
    expect(run("2 * nível")).toBe(10);
    expect(run("pb")).toBe(3);
    expect(run("DES.MOD")).toBe(2);
  });

  it("divisão por zero lança EvaluationError", () => {
    const parsed = parseExpression("10 / (des.mod - 2)");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(() => evaluate(parsed.expression, thorin)).toThrow(EvaluationError);
  });
});

describe("mensagens de erro", () => {
  it("expressão incompleta ou vazia", () => {
    expect(error("10 + des.mod +")).toBe("Expressão incompleta");
    expect(error("   ")).toBe("Expressão vazia");
  });

  it("variável desconhecida", () => {
    expect(error("10 + força")).toBe("Variável desconhecida: força");
    expect(error("des.valor")).toBe("Variável desconhecida: des.valor");
    expect(error("min")).toBe("Variável desconhecida: min");
  });

  it("símbolo inesperado", () => {
    expect(error("10 # 2")).toBe("Símbolo inesperado: #");
    expect(error("10 2")).toBe("Símbolo inesperado: 2");
    expect(error("10 )")).toBe("Símbolo inesperado: )");
  });

  it("parênteses sem fechar", () => {
    expect(error("(10 + 2")).toBe("Falta fechar parênteses");
    expect(error("max(1, 2")).toBe("Falta fechar parênteses");
  });
});

describe("referencedAbilities", () => {
  it("lista os atributos lidos por valor ou modificador", () => {
    const parsed = parseExpression("10 + des.mod + max(con, nivel) + pb");
    expect(
      parsed.ok && [...referencedAbilities(parsed.expression)].sort(),
    ).toEqual(["con", "dex"]);
  });
});

describe("conj.mod", () => {
  /** Ária: CAR 16, conjuração Carisma. */
  const aria: ExpressionVariables = {
    ...thorin,
    scores: { ...thorin.scores, cha: 16 },
    mods: { ...thorin.mods, cha: 3 },
    spellcastingAbility: "cha",
  };

  it("vale o modificador do atributo de conjuração", () => {
    expect(run("max(1, conj.mod)", aria)).toBe(3);
  });

  it("vale 0 sem atributo de conjuração", () => {
    expect(run("conj.mod", thorin)).toBe(0);
    expect(run("max(1, conj.mod)", thorin)).toBe(1);
  });

  it("conta como leitura do atributo de conjuração para os ciclos", () => {
    const parsed = parseExpression("conj.mod + 1");
    expect(
      parsed.ok && [...referencedAbilities(parsed.expression, "int")],
    ).toEqual(["int"]);
    expect(parsed.ok && [...referencedAbilities(parsed.expression)]).toEqual(
      [],
    );
  });
});
