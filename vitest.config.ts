import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

import { testDatabaseUrl } from "./src/server/test/database-url";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  test: {
    projects: [
      {
        // Espelha o alias "@/*" do tsconfig.json.
        resolve: { alias },
        test: {
          name: "unit",
          // O motor não precisa de DOM. jsdom entra quando houver componentes a testar.
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.int.test.ts"],
        },
      },
      {
        resolve: {
          alias: {
            ...alias,
            // O mesmo que a condição "react-server" faz no Next: `import "server-only"`
            // vira o módulo vazio do pacote (design A9).
            "server-only": fileURLToPath(
              new URL("./node_modules/server-only/empty.js", import.meta.url),
            ),
          },
        },
        test: {
          name: "integration",
          environment: "node",
          include: ["src/**/*.int.test.ts"],
          globalSetup: ["./src/server/test/global-setup.ts"],
          // Todos os arquivos usam o mesmo banco de teste.
          fileParallelism: false,
          env: {
            DATABASE_URL: testDatabaseUrl(),
            BETTER_AUTH_SECRET: "segredo-de-teste-com-mais-de-32-caracteres",
            BETTER_AUTH_URL: "http://localhost:3000",
            // Mailpit do Compose (design P8).
            SMTP_HOST: "localhost",
            SMTP_PORT: "1025",
            MAIL_FROM: "Ficha D&D <ficha@localhost>",
          },
        },
      },
    ],
  },
});
