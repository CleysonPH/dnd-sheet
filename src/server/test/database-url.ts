/**
 * URL do banco de teste: a mesma DATABASE_URL do .env (ou a padrão do Compose),
 * trocando o nome do banco por dnd_sheet_test.
 */
export function testDatabaseUrl(): string {
  try {
    process.loadEnvFile();
  } catch {
    // sem .env: usa o ambiente ou o padrão do Compose
  }
  const url = new URL(
    process.env.DATABASE_URL ?? "postgresql://dnd:dnd@localhost:5432/dnd_sheet",
  );
  url.pathname = "/dnd_sheet_test";
  return url.toString();
}
