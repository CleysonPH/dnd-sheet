# Tasks

## 1. Banco de dados

- [x] 1.1 Instalar `drizzle-orm`, `pg`, `@types/pg`, `drizzle-kit` e `tsx`, criar `drizzle.config.ts` e o `Pool`/cliente Drizzle preguiçoso em `src/server/db/index.ts` (A2); verificar que `npm run typecheck` e `npm run build` passam sem `.env`
- [x] 1.2 Adicionar `BETTER_AUTH_SECRET` (mín. 32 caracteres) e `BETTER_AUTH_URL` ao `src/lib/env.ts` e ao `.env.example` (A10), estendendo `src/lib/env.test.ts` com os casos de segredo curto e URL ausente; verificar que `npm test` passa

## 2. Configuração do Better Auth

- [x] 2.1 Instalar `better-auth` (versão fixa) e criar `src/server/auth/index.ts` com e-mail e senha, `disableSignUp`, sessão de 30 dias com `updateAge` de 1 dia, `cookieCache` desligado, campo `mustChangePassword`, plugin `admin` com `bannedUserMessage` em português, `nextCookies` por último, `disabledPaths` para `/sign-up/email` e todos os `/admin/*`, e rate limit `/sign-in/email` 5 por 60 s ativo também em dev (A1, A3, A7); verificar que `npm run typecheck` passa
- [x] 2.2 Gerar o schema Drizzle com a CLI do Better Auth em `src/server/db/auth-schema.ts`, gerar a migração com `drizzle-kit generate` em `drizzle/` e adicionar os scripts `db:generate` e `db:migrate`; verificar que `npm run db:migrate` cria as tabelas no Postgres local (`\dt` mostra user, session, account e verification)
- [x] 2.3 Criar o handler em `src/app/api/auth/[...all]/route.ts` e o client do Better Auth para o navegador em `src/lib/auth-client.ts`; verificar com `curl` que `GET /api/auth/get-session` responde 200 e que `POST /api/auth/sign-up/email` e `POST /api/auth/admin/list-users` respondem 404

## 3. Infraestrutura de testes de integração

- [x] 3.1 Configurar no Vitest um projeto de integração para `src/server/**/*.int.test.ts` com `resolve.conditions` incluindo `react-server`, `globalSetup` que cria o banco `dnd_sheet_test` e aplica as migrações (com mensagem clara se o Postgres não responder) e um helper que limpa as tabelas e cria sessões de teste via `auth.api` (A9, A11); adicionar o script `test:int`; verificar com um teste trivial que lê o banco e passa
- [x] 3.2 Documentar no README os novos comandos (`db:generate`, `db:migrate`, `db:seed`, `test:int`) e as novas variáveis; verificar seguindo os passos do README com um banco recriado (`docker compose down -v`)

## 4. Autenticação e guards

- [x] 4.1 Implementar `requireSession`, `requireUser` e `requireAdmin` em `src/server/auth/guards.ts` (A4), com testes de integração cobrindo sem sessão, troca pendente, usuário comum e admin; verificar que `npm run test:int` passa
- [x] 4.2 Implementar a troca de senha em `src/server/auth/password.ts` com validação Zod (8 a 128, diferente da atual), `revokeOtherSessions` e limpeza de `mustChangePassword` (A8), com testes de integração para cada cenário de "Troca de senha" da spec `authentication`; verificar que `npm run test:int` passa
- [x] 4.3 Criar `src/proxy.ts` com os redirecionamentos de A4 (sem sessão para `/login`, troca pendente para `/trocar-senha`, logado em `/login` para `/`); verificar no navegador os três redirecionamentos

## 5. Telas de autenticação

- [x] 5.1 Criar `/login` com o formulário usando o client do Better Auth e as mensagens das specs para credencial inválida, conta desativada e excesso de tentativas, sem opção de cadastro; verificar no navegador login válido, senha errada, e-mail inexistente (mesma mensagem) e a 6ª tentativa em um minuto sendo recusada
- [x] 5.2 Criar o layout logado com cabeçalho (nome, "Contas" só para admin, "Minha conta", "Sair") e a página inicial provisória em `/`; verificar no navegador que "Sair" encerra a sessão e que voltar no navegador leva ao login
- [x] 5.3 Criar `/trocar-senha` (obrigatória) e `/conta` (voluntária) usando a action de 4.2; verificar no navegador o fluxo de primeiro acesso até a página inicial e o erro de senha curta

## 6. Administração de contas

- [x] 6.1 Implementar `generateTempPassword` em `src/server/accounts/temp-password.ts` (A6), com teste unitário de tamanho mínimo, alfabeto sem caracteres ambíguos e unicidade; verificar que `npm test` passa
- [x] 6.2 Implementar em `src/server/accounts/service.ts` listar, criar (com e-mail duplicado e validação), desativar, reativar, redefinir senha e alterar papel, todos via `requireAdmin` e recusando ações sobre a própria conta (A3), com testes de integração para cada cenário da spec `account-management`, incluindo sessões encerradas ao desativar e redefinir e a conta reativada entrando com a senha antiga; verificar que `npm run test:int` passa
- [x] 6.3 Criar `/admin/contas` com a lista, o formulário de criação, as ações por linha (sem ações na linha do próprio admin, sem excluir) e a caixa da senha provisória com botão de copiar; verificar no navegador criar, desativar, reativar, redefinir e promover, e que um usuário comum recebe "não encontrado" em `/admin/contas`

## 7. Seed e operação

- [x] 7.1 Implementar `scripts/seed-admin.ts` e o script `db:seed` (A9), com testes de integração para primeira execução, execução repetida sem alterações e variável ausente; verificar que `npm run test:int` passa e que `npm run db:seed` cria o admin no banco local
- [x] 7.2 Adicionar o serviço `migrate` ao `compose.yaml` (profile `prod`, estágio `builder`) e passar as novas variáveis ao serviço `app`; verificar que `docker compose --profile prod up --build` migra, faz o seed e o login do admin funciona em `http://localhost:3000`

## 8. Verificação final

- [x] 8.1 Percorrer no navegador, num banco recriado, o roteiro completo: seed, primeiro login do admin com troca obrigatória, criação de uma conta comum, primeiro login dela, desativação durante o uso, login recusado, reativação, redefinição de senha e promoção; verificar que `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int` e `npm run build` passam
