# Tasks

## 1. Scaffold

- [x] 1.1 Inicializar o git na raiz e criar o `.gitignore` (Node, Next, `.env`, `.env.local`); verificar com `git status` que `openspec/` e `.claude/` aparecem como rastreáveis e `node_modules/` não
- [x] 1.2 Gerar o app com `create-next-app` (TypeScript, App Router, Tailwind, ESLint, `--src-dir`, alias `@/*`, `--use-npm`, `--disable-git`), usando um diretório temporário e movendo os arquivos para a raiz se o gerador recusar o diretório atual (S1); verificar que `npm run dev` responde 200 em `http://localhost:3000`
- [x] 1.3 Criar as pastas `src/components`, `src/engine`, `src/server` e `src/lib` (S3), com `server-only` instalado e importado num `src/server/index.ts`; verificar que `npm run build` passa

## 2. Qualidade de código

- [x] 2.1 Ativar `noUncheckedIndexedAccess` no `tsconfig.json` e adicionar o script `typecheck` (`tsc --noEmit`); verificar que `npm run typecheck` passa
- [x] 2.2 Adicionar Prettier, `eslint-config-prettier` e os scripts `format` e `format:check`; verificar que `npm run format:check` e `npm run lint` passam
- [x] 2.3 Adicionar a regra `no-restricted-imports` para `src/engine/` bloqueando `react`, `next`, `next/*`, `@/server/*`, `@/app/*`, `@/components/*` e os equivalentes relativos (S3); verificar que um import de `react` colocado temporariamente em `src/engine/` faz `npm run lint` falhar, e remover o import

## 3. Testes

- [x] 3.1 Instalar o Vitest e criar `vitest.config.ts` com ambiente `node`, alias `@/*` e o script `test` (S5); verificar que `npm test` roda
- [x] 3.2 Implementar `abilityModifier(score)` em `src/engine/abilities.ts` com o teste `src/engine/abilities.test.ts` cobrindo os valores 1, 8, 10, 11, 15 e 30 (-5, -1, 0, 0, +2, +10); verificar que `npm test` passa

## 4. Ambiente e Docker

- [x] 4.1 Criar `src/lib/env.ts` com validação preguiçosa via Zod de `DATABASE_URL`, além do `.env.example` (S7), com um teste unitário para URL ausente e válida; verificar que `npm test` passa e que `npm run build` passa sem `.env`
- [x] 4.2 Criar o `compose.yaml` com o serviço `db` (`postgres:18-alpine`, volume em `/var/lib/postgresql`, healthcheck) (S6); verificar que `docker compose up -d db` fica `healthy` e que `psql` conecta com a `DATABASE_URL` do `.env.example`
- [x] 4.3 Definir `output: 'standalone'` no `next.config.ts` e criar o `Dockerfile` multi-stage (`node:24-alpine`, `USER node`) e o `.dockerignore` (S6); verificar que `docker build` conclui
- [ ] 4.4 Adicionar o serviço `app` no `compose.yaml` sob o profile `prod`; verificar que `docker compose --profile prod up` sobe e `curl` em `http://localhost:3000` retorna 200

## 5. Documentação e integração

- [ ] 5.1 Escrever o `README.md` com pré-requisitos, comandos de desenvolvimento (`dev`, `lint`, `typecheck`, `test`, `format`), como subir o banco e como testar a imagem de produção, e a versão do Next usada; verificar seguindo o README do zero num clone limpo
- [ ] 5.2 Rodar `npm run lint && npm run typecheck && npm test && npm run build` numa árvore limpa e fazer o commit inicial; verificar que todos passam e que `git status` fica limpo
