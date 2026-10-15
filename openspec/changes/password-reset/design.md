# Design

## Context

A autenticação usa o Better Auth 1.7.8 com e-mail e senha e o plugin `admin` (design A1 de `account-management`). Os pontos que esta change toca:

- **Configuração** (`src/server/auth/config.ts`): cadastro público desligado, `cookieCache` desligado, limite de 5 logins por minuto no `/sign-in/email` e uma lista `DISABLED_PATHS` que desliga os endpoints HTTP do admin.
- **Contas desativadas**: são `banned` do plugin admin.
- **Troca obrigatória pendente**: é o campo `mustChangePassword`.
- **Contas** (`src/server/accounts/service.ts`): todas as ações de admin passam por funções que conferem `requireAdmin`. As ações sobre outra conta passam também por `resolveTarget`, que recusa a própria conta.
- **Proxy** (`proxy.ts`): sem sessão, só libera `/login`.
- **Não existe envio de e-mail.**

O Better Auth já tem o fluxo de redefinição. Conferido no código da versão instalada (`dist/api/routes/password.mjs`):

- `POST /request-password-reset` procura o usuário pelo e-mail já em minúsculas. Se ele existe, grava na tabela `verification` um registro `identifier = "reset-password:<token>"`, `value = <userId>`, com validade `resetPasswordTokenExpiresIn` (padrão de 1 hora). Depois chama `sendResetPassword({ user, url, token })` e devolve sempre a mesma resposta. Para e-mail inexistente, simula o trabalho para não revelar a diferença pelo tempo de resposta.
- `GET /reset-password/:token` confere o token e redireciona para um `callbackURL`.
- `POST /reset-password` confere o token e a validade, troca a senha e consome o token. Com `revokeSessionsOnPasswordReset`, encerra as sessões. Depois chama `onPasswordReset({ user })`.
- Sem um `backgroundTasks.handler` configurado, o `sendResetPassword` é aguardado. Um envio lento atrasaria só a resposta de quem existe.

Motivação: proposal.md. Comportamento: `specs/authentication` e `specs/account-management`.

## Goals / Non-Goals

**Goals:**
- Reaproveitar o fluxo do Better Auth e manter do nosso lado só o envio, as regras de conta desativada e o fim da troca pendente.
- Isolar o envio de e-mail num módulo pequeno, trocável por configuração e testável contra um SMTP real (o Mailpit).

**Non-Goals:**
- O usuário alterar o próprio e-mail em `/conta`. Isso exigiria confirmar o novo endereço e fica para depois. Por enquanto, só o admin altera e-mails.
- Verificação de e-mail no cadastro (`requireEmailVerification`). As contas continuam nascendo pelo admin.
- Fila ou repetição de envios. Uma falha vai para o log, e a pessoa pede de novo.
- E-mail em HTML elaborado ou com marca. Basta um texto simples com uma versão HTML mínima.

## Decisions

### P1. Envio de e-mail em `src/server/mail/` com `nodemailer`

- `sendMail({ to, subject, text, html })` usa um transporte SMTP criado de forma preguiçosa a partir do ambiente, como o `getDb()`. O conteúdo do e-mail de redefinição fica em `src/server/mail/password-reset.ts`, uma função pura testada por teste unitário: assunto "Redefinir senha · Ficha D&D", o link e o aviso de que ele vale 1 hora.
- **Variáveis de ambiente**, num esquema próprio em `src/lib/env.ts`:
  - obrigatórias: `SMTP_HOST`, `SMTP_PORT` e `MAIL_FROM`;
  - opcionais: `SMTP_SECURE` (`true` para TLS direto na porta 465) e `SMTP_USER`/`SMTP_PASSWORD`, que precisam vir juntos.

  O esquema é lido por `getMailEnv()` na criação do transporte, separado do `getEnv()`. O `getEnv()` é usado também pelo seed e pelo `migrate` (via `getAuth()` e `getDb()`), que não enviam e-mail e não devem exigir SMTP. Em produção, o `compose.yaml` exige as variáveis no serviço `app` (P9), então uma configuração incompleta falha já no `docker compose up`.
- **Por quê `nodemailer`**: atende qualquer provedor por SMTP (Gmail com senha de app, Brevo, Resend, Mailgun) sem prender a aplicação a um SDK. Decisão do usuário na exploração.
- **Alternativa**: a API HTTP de um provedor, como o Resend. Exige domínio verificado e prende a um fornecedor.

### P2. Link montado por nós, apontando para `/redefinir-senha?token=…`

- O `sendResetPassword` ignora o `url` do Better Auth, que passa por `GET /api/auth/reset-password/:token` e por um redirecionamento. Em vez disso, monta `${BETTER_AUTH_URL}/redefinir-senha?token=<token>`. O `GET /reset-password/:token` entra em `DISABLED_PATHS`.
- **Por quê**: o link vai direto à página, sem `callbackURL` nem verificação de origem. A página só valida o token ao enviar o formulário, e o `POST /reset-password` já trata os casos de token inválido, expirado ou usado.
- **Alternativa**: usar o `url` padrão com `redirectTo`. São dois saltos a mais, e o erro chega como `?error=INVALID_TOKEN`.

### P3. Envio sem aguardar e com falha só no log

- Dentro do `sendResetPassword`, a chamada é `void sendMail(...).catch(log)`, sem `await`, como recomenda a documentação do Better Auth.
- **Por quê**: assim a resposta leva o mesmo tempo para conta existente e inexistente, e uma falha de SMTP não muda a resposta (spec "Falha no envio"). Num servidor Node de longa duração, a promessa termina mesmo depois da resposta.
- **Alternativa**: configurar `advanced.backgroundTasks.handler`. Tem o mesmo efeito, mas vale para todas as tarefas do Better Auth. Fica mais localizado no callback.

### P4. Conta desativada: não envia e apaga os links pendentes

- O `sendResetPassword` não envia nada quando `user.banned` é verdadeiro. O token chega a ser gravado, mas ninguém o recebe.
- Uma função `revokePasswordResetLinks(userId)` em `src/server/accounts/` apaga da tabela `verification` os registros com `identifier LIKE 'reset-password:%'` e `value = userId`. Ela é chamada por `deactivateAccount` e pela alteração de e-mail (P7). Como a desativação apaga os links e a conta desativada não recebe novos, uma conta reativada não tem nenhum link antigo valendo.
- **Por quê**: não depende de interceptar o `POST /reset-password`. O formato do registro foi conferido no código da versão instalada e um teste de integração o protege numa atualização.
- **Alternativa**: um hook `before` no `/reset-password` que procura o usuário do token e recusa os banidos. Dá mais código acoplado ao interno do Better Auth para cobrir o mesmo caso.

### P5. Depois da redefinição: sessões encerradas e troca pendente concluída

- `revokeSessionsOnPasswordReset: true` e `resetPasswordTokenExpiresIn: 3600`.
- O `onPasswordReset` grava `mustChangePassword = false`. A pessoa acabou de escolher a própria senha, então pedir outra troca não faz sentido.
- A página não cria sessão: depois de redefinir, leva ao `/login` com a mensagem "Senha redefinida. Entre com a nova senha."

### P6. Páginas, proxy e limite de pedidos

- **Páginas**: `/esqueci-senha` e `/redefinir-senha`, fora do grupo `(app)`, com o `AuthCard`, como `/login` e `/trocar-senha`. Os formulários são Client Components que usam `authClient.requestPasswordReset` e `authClient.resetPassword`, como o login usa `authClient.signIn.email`. Tudo passa pela API HTTP do Better Auth e, portanto, pelo limite de pedidos. O e-mail é normalizado (trim e minúsculas) antes do envio.
- **Mensagens de erro**:
  - `INVALID_TOKEN` e `/redefinir-senha` sem `token` mostram "Link inválido ou expirado", com o link "Pedir um novo link";
  - os erros de tamanho de senha usam o mesmo `passwordSchema` de `src/server/auth/password.ts`, validado antes do envio;
  - o erro 429 mostra "Muitas tentativas. Tente de novo em alguns instantes."
- **Proxy**: uma lista `PUBLIC_PATHS = ["/login", "/esqueci-senha", "/redefinir-senha"]`. Sem sessão, esses caminhos passam. Com sessão, redirecionam para `/`, como o login já faz hoje.
- **Login**: ganha o link "Esqueci a senha".
- **Limite**: `customRules["/request-password-reset"] = { window: 60, max: 3 }`. O `POST /reset-password` fica com o limite padrão do Better Auth, porque o token tem 24 caracteres aleatórios e não dá para adivinhar.

### P7. Alteração de e-mail pelo admin

- `updateAccountEmail(headers, userId, email)` em `src/server/accounts/service.ts`:
  - confere `requireAdmin`, mas **não** passa pelo `resolveTarget`, que recusa a própria conta: alterar o e-mail não muda o acesso (spec "Admin altera o próprio e-mail");
  - valida o e-mail com o mesmo esquema de `createAccountSchema` (trim, minúsculas, formato) e confere se ele já está em uso por outra conta;
  - grava o novo e-mail direto pelo Drizzle, com `emailVerified = false`, e chama `revokePasswordResetLinks(userId)`;
  - devolve `EMAIL_IN_USE`, `INVALID_INPUT` ou `NOT_FOUND`, como as outras funções.
- **Interface**: na linha da conta em `/admin/contas`, uma ação "Alterar e-mail" abre um formulário em linha com o e-mail atual preenchido, "Salvar" e "Cancelar", no mesmo estilo da senha provisória mostrada em linha. Ela aparece também na linha do próprio admin.
- **Por quê Drizzle direto**: o `adminUpdateUser` do plugin aceita qualquer campo, e a regra de unicidade ficaria do mesmo jeito do nosso lado. Gravar direto deixa a regra num lugar só.

### P8. Mailpit no Compose e nos testes

- **Serviço `mailpit`** (`axllent/mailpit`, versão fixa) no `compose.yaml`, com `profiles: ["dev"]` e as portas `127.0.0.1:1025` (SMTP) e `127.0.0.1:8025` (interface web e API). O `--profile prod` da VPS não o sobe. Em desenvolvimento, o comando passa a ser `docker compose --profile dev up -d`, que sobe o `db` e o Mailpit.
- **`.env.example`**: `SMTP_HOST=localhost`, `SMTP_PORT=1025` e `MAIL_FROM="Ficha D&D <ficha@localhost>"`, sem usuário nem senha.
- **Testes de integração**: as variáveis SMTP entram no `env` do projeto `integration` do `vitest.config.ts`, apontando para o Mailpit. O `global-setup.ts` confere se `http://localhost:8025/api/v1/info` responde e, se não, falha com a instrução de subir o Compose, como já faz com o Postgres. Um helper em `src/server/test/mailpit.ts` traz:
  - `clearMailbox()`, para limpar a caixa;
  - `waitForMessage(to)`, que consulta `/api/v1/search?query=to:<email>` por até 5 segundos, porque o envio não é aguardado (P3);
  - `extractResetToken(message)`.
- **Por quê**: os testes passam pelo transporte SMTP real e pela formatação do e-mail, e não por um transporte falso que esconderia erros de configuração.

### P9. Serviço `app` e documentação

- **`compose.yaml`**: o serviço `app` recebe `SMTP_*` e `MAIL_FROM`, com `:?` nas obrigatórias, como o `BETTER_AUTH_SECRET`. O `migrate` não as recebe, porque o seed não envia e-mail e o `getEnv()` não as exige (P1).
- **README**:
  - as variáveis novas;
  - o Mailpit (`http://localhost:8025`) e o novo comando do Compose;
  - o fluxo de "Esqueci a senha";
  - o aviso de que os testes de integração precisam do Mailpit.

## Risks / Trade-offs

- **[Formato interno do token do Better Auth muda numa atualização]** → O P4 depende de `identifier = "reset-password:<token>"` e `value = userId`. Um teste de integração pede um link, desativa a conta e confere que o link é recusado. Ele quebra se o formato mudar.
- **[E-mail cai no spam ou o provedor recusa o envio]** → Fica fora do controle da aplicação. O deploy (4.1) documenta o uso de um provedor com SPF/DKIM ou do Gmail com senha de app. O "Redefinir senha" pelo admin continua como alternativa.
- **[Limite por IP atrás de proxy reverso]** → Atrás do proxy da VPS, todos os pedidos podem parecer vir do mesmo IP, e o limite passaria a valer para todos juntos. O deploy (4.1) precisa configurar o cabeçalho de IP do cliente (`advanced.ipAddress`) e testar o limite. O limite de login já tem a mesma dependência.
- **[SMTP faltando em desenvolvimento só aparece no primeiro pedido de link]** → O `getMailEnv()` lança um erro com o nome da variável que falta. Como o envio não é aguardado (P3), esse erro vai para o log e a página mostra a mensagem padrão. O README e o `.env.example` trazem os valores do Mailpit, e em produção o Compose exige as variáveis antes de subir.
- **[Envio não aguardado e perdido se o processo cair logo depois da resposta]** → É raro e aceitável: a pessoa pede o link de novo.
- **[Links válidos por 1 hora em uma caixa de e-mail comprometida]** → É o mesmo risco de qualquer recuperação por e-mail. A redefinição encerra todas as sessões, então quem tinha acesso perde.

## Migration Plan

- Não há migração de banco: a tabela `verification` já existe pelo schema do Better Auth.
- **Desenvolvimento**: acrescentar as variáveis SMTP ao `.env`, rodar `docker compose --profile dev up -d` e, depois, corrigir pela área de Contas os e-mails fictícios, como o do Mestre.
- **Produção**: entra junto com a change `deployment`, com um provedor SMTP real.
- **Rollback**: reverter o código. Os registros `reset-password:*` que sobrarem na `verification` expiram sozinhos e não afetam nada.
