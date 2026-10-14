import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // O motor de cálculo é TypeScript puro: não depende de React, Next, APIs do
  // Node nem de outras camadas do app (UI, servidor).
  {
    files: ["src/engine/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react/*", "react-dom", "react-dom/*"],
              message: "src/engine não pode depender de React.",
            },
            {
              group: ["next", "next/*", "server-only", "client-only"],
              message: "src/engine não pode depender do Next.",
            },
            {
              group: ["node:*"],
              message: "src/engine não pode usar APIs do Node.",
            },
            {
              group: [
                "@/app",
                "@/app/*",
                "@/components",
                "@/components/*",
                "@/server",
                "@/server/*",
                "**/app",
                "**/app/*",
                "**/components",
                "**/components/*",
                "**/server",
                "**/server/*",
              ],
              message:
                "src/engine não pode importar UI nem código de servidor.",
            },
          ],
        },
      ],
    },
  },
  // Desliga as regras de estilo que conflitam com o Prettier. Deve vir por último.
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
