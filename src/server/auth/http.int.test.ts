import { describe, expect, it } from "vitest";

import { DISABLED_PATHS } from "./config";
import { getAuth } from "./index";

/** Caminhos que o plugin admin registra na versão instalada do Better Auth. */
function adminPluginPaths(): string[] {
  return Object.values(getAuth().api)
    .map((endpoint) => (endpoint as { path?: string }).path)
    .filter((path): path is string => !!path?.startsWith("/admin/"));
}

async function post(path: string) {
  return getAuth().handler(
    new Request(`http://localhost:3000/api/auth${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({}),
    }),
  );
}

describe("endpoints HTTP desligados", () => {
  it("todo endpoint do plugin admin está na lista de bloqueio", () => {
    const paths = adminPluginPaths();
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) expect(DISABLED_PATHS).toContain(path);
  });

  it.each(DISABLED_PATHS)("%s responde 404", async (path) => {
    expect((await post(path)).status).toBe(404);
  });
});
