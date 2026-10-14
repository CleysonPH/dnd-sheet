# Design

## Context

O repositório tem só `openspec/` e `.claude/`, sem git e sem código. As decisões de stack (D1) e de motor isolado (D3) estão em `openspec/changes/dnd-sheet-architecture/design.md`. A máquina de desenvolvimento tem Node 24, npm e Docker com Compose; o pnpm não está instalado.

## Goals / Non-Goals

**Goals:**
- `npm run dev` sobe a aplicação e `docker compose up -d db` sobe o Postgres local.
- `npm run lint`, `npm run typecheck` e `npm test` passam numa base limpa.
- `docker build` gera uma imagem de produção `standalone` que inicia e responde.
- O motor de cálculo fica isolado desde o primeiro commit, sem depender de React nem de Next.

**Non-Goals:**
- Biblioteca de acesso ao banco, migrações e schema (change `account-management`).
- Autenticação, telas e layout.
- Deploy na VPS, HTTPS e backup (change `deployment`).
- CI remoto (GitHub Actions etc.): pode vir quando houver um remoto definido.
- Testes de componentes React e E2E: entram quando houver telas para testar.

## Decisions

### S1. Scaffold com `create-next-app` e defaults do Next

App Router, TypeScript, Tailwind, ESLint, Turbopack, `src/` e alias `@/*`, que são os defaults atuais do `create-next-app`, mais `--src-dir`. O `AGENTS.md` gerado é mantido, porque orienta agentes a usar APIs atuais do Next.

- **Tailwind** fica por ser o default e de baixo custo; é uma suposição que pode ser revista na change que definir o layout da ficha.
- **Alternativa**: montar o projeto à mão. Rejeitado, porque os defaults do gerador já são o que queremos.
- O `create-next-app` pode recusar um diretório com arquivos (`openspec/`, `.claude/`). Nesse caso, o scaffold é gerado num diretório temporário e os arquivos são movidos para a raiz.

### S2. npm como gerenciador de pacotes

- **Por quê**: já está instalado, e no Docker não precisa de corepack.
- **Alternativa**: pnpm (instalação mais rápida e estrita). O ganho não compensa um pré-requisito a mais num projeto deste porte.

### S3. Estrutura de pastas com fronteiras explícitas

```
  src/
    app/          rotas do Next (UI e route handlers)
    components/   componentes React reutilizáveis
    engine/       motor de cálculo: TS puro, sem React/Next/Node APIs
    server/       código só de servidor (banco, auth), importa "server-only"
    lib/          utilitários compartilhados (ex.: env.ts)
```

- A regra de importação do `engine/` é garantida pelo ESLint (`no-restricted-imports` bloqueando `react`, `next/*`, `@/server/*` e `@/app/*` dentro de `src/engine/`). Assim a fronteira de D3 não depende de disciplina.
- `server/` usa o pacote `server-only` para que um import acidental num componente cliente quebre o build.

### S4. Qualidade: ESLint + Prettier + tsc estrito

- ESLint com a config gerada pelo Next, mais a regra de S3. Prettier para formatação, com `eslint-config-prettier` para evitar conflito.
- `tsconfig` com `strict: true` (default) e `noUncheckedIndexedAccess: true`, útil num motor que vai acessar muitos mapas (atributos, perícias).
- Scripts: `lint`, `format`, `format:check`, `typecheck` (`tsc --noEmit`), `test`.
- **Alternativa**: Biome (substitui ESLint e Prettier com uma ferramenta só). Rejeitado por enquanto: a config do Next e o ecossistema de regras são de ESLint.

### S5. Vitest para testes unitários, começando pelo motor

- Ambiente `node` como padrão, porque o motor não precisa de DOM. `jsdom` e Testing Library ficam para quando houver componentes a testar.
- Testes ficam ao lado do código (`*.test.ts`).
- Um teste inicial real no motor (ex.: `abilityModifier(score)` cobrindo 1, 10, 11 e 30) prova a configuração e já deixa a primeira regra do domínio coberta.
- **Alternativa**: Jest. Rejeitado: Vitest é mais simples com ESM/TypeScript e é o caminho documentado pelo Next.

### S6. Docker: Compose para desenvolvimento e Dockerfile multi-stage para produção

```
  compose.yaml
    db   : postgres:18-alpine, porta 5432, volume nomeado, healthcheck
    app  : build do Dockerfile, profile "prod" (não sobe por padrão)

  Dockerfile (multi-stage, node:24-alpine)
    deps    --> npm ci
    builder --> next build (output: 'standalone')
    runner  --> copia .next/standalone + .next/static + public,
                USER node, CMD node server.js
```

- Em desenvolvimento o app roda fora do Docker (`npm run dev`, hot reload mais rápido) e só o banco fica no container.
- O serviço `app` sob o profile `prod` permite testar a imagem de produção localmente com `docker compose --profile prod up`.
- O Postgres 18 mudou o caminho de dados da imagem oficial: o volume deve ser montado em `/var/lib/postgresql`, não em `/var/lib/postgresql/data`.

### S7. Variáveis de ambiente validadas com Zod, de forma preguiçosa

- `src/lib/env.ts` valida `DATABASE_URL` (e futuras variáveis) com Zod na primeira leitura em runtime, não no import, para que `next build` dentro do Docker não exija segredos.
- `.env.example` versionado; `.env` e `.env.local` no `.gitignore`.
- Zod também será usado depois para validar o documento da ficha (ver riscos de `dnd-sheet-architecture`), então não é uma dependência só para isto.

### S8. Git inicializado nesta change

O repositório ainda não é git. O primeiro commit inclui o `openspec/` já existente e o scaffold.

## Risks / Trade-offs

- [Defaults do `create-next-app` mudam entre versões (ex.: Cache Components ligado por padrão no App Router)] -> Aceitar os defaults da versão instalada e registrar no README a versão do Next usada.
- [`DATABASE_URL` configurada sem nenhum código que use o banco ainda] -> Intencional: o Compose e o env ficam prontos para `account-management`, que escolhe a biblioteca de acesso.
- [Regra de fronteira do `engine/` burlável com caminhos relativos (`../server`)] -> Incluir padrões relativos na regra do ESLint e cobrir com um arquivo de teste que deve falhar o lint (verificado manualmente uma vez).
- [Imagem de produção não testada até o deploy] -> A tarefa de Docker exige subir a imagem localmente e receber resposta HTTP 200.
