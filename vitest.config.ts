import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Espelha o alias "@/*" do tsconfig.json.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // O motor não precisa de DOM. jsdom entra quando houver componentes a testar.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
