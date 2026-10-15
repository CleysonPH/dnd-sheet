import { describe, expect, it } from "vitest";

import { APP_TIME_ZONE } from "./time";

describe("APP_TIME_ZONE", () => {
  it("01:10 UTC aparece como 22:10 do dia anterior", () => {
    const format = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: APP_TIME_ZONE,
    });
    expect(format.format(new Date("2026-10-16T01:10:00Z"))).toBe(
      "15/10/2026, 22:10",
    );
  });
});
