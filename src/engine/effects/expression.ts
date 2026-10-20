import type { Ability } from "@/engine/stats/keys";

/*
 * Expressões dos efeitos (design E4): inteiros, + - * /, parênteses, min, max
 * e as variáveis for..car, for.mod..car.mod, nivel e pb. No escopo do
 * companheiro (design H2), também dono.for..dono.car, dono.*.mod, dono.pb e
 * circulo.
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

/** Onde a expressão é usada: numa fonte ou num companheiro (design H2). */
export type ExpressionScope = "sheet" | "companion";

type OwnerVariable =
  | { kind: "score"; ability: Ability }
  | { kind: "mod"; ability: Ability }
  | { kind: "pb" };

export type Variable =
  | OwnerVariable
  | { kind: "level" }
  /** `conj.mod`: modificador do atributo de conjuração (design K4). */
  | { kind: "spellcasting" }
  /** `dono.*`: valor do dono, só no companheiro. */
  | { kind: "owner"; inner: OwnerVariable }
  /** `circulo`: círculo atual da invocação, só no companheiro. */
  | { kind: "spellLevel" };

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

function abilityVariable(name: string): OwnerVariable | null {
  if (name === "pb") return { kind: "pb" };
  const [base, suffix, extra] = name.split(".");
  const ability = ABILITY_VARIABLES[base!];
  if (ability && extra === undefined) {
    if (suffix === undefined) return { kind: "score", ability };
    if (suffix === "mod") return { kind: "mod", ability };
  }
  return null;
}

function variableFor(name: string, scope: ExpressionScope): Variable {
  if (name === "nivel" || name === "nível") return { kind: "level" };
  if (name === "conj.mod") return { kind: "spellcasting" };
  const own = abilityVariable(name);
  if (own) return own;
  if (scope === "companion") {
    if (name === "circulo" || name === "círculo") return { kind: "spellLevel" };
    if (name.startsWith("dono.")) {
      const inner = abilityVariable(name.slice("dono.".length));
      if (inner) return { kind: "owner", inner };
    }
  }
  throw new ParseError(`Variável desconhecida: ${name}`);
}

/** Converte o texto em árvore; erros vêm com a mensagem em português. */
export function parseExpression(
  text: string,
  scope: ExpressionScope = "sheet",
): ParseResult {
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
      return { type: "variable", variable: variableFor(token.value, scope) };
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

/**
 * `parseExpression` com cache por escopo e texto: deriveStats roda a cada
 * edição.
 */
export function parseExpressionCached(
  text: string,
  scope: ExpressionScope = "sheet",
): ParseResult {
  const key = `${scope}:${text}`;
  let result = cache.get(key);
  if (!result) {
    result = parseExpression(text, scope);
    if (cache.size > 500) cache.clear();
    cache.set(key, result);
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
  /** Variáveis do dono, no companheiro (`dono.*` e `conj.mod`). */
  owner?: ExpressionVariables;
  /** Círculo atual da invocação, no companheiro (`circulo`). */
  spellLevel?: number;
};

export class EvaluationError extends Error {}

/** Escopo em que as variáveis foram montadas: com dono, é o companheiro. */
export function scopeOf(variables: ExpressionVariables): ExpressionScope {
  return variables.owner ? "companion" : "sheet";
}

function variableValue(
  variable: Variable,
  variables: ExpressionVariables,
): number {
  switch (variable.kind) {
    case "score":
      return variables.scores[variable.ability];
    case "mod":
      return variables.mods[variable.ability];
    case "pb":
      return variables.pb;
    case "level":
      return variables.level;
    case "spellcasting": {
      // No companheiro, `conj.mod` é o do dono (design H2).
      if (variables.owner) return variableValue(variable, variables.owner);
      const ability = variables.spellcastingAbility;
      return ability ? variables.mods[ability] : 0;
    }
    case "owner":
      if (!variables.owner) {
        throw new EvaluationError("Variável do dono fora de um companheiro");
      }
      return variableValue(variable.inner, variables.owner);
    case "spellLevel":
      return variables.spellLevel ?? 0;
  }
}

/** Avalia a árvore; "/" é divisão inteira para baixo. */
export function evaluate(
  expression: Expression,
  variables: ExpressionVariables,
): number {
  switch (expression.type) {
    case "number":
      return expression.value;
    case "variable":
      return variableValue(expression.variable, variables);
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
