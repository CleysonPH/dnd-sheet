# D&D Sheet

Ficha online de personagem para D&D 5.5e (regras de 2024), de uso interno nas mesas do grupo.

As decisões de produto e de arquitetura estão em `openspec/changes/dnd-sheet-architecture/`.

## Stack

- Next.js 16.4 (App Router, TypeScript, Tailwind)
- Postgres 18 com Drizzle ORM
- Better Auth (login por e-mail e senha, sessões no banco)
- Vitest, ESLint e Prettier
- Docker (imagem `standalone` para produção)

## Pré-requisitos

- Node.js 24 (mínimo 20.9)
- npm
- Docker com Compose

## Desenvolvimento

```bash
cp .env.example .env      # ajuste BETTER_AUTH_SECRET e as variáveis SEED_ADMIN_*
npm install
docker compose up -d db   # sobe o Postgres em localhost:5432
npm run db:migrate        # cria as tabelas
npm run db:seed           # cria o primeiro admin
npm run dev               # http://localhost:3000
```

Entre com o e-mail e a senha de `SEED_ADMIN_*`. No primeiro login o admin precisa trocar a senha. Não existe cadastro público: as outras contas são criadas pelo admin em **Contas**.

### Variáveis de ambiente

| Variável                                                     | Uso                                                                              |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `DATABASE_URL`                                               | Conexão da aplicação com o Postgres                                              |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`          | Credenciais do Postgres do Compose                                               |
| `BETTER_AUTH_SECRET`                                         | Assina os cookies de sessão; no mínimo 32 caracteres (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL`                                            | URL pública da aplicação                                                         |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Usadas só por `npm run db:seed`; podem ser removidas depois                      |

| Comando                 | O que faz                                    |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento                  |
| `npm run build`         | Build de produção                            |
| `npm run lint`          | ESLint                                       |
| `npm run typecheck`     | Gera os tipos do Next e roda `tsc`           |
| `npm test`              | Testes unitários (Vitest)                    |
| `npm run test:watch`    | Testes em modo watch                         |
| `npm run test:int`      | Testes de integração (precisa do banco)      |
| `npm run db:migrate`    | Aplica as migrações pendentes                |
| `npm run db:generate`   | Gera uma migração a partir do schema         |
| `npm run db:seed`       | Cria o primeiro admin (`SEED_ADMIN_*`)       |
| `npm run auth:generate` | Regenera o schema das tabelas do Better Auth |
| `npm run format`        | Formata o código com Prettier                |
| `npm run format:check`  | Verifica a formatação sem alterar arquivo    |

Os testes de integração usam um banco separado, `dnd_sheet_test`, no mesmo Postgres. Ele é criado e migrado automaticamente; basta o `db` estar rodando.

Para parar o banco: `docker compose down`. Os dados ficam no volume `db-data`; `docker compose down -v` apaga esse volume.

## Estrutura

```
src/
  app/          rotas do Next (UI e route handlers)
  components/   componentes React reutilizáveis
    sheet/      a ficha na tela: seções, campos numéricos, override e autosave
  engine/       motor de cálculo da ficha: TypeScript puro
    sheet/      formato do documento da ficha (schema, versão, migrações)
    stats/      regras do 5.5e e cálculo dos valores derivados (com override)
  server/       código só de servidor
    auth/       configuração do Better Auth, guards e troca de senha
    accounts/   administração de contas e seed do primeiro admin
    sheets/     fichas: listar, criar, abrir, salvar (com versão) e excluir
    db/         cliente Drizzle e schema
  lib/          utilitários compartilhados (ex.: env.ts)
  proxy.ts      redirecionamentos de login e troca de senha
drizzle/        migrações SQL geradas (versionadas)
scripts/        comandos de operação (seed, config da CLI do Better Auth)
```

Rotas principais: `/` (Minhas fichas), `/fichas/[id]` (ficha com salvamento automático), `/conta`, `/admin/contas` (só admins), `/login` e `/trocar-senha`.

A ficha é um documento JSON versionado (`schemaVersion`, hoje no formato 2). O documento guarda só entradas: atributos, proficiências, dado de vida, dano sofrido, deslocamento e valores manuais (`overrides`). Modificadores, perícias, PV máximo e os demais valores derivados são recalculados no navegador por `deriveStats` (`src/engine/stats/derive.ts`) e nunca são gravados. Ao mudar o formato em `src/engine/sheet/document.ts`, incremente `SHEET_SCHEMA_VERSION` e acrescente a migração correspondente em `src/engine/sheet/migrate.ts`, com teste.

O `src/engine/` não pode importar React, Next, APIs do Node, `src/server/`, `src/app/` nem `src/components/`. O ESLint barra esses imports.

## Imagem de produção

Para testar localmente a mesma imagem que vai para a VPS:

```bash
docker compose --profile prod up --build   # http://localhost:3000
```

Os serviços `migrate` e `app` só sobem com o profile `prod`. O `migrate` aplica as migrações e, se `SEED_ADMIN_EMAIL` estiver definida, roda o seed; o `app` só inicia depois que ele termina com sucesso.
