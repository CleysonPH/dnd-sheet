// Cria o primeiro admin a partir das variáveis SEED_ADMIN_* (npm run db:seed).
// Roda com --conditions=react-server para que `import "server-only"` não lance erro.
import { seedAdmin } from "../src/server/accounts/seed";
import { getPool } from "../src/server/db";

try {
  process.loadEnvFile();
} catch {
  // sem .env: usa só o ambiente
}

try {
  const result = await seedAdmin(process.env);
  console.log(
    result.created
      ? `Admin ${result.email} criado. Ele precisa trocar a senha no primeiro login.`
      : `Já existe uma conta com o e-mail ${result.email}. Nada foi alterado.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await getPool().end();
}
