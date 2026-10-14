# Proposal

## Why

O repositório ainda não tem código. Antes de especificar e implementar qualquer capacidade (contas, fichas, motor de cálculo), é preciso uma base de projeto que siga as decisões da change `dnd-sheet-architecture` (D1 e D3): Next.js com TypeScript, Postgres em Docker, build `standalone` para a VPS e um módulo isolado e testável para o motor de cálculo.

## What Changes

- Cria a aplicação Next.js (App Router, TypeScript, `src/`, alias `@/*`) na raiz do repositório e inicializa o git.
- Configura a qualidade de código: ESLint, Prettier, `tsc --noEmit` em modo estrito.
- Configura o Vitest para testes unitários, com o primeiro teste no módulo do motor (`src/engine/`).
- Cria a estrutura de pastas inicial que separa a UI, o código só de servidor e o motor de cálculo.
- Adiciona um Docker Compose para desenvolvimento com Postgres e um Dockerfile de produção multi-stage usando `output: 'standalone'`.
- Adiciona `.env.example` com as variáveis previstas (`DATABASE_URL` e as do Postgres) e a validação dessas variáveis na inicialização.
- Adiciona um README com os comandos de desenvolvimento.

Fora do escopo: a biblioteca de acesso ao banco e as migrações (decididas na change `account-management`), a autenticação, as telas, o deploy na VPS e o HTTPS (change `deployment`), e o CI remoto.

## Capabilities

### New Capabilities

Nenhuma. Esta change é só de infraestrutura e ferramentas, sem comportamento observável pelo usuário (`skip_specs: true`).

### Modified Capabilities

Nenhuma.

## Impact

- Cria `package.json`, `next.config.ts`, `tsconfig.json`, configs de ESLint/Prettier/Vitest, `Dockerfile`, `compose.yaml`, `.env.example`, `.gitignore`, `.dockerignore`, `README.md` e a pasta `src/`.
- Dependências: `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `eslint`, `prettier`, `vitest`, `zod`.
- Pré-requisitos locais: Node.js >= 20.9 (a máquina atual tem 24), npm e Docker com Compose.
