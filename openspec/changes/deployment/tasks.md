# Tasks

## 1. Código para serverless

- [x] 1.1 Instalar `@vercel/functions`, enviar o e-mail de redefinição com `waitUntil` e chamar `attachDatabasePool` no `getPool` (Y2). Verificar que `npm run test:int` passa, inclusive o envio para o Mailpit
- [x] 1.2 Passar o rate limit para `storage: "database"` com `ipAddressHeaders: ["x-forwarded-for"]`, gerar a tabela com `npm run auth:generate` e a migração 0003 com `npm run db:generate`, e limpar a tabela em `resetDatabase` (Y2). Escrever um teste de integração com duas instâncias de `createAuth` sobre o mesmo banco, em que o 4º pedido de redefinição em 1 minuto é recusado mesmo alternando as instâncias. Verificar que `npm run db:migrate` aplica a migração no banco de dev e que `npm run test:int` passa
- [x] 1.3 Criar `src/lib/time.ts` com `APP_TIME_ZONE` e usá-lo nos formatadores de `src/app/(app)/page.tsx` e de `src/app/(app)/admin/contas/page.tsx` (Y2). Escrever um teste unitário em que 01:10 UTC aparece como 22:10 do dia anterior. Verificar que `npm test` passa
- [x] 1.4 Criar `scripts/vercel-build.mjs` e o script `vercel-build` (migração só com `VERCEL_ENV=production`, com `DATABASE_URL_UNPOOLED`), o `vercel.json` com `gru1`, e fazer o `drizzle.config.ts` preferir `DATABASE_URL_UNPOOLED` (Y3). Remover o `Dockerfile`, o `.dockerignore`, o `output: "standalone"` e os serviços `migrate` e `app` do Compose (Y4). Verificar que:
  - `npm run build` passa;
  - `VERCEL_ENV=production npm run vercel-build` com o banco de dev aplica as migrações e constrói;
  - `docker compose --profile dev up -d` continua subindo o banco e o Mailpit
- [x] 1.5 Atualizar o README: deploy na Vercel, variáveis de produção, seed em produção, recuperação de dados com o histórico do Neon e o comando de `pg_dump` manual (Y3, Y5, Y6). Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check` e verificar que todos passam. Fazer o push para a `main`, com a confirmação do usuário

## 2. Infraestrutura (cada passo com a confirmação do usuário)

- [x] 2.1 Criar no Neon o projeto `dnd-sheet` em `aws-sa-east-1` (Y1). Verificar pelo MCP que o projeto existe, o branch `main` está ativo e as URLs com e sem pooler respondem a `select 1`
- [x] 2.2 Criar na Vercel o projeto `dnd-sheet` ligado a `CleysonPH/dnd-sheet` e gravar as variáveis de Production sem mostrar os valores, deixando `SMTP_PASSWORD` para o usuário preencher no painel (Y3). Verificar pelo MCP que o projeto existe, ligado ao repositório, com as variáveis criadas no ambiente Production
- [x] 2.3 Depois de o usuário gravar a senha SMTP, disparar o deploy de produção e acompanhar o build (Y3). Verificar pelos logs que as migrações 0000 a 0003 foram aplicadas, que o deploy está `READY` e que o endereço de produção responde por HTTPS com a página de login

## 3. Produção no ar

- [x] 3.1 Rodar o seed do primeiro admin contra o Neon, com a URL direta só no ambiente do comando (Y5). Verificar com o usuário que ele entra, troca a senha e corrige o e-mail do admin para um endereço real
- [ ] 3.5 Criar o `RetryingPool` e usá-lo no `getPool` (Y2), com um teste de integração em que um proxy TCP derruba a primeira conexão: o `Pool` comum falha, e o `RetryingPool` conecta na segunda tentativa e faz `select 1`. Uma falha que não é de conexão (SQL inválido) não é repetida. Verificar que `npm run test:int` passa e, depois do push e do deploy, que a primeira requisição depois de mais de 5 minutos parado não gera erro em `get_runtime_errors`
- [ ] 3.2 Fazer a verificação em produção (Y5). Verificar:
  - "Esqueci a senha" entrega o e-mail com o link, e a redefinição funciona;
  - uma ficha nova aparece na lista com a hora de Brasília;
  - o link compartilhado abre numa aba anônima;
  - a 6ª tentativa de login errada em 1 minuto é recusada;
  - `get_runtime_errors` na Vercel não mostra erros
- [ ] 3.3 Fazer o ensaio de restauração no Neon (Y6): criar um branch do momento de 1 hora atrás, contar as fichas e as contas nele, comparar com o `main` e excluir o branch. Verificar que o `main` não mudou e registrar o ensaio no README
- [ ] 3.4 Rever a D1 em `openspec/changes/dnd-sheet-architecture/design.md` (Vercel + Neon, com a divergência do backup) e reescrever o texto da tarefa 4.1 em `tasks.md`. Verificar que `openspec validate dnd-sheet-architecture` passa
