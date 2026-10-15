// Build da Vercel (design Y3): em produção, aplica as migrações antes do
// `next build`. Se a migração falhar, o build falha e a versão anterior
// continua no ar. Previews e builds locais só constroem.
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL_ENV === "production") {
  if (!process.env.DATABASE_URL_UNPOOLED && !process.env.DATABASE_URL) {
    console.error(
      "Sem DATABASE_URL_UNPOOLED: não há onde aplicar as migrações.",
    );
    process.exit(1);
  }
  console.log("Aplicando as migrações no banco de produção...");
  run("npx", ["drizzle-kit", "migrate"]);
}

run("npx", ["next", "build"]);
