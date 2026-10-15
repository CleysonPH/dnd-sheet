# Proposal

## Why

A aplicação só roda na máquina de desenvolvimento, e a mesa precisa dela num endereço público. O roadmap previa uma VPS com containers, proxy reverso e `pg_dump` agendado (tarefa 4.1 e decisão D1 de `dnd-sheet-architecture`). A escolha agora é Vercel e Neon: sem servidor para manter, com HTTPS, deploy a cada push e restauração instantânea do banco. Parte do código assume um servidor de longa duração e precisa mudar para funcionar em funções serverless.

## What Changes

- **Produção na Vercel**: o projeto fica ligado ao repositório `CleysonPH/dnd-sheet`, com as funções na região `gru1` (São Paulo). Cada push na `main` gera o deploy de produção. Os previews não usam o banco de produção.
- **Banco no Neon**: um projeto novo, `dnd-sheet`, em `aws-sa-east-1`. A aplicação usa a URL com pooler, e as migrações usam a URL direta.
- **Migrações no deploy**: o build de produção aplica as migrações antes de publicar. Se a migração falhar, o deploy falha e a versão anterior continua no ar.
- **Ajustes para serverless**:
  - o e-mail de redefinição é enviado com `waitUntil`, para não se perder quando a função congela depois da resposta;
  - o rate limit do Better Auth passa a ser guardado no banco, numa tabela nova com migração, e o IP do cliente vem do cabeçalho que a Vercel preenche;
  - o pool do `pg` usa `attachDatabasePool`.
- **Datas no horário de Brasília**: a Vercel roda em UTC, então as datas formatadas no servidor passam a usar `America/Sao_Paulo`.
- **Recuperação de dados**: fica com o histórico do Neon (6 horas no plano free), um procedimento no README e um ensaio de restauração num branch. **Fora do escopo**: `pg_dump` agendado, por decisão do usuário. É uma divergência consciente da tarefa 4.1.
- **Sem containers de produção**: o `Dockerfile`, o `.dockerignore`, o `output: "standalone"` e os serviços `migrate` e `app` do profile `prod` do Compose saem. O Compose fica só para o desenvolvimento (Postgres e Mailpit).
- **Primeiro admin em produção**: o seed roda uma vez, da máquina de desenvolvimento, contra o Neon.
- **Roadmap**: a decisão D1 é revista para Vercel + Neon, e o texto da tarefa 4.1 é atualizado.

## Capabilities

### New Capabilities

- `operations`: como a aplicação roda em produção:
  - endereço público com HTTPS e publicação a cada push;
  - migrações aplicadas antes da nova versão;
  - recuperação de dados;
  - limites de tentativas que valem entre instâncias;
  - entrega do e-mail depois da resposta;
  - datas no horário de Brasília.

### Modified Capabilities

Nenhuma. Autenticação, contas e fichas mantêm o comportamento. O que muda é a garantia de que ele vale em produção, e isso fica em `operations`.

## Impact

- **Código**:
  - `src/server/auth/config.ts`: o envio com `waitUntil`, o rate limit no banco e o IP do cliente;
  - `src/server/db/auth-schema.ts`: a tabela `rateLimit`, com a migração 0003;
  - `src/server/db/index.ts`: o `attachDatabasePool`;
  - `drizzle.config.ts`: a URL direta nas migrações;
  - `package.json`: o script `vercel-build` e a dependência `@vercel/functions`;
  - os formatadores de data em `src/app/(app)/page.tsx` e em `src/app/(app)/admin/contas/page.tsx`.
- **Removidos**: `Dockerfile`, `.dockerignore`, `output: "standalone"` em `next.config.ts` e os serviços `migrate` e `app` do `compose.yaml`.
- **Serviços externos**, cada um criado com a confirmação do usuário:
  - o projeto `dnd-sheet` no Neon;
  - o projeto na Vercel, com as variáveis de ambiente;
  - o provedor SMTP, cuja senha o próprio usuário grava na Vercel.
- **Documentação**: o README ganha o deploy, as variáveis, o seed em produção e a recuperação de dados.
- **Roadmap**: `openspec/changes/dnd-sheet-architecture/` (D1 e tarefa 4.1).
