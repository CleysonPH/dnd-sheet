import { describe, expect, it } from "vitest";

import { abilityModifier } from "@/engine/abilities";

describe("abilityModifier", () => {
  it.each([
    [1, -5],
    [8, -1],
    [10, 0],
    [11, 0],
    [15, 2],
    [30, 10],
  ])("valor %i -> modificador %i", (score, expected) => {
    expect(abilityModifier(score)).toBe(expected);
  });
});
