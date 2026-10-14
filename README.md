# D&D Sheet

Ficha online de personagem para D&D 5.5e (regras de 2024), de uso interno nas mesas do grupo.

As decisões de produto e de arquitetura estão em `openspec/changes/dnd-sheet-architecture/`.

## Stack

- Next.js 16.4 (App Router, TypeScript, Tailwind)
- Postgres 18
- Vitest, ESLint e Prettier
- Docker (imagem `standalone` para produção)

## Pré-requisitos

- Node.js 24 (mínimo 20.9)
- npm
- Docker com Compose

## Desenvolvimento

```bash
cp .env.example .env
npm install
docker compose up -d db   # sobe o Postgres em localhost:5432
npm run dev               # http://localhost:3000
```

| Comando                | O que faz                                 |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento               |
| `npm run build`        | Build de produção                         |
| `npm run lint`         | ESLint                                    |
| `npm run typecheck`    | Gera os tipos do Next e roda `tsc`        |
| `npm test`             | Testes unitários (Vitest)                 |
| `npm run test:watch`   | Testes em modo watch                      |
| `npm run format`       | Formata o código com Prettier             |
| `npm run format:check` | Verifica a formatação sem alterar arquivo |

Para parar o banco: `docker compose down`. Os dados ficam no volume `db-data`; `docker compose down -v` apaga esse volume.

## Estrutura

```
src/
  app/          rotas do Next (UI e route handlers)
  components/   componentes React reutilizáveis
  engine/       motor de cálculo da ficha: TypeScript puro
  server/       código só de servidor (banco, autenticação)
  lib/          utilitários compartilhados (ex.: env.ts)
```

O `src/engine/` não pode importar React, Next, APIs do Node, `src/server/`, `src/app/` nem `src/components/`. O ESLint barra esses imports.

## Imagem de produção

Para testar localmente a mesma imagem que vai para a VPS:

```bash
docker compose --profile prod up --build   # http://localhost:3000
```

O serviço `app` só sobe com o profile `prod` e se conecta ao serviço `db` do Compose.
