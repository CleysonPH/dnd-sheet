import type { Ability } from "@/engine/stats/keys";

/*
 * Expressões dos efeitos (design E4): inteiros, + - * /, parênteses, min, max
 * e as variáveis for..car, for.mod..car.mod, nivel e pb.
 *
 *   expr    = term (("+" | "-") term)*
 *   term    = unary (("*" | "/") unary)*
 *   unary   = "-" unary | primary
 *   primary = inteiro | variável | ("min" | "max") "(" expr ("," expr)* ")"
 *           | "(" expr ")"
 */

/** Abreviações das variáveis de atributo. */
export const ABILITY_VARIABLES: Record<string, Ability> = {
  for: "str",
  des: "dex",
  con: "con",
  int: "int",
  sab: "wis",
  car: "cha",
};

export type Variable =
  | { kind: "score"; ability: Ability }
  | { kind: "mod"; ability: Ability }
  | { kind: "level" }
  | { kind: "pb" }
  /** `conj.mod`: modificador do atributo de conjuração (design K4). */
  | { kind: "spellcasting" };

export type Expression =
  | { type: "number"; value: number }
  | { type: "variable"; variable: Variable }
  | { type: "negate"; operand: Expression }
  | {
      type: "binary";
      op: "+" | "-" | "*" | "/";
      left: Expression;
      right: Expression;
    }
  | { type: "call"; fn: "min" | "max"; args: Expression[] };

export type ParseResult =
  { ok: true; expression: Expression } | { ok: false; error: string };

type Token =
  | { type: "number"; value: number }
  | { type: "name"; value: string }
  | { type: "symbol"; value: string };

class ParseError extends Error {}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i]!;
    if (/\s/.test(char)) {
      i++;
    } else if (/\d/.test(char)) {
      let end = i;
      while (end < text.length && /\d/.test(text[end]!)) end++;
      tokens.push({ type: "number", value: Number(text.slice(i, end)) });
      i = end;
    } else if (/[\p{L}_]/u.test(char)) {
      let end = i;
      // Nomes com ponto: "des.mod".
      while (end < text.length && /[\p{L}\d_.]/u.test(text[end]!)) end++;
      tokens.push({ type: "name", value: text.slice(i, end).toLowerCase() });
      i = end;
    } else if ("+-*/(),".includes(char)) {
      tokens.push({ type: "symbol", value: char });
      i++;
    } else {
      throw new ParseError(`Símbolo inesperado: ${char}`);
    }
  }
  return tokens;
}

function variableFor(name: string): Variable {
  if (name === "nivel" || name === "nível") return { kind: "level" };
  if (name === "pb") return { kind: "pb" };
  if (name === "conj.mod") return { kind: "spellcasting" };
  const [base, suffix, extra] = name.split(".");
  const ability = ABILITY_VARIABLES[base!];
  if (ability && extra === undefined) {
    if (suffix === undefined) return { kind: "score", ability };
    if (suffix === "mod") return { kind: "mod", ability };
  }
  throw new ParseError(`Variável desconhecida: ${name}`);
}

/** Converte o texto em árvore; erros vêm com a mensagem em português. */
export function parseExpression(text: string): ParseResult {
  let tokens: Token[];
  try {
    tokens = tokenize(text);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
  if (tokens.length === 0) return { ok: false, error: "Expressão vazia" };

  let position = 0;
  const peek = () => tokens[position];
  const isSymbol = (value: string) => {
    const token = peek();
    return token?.type === "symbol" && token.value === value;
  };
  const expect = (value: string, message: string) => {
    if (!isSymbol(value)) throw new ParseError(message);
    position++;
  };

  function expr(): Expression {
    let left = term();
    while (isSymbol("+") || isSymbol("-")) {
      const op = (tokens[position++] as { value: "+" | "-" }).value;
      left = { type: "binary", op, left, right: term() };
    }
    return left;
  }

  function term(): Expression {
    let left = unary();
    while (isSymbol("*") || isSymbol("/")) {
      const op = (tokens[position++] as { value: "*" | "/" }).value;
      left = { type: "binary", op, left, right: unary() };
    }
    return left;
  }

  function unary(): Expression {
    if (isSymbol("-")) {
      position++;
      return { type: "negate", operand: unary() };
    }
    return primary();
  }

  function primary(): Expression {
    const token = peek();
    if (!token) throw new ParseError("Expressão incompleta");
    position++;
    if (token.type === "number") return { type: "number", value: token.value };
    if (token.type === "name") {
      if ((token.value === "min" || token.value === "max") && isSymbol("(")) {
        position++;
        const args = [expr()];
        while (isSymbol(",")) {
          position++;
          args.push(expr());
        }
        expect(")", "Falta fechar parênteses");
        return { type: "call", fn: token.value, args };
      }
      return { type: "variable", variable: variableFor(token.value) };
    }
    if (token.value === "(") {
      const inner = expr();
      expect(")", "Falta fechar parênteses");
      return inner;
    }
    throw new ParseError(`Símbolo inesperado: ${token.value}`);
  }

  try {
    const expression = expr();
    const rest = peek();
    if (rest) {
      throw new ParseError(`Símbolo inesperado: ${rest.value}`);
    }
    return { ok: true, expression };
  } catch (error) {
    if (error instanceof ParseError) return { ok: false, error: error.message };
    throw error;
  }
}

const cache = new Map<string, ParseResult>();

/** `parseExpression` com cache por texto: deriveStats roda a cada edição. */
export function parseExpressionCached(text: string): ParseResult {
  let result = cache.get(text);
  if (!result) {
    result = parseExpression(text);
    if (cache.size > 500) cache.clear();
    cache.set(text, result);
  }
  return result;
}

export type ExpressionVariables = {
  scores: Record<Ability, number>;
  mods: Record<Ability, number>;
  level: number;
  pb: number;
  /** Atributo de conjuração da ficha; null sem atributo (`conj.mod` = 0). */
  spellcastingAbility: Ability | null;
};

export class EvaluationError extends Error {}

/** Avalia a árvore; "/" é divisão inteira para baixo. */
export function evaluate(
  expression: Expression,
  variables: ExpressionVariables,
): number {
  switch (expression.type) {
    case "number":
      return expression.value;
    case "variable": {
      const { variable } = expression;
      if (variable.kind === "score") return variables.scores[variable.ability];
      if (variable.kind === "mod") return variables.mods[variable.ability];
      if (variable.kind === "spellcasting") {
        const ability = variables.spellcastingAbility;
        return ability ? variables.mods[ability] : 0;
      }
      return variable.kind === "level" ? variables.level : variables.pb;
    }
    case "negate":
      return -evaluate(expression.operand, variables);
    case "call": {
      const values = expression.args.map((arg) => evaluate(arg, variables));
      return expression.fn === "min"
        ? Math.min(...values)
        : Math.max(...values);
    }
    case "binary": {
      const left = evaluate(expression.left, variables);
      const right = evaluate(expression.right, variables);
      switch (expression.op) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          if (right === 0) throw new EvaluationError("Divisão por zero");
          return Math.floor(left / right);
      }
    }
  }
}

/**
 * Atributos lidos pela expressão (valor ou modificador), para os ciclos.
 * `conj.mod` lê o atributo de conjuração da ficha (design K4).
 */
export function referencedAbilities(
  expression: Expression,
  spellcastingAbility: Ability | null = null,
): Set<Ability> {
  const found = new Set<Ability>();
  const visit = (node: Expression) => {
    switch (node.type) {
      case "variable":
        if (node.variable.kind === "score" || node.variable.kind === "mod") {
          found.add(node.variable.ability);
        } else if (
          node.variable.kind === "spellcasting" &&
          spellcastingAbility
        ) {
          found.add(spellcastingAbility);
        }
        return;
      case "negate":
        visit(node.operand);
        return;
      case "binary":
        visit(node.left);
        visit(node.right);
        return;
      case "call":
        node.args.forEach(visit);
        return;
      default:
        return;
    }
  };
  visit(expression);
  return found;
}
