# Design

## Context

- **O plano anterior**: o roadmap (`dnd-sheet-architecture`, D1) previa um container Next.js `standalone`, um Postgres em outro container e um proxy com HTTPS numa VPS, mais `pg_dump` agendado. Daí vieram o `Dockerfile`, o `output: "standalone"` e os serviços `migrate` e `app` do profile `prod` do `compose.yaml`.
- **Pontos do código que assumem um processo de longa duração**:
  - `sendResetPassword` dispara o envio com `void sendMail(...)`, sem aguardar (design P3 de `password-reset`). Numa função serverless, a instância pode congelar depois da resposta, e o envio fica pela metade;
  - o rate limit do Better Auth está em memória (`rateLimit.enabled` com `customRules`), e cada instância conta sozinha;
  - `getPool()` cria um `Pool` do `pg` sem liberar as conexões ociosas quando a função suspende;
  - as datas são formatadas no servidor com `Intl.DateTimeFormat("pt-BR")`, sem fuso, então saem em UTC na Vercel.
- **Contas e ferramentas**:
  - o repositório `CleysonPH/dnd-sheet` é público e está atualizado;
  - a Vercel tem o time "Cleyson de Sousa Lima's projects", acessível pelo MCP;
  - o Neon tem a organização "Cleyson", no plano free, acessível pelo MCP com escrita;
  - não há CLI da Vercel nem do Neon instalada (dá para usar `npx`).

Motivação: proposal.md. Comportamento: `specs/operations`.

## Goals / Non-Goals

**Goals:**
- Publicar a aplicação com o comportamento das specs mantido em funções serverless.
- Nenhum segredo no repositório público, nem impresso na conversa.

**Non-Goals:**
- `pg_dump` agendado ou backup fora do Neon (decisão do usuário).
- Deploys de preview com banco próprio (branch do Neon por preview).
- Domínio próprio. O `*.vercel.app` serve para começar, e o domínio pode entrar depois só trocando `BETTER_AUTH_URL`.
- Monitoramento além dos logs da Vercel.

## Decisions

### Y1. Neon: projeto `dnd-sheet` em São Paulo, duas URLs

- Um projeto novo, `dnd-sheet`, na organização "Cleyson", região `aws-sa-east-1`, com o banco `neondb` e o branch `main` como produção. A versão do Postgres é a padrão do Neon. As migrações são SQL comum e não dependem do Postgres 18 local.
- **Duas URLs**:
  - `DATABASE_URL` é a URL com pooler (`-pooler`), usada pela aplicação;
  - `DATABASE_URL_UNPOOLED` é a URL direta, usada pelo `drizzle-kit migrate`, porque o pooler em modo transação não serve para migrações.
- **Por quê São Paulo**: as funções ficam em `gru1` (Y3), e cada consulta fica na mesma região.

### Y2. Ajustes no código

- **E-mail**: dentro do `sendResetPassword`, a promessa do envio passa por `waitUntil` de `@vercel/functions`. A resposta continua sem esperar o envio (design P3, contra ataques de tempo), mas a Vercel mantém a função viva até o envio terminar. Fora da Vercel (no `next dev` e nos testes), o `waitUntil` não encontra contexto e a promessa segue sozinha, como hoje.
  - **Alternativa**: `advanced.backgroundTasks.handler: waitUntil`, que vale para todas as tarefas do Better Auth. O próprio Better Auth avisa que isso introduz consistência eventual. Fica mais localizado no envio.
- **Rate limit**: `rateLimit.storage: "database"`. A tabela `rateLimit` é gerada por `npm run auth:generate` e migrada pelo Drizzle (migração 0003).
  - **IP do cliente**: `advanced.ipAddress.ipAddressHeaders: ["x-forwarded-for"]`. A Vercel sobrescreve esse cabeçalho com o IP real, e o cliente não consegue forjá-lo. Em desenvolvimento, sem o cabeçalho, o Better Auth segue com o comportamento atual.
  - **Testes**: os de integração continuam mandando `x-forwarded-for` e passam a contar no banco. O `resetDatabase` passa a limpar a tabela `rateLimit`.
- **Pool**: `attachDatabasePool(pool)` logo depois de criar o `Pool` em `getPool()`. Fora da Vercel, a chamada não faz nada.
- **Datas**: os dois formatadores ganham `timeZone: "America/Sao_Paulo"`. A constante `APP_TIME_ZONE` fica em `src/lib/time.ts`, com um teste unitário de uma data às 01:10 UTC formatada como 22:10 do dia anterior.

### Y3. Vercel: projeto ligado ao Git, região `gru1`, só produção

- **Projeto**: `dnd-sheet` no time "Cleyson de Sousa Lima's projects", ligado a `CleysonPH/dnd-sheet`, framework Next.js e branch de produção `main`.
- **Região**: `regions: ["gru1"]` num `vercel.json` versionado.
- **Build**: um script `vercel-build`, que a Vercel usa no lugar do `build`, executa `scripts/vercel-build.mjs`:
  - com `VERCEL_ENV=production`, roda `drizzle-kit migrate` com a URL direta e depois `next build`;
  - nos outros ambientes, só `next build`.

  Se a migração sair com erro, o script sai com erro, o deploy falha e o alias de produção continua na versão anterior (spec "Migrações antes da nova versão").
- **Variáveis de ambiente**, só no ambiente Production:
  - `DATABASE_URL` e `DATABASE_URL_UNPOOLED`;
  - `BETTER_AUTH_SECRET`, gerado na hora com `openssl rand -base64 32`;
  - `BETTER_AUTH_URL`, com o endereço de produção;
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` e `MAIL_FROM`.
- **Previews**: ficam sem as variáveis do banco e do auth, então falham na primeira requisição e não tocam a produção.
- **Segredos**:
  - as URLs do banco e o `BETTER_AUTH_SECRET` passam do MCP do Neon (ou do `openssl`) direto para o MCP da Vercel, sem aparecer na conversa;
  - a senha SMTP é gravada pelo próprio usuário no painel da Vercel. O agente cria a variável vazia e informa onde preencher.
- **Por quê `vercel-build`, e não um passo de CI**: a migração fica no mesmo deploy que precisa dela, sem um segundo sistema. O `drizzle-kit` está nas `devDependencies`, que a Vercel instala no build.

### Y4. Limpeza do caminho por containers

- **Saem**:
  - o `Dockerfile` e o `.dockerignore`;
  - o `output: "standalone"` do `next.config.ts`;
  - os serviços `migrate` e `app` do `compose.yaml`, com o profile `prod`.
- **Ficam**: o `db` e o `mailpit`, para o desenvolvimento e os testes.
- O README troca a seção de "produção com Docker" pela de deploy na Vercel.
- **Por quê remover**: um segundo caminho de produção sem uso tende a quebrar em silêncio. O histórico do Git guarda a versão com containers, se um dia ela for necessária.

### Y5. Primeiro admin e verificação em produção

- O `npm run db:seed` roda uma vez, da máquina de desenvolvimento, com `DATABASE_URL` apontando para o Neon (a URL direta), passada só no ambiente do comando. Nada disso é gravado no `.env`.
- Depois do seed, o usuário entra em produção, troca a senha e corrige o e-mail do admin para um endereço real.
- **Verificação**:
  - login;
  - "Esqueci a senha" com um e-mail real, que precisa chegar;
  - criar uma ficha;
  - abrir o link compartilhado numa aba anônima;
  - a data da lista no horário de Brasília;
  - 6 tentativas de login erradas seguidas, com a última recusada.

### Y6. Recuperação de dados com o histórico do Neon

- **Janela**: o histórico de 6 horas do plano free.
- **Procedimento no README**:
  - criar um branch a partir do momento desejado (instant restore) e conferir os dados nele;
  - depois, ou restaurar o `main` para aquele momento, ou copiar só o que falta.
- **Ensaio**, feito durante a change e sem alterar o `main`: um branch do momento de 1 hora atrás, a contagem das fichas nele e a exclusão do branch.
- **Divergência do roadmap**: registrada na D1 de `dnd-sheet-architecture`. A tarefa 4.1 pedia `pg_dump` para fora do servidor.

## Risks / Trade-offs

- **[Conta do Neon perdida ou bloqueada leva todos os dados]** → Aceito pelo usuário (Y6). Um `pg_dump` manual, guardado fora do repositório, continua possível a qualquer momento, e o README mostra o comando.
- **[Erro percebido depois de 6 horas]** → Não tem recuperação no plano free. O README deixa a janela explícita.
- **[Neon com scale-to-zero: a primeira requisição depois de um tempo parado demora]** → Aceitável para uma mesa de RPG. O compute acorda em cerca de 1 segundo.
- **[Limite de conexões do pooler]** → Com poucos usuários, a URL com pooler e o `attachDatabasePool` ficam muito longe do limite.
- **[O SMTP do provedor recusa ou marca como spam]** → Testado na verificação (Y5). O admin pode redefinir a senha pela área de Contas como alternativa.
- **[Migração destrutiva no futuro]** → Fora do escopo. As migrações atuais só acrescentam, e o instant restore cobre um erro percebido dentro das 6 horas.

## Migration Plan

1. Fazer os ajustes de código (Y2, Y4) e verificar localmente.
2. Criar o projeto no Neon (Y1) e o projeto na Vercel (Y3), cada um com a confirmação do usuário.
3. O usuário grava a senha SMTP. Depois vem o primeiro deploy, que aplica as migrações 0000 a 0003 no Neon.
4. Rodar o seed (Y5) e fazer a verificação em produção.
5. Fazer o ensaio de restauração (Y6).
6. **Rollback**: promover um deploy anterior na Vercel (instantâneo) e, se o banco foi afetado, usar o instant restore do Neon.
