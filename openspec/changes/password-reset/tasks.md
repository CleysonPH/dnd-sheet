# Tasks

## 1. Envio de e-mail e Mailpit

- [ ] 1.1 Acrescentar o serviço `mailpit` com versão fixa ao `compose.yaml`, no profile `dev` e com as portas `127.0.0.1:1025` e `127.0.0.1:8025`, e as variáveis `SMTP_*` e `MAIL_FROM` do Mailpit ao `.env.example` e ao `.env` local (P8). Verificar que `docker compose --profile dev up -d` sobe o `db` e o Mailpit, que `http://localhost:8025` abre e que `docker compose --profile prod config --services` não lista o `mailpit`
- [ ] 1.2 Instalar o `nodemailer` e criar o esquema `getMailEnv()` em `src/lib/env.ts`, `src/server/mail/` com `sendMail` e o conteúdo do e-mail de redefinição em `password-reset.ts` (P1). Testes unitários: variáveis faltando, usuário sem senha e assunto, texto e link do e-mail. Verificar que `npm test` passa
- [ ] 1.3 Acrescentar as variáveis SMTP ao `env` do projeto `integration`, a checagem do Mailpit no `global-setup.ts` e o helper `src/server/test/mailpit.ts` (`clearMailbox`, `waitForMessage` e `extractResetToken`) (P8). Escrever um teste de integração que envia um e-mail pelo `sendMail` e o lê no Mailpit. Atualizar o README: Mailpit, novo comando do Compose e testes de integração. Verificar que `npm run test:int` passa e que, com o Mailpit parado, falha com a instrução de subi-lo

## 2. Redefinição de senha no servidor

- [ ] 2.1 Configurar o Better Auth (P2, P3, P5, P6). São cinco ajustes: `sendResetPassword` com o link `/redefinir-senha?token=…`, envio sem `await` e nada para conta desativada; `resetPasswordTokenExpiresIn: 3600`; `revokeSessionsOnPasswordReset`; `onPasswordReset` concluindo a troca pendente; o limite de 3 pedidos por minuto no `/request-password-reset` e o `GET /reset-password/:token` em `DISABLED_PATHS`. Escrever testes de integração pela API HTTP:
  - Lyra pede o link com `Lyra@Mesa.com` e recebe o e-mail;
  - e-mail inexistente recebe a mesma resposta e nada é enviado;
  - a redefinição troca a senha, encerra as sessões e conclui a troca pendente;
  - o link usado de novo e o link expirado são recusados;
  - uma senha de 7 caracteres é recusada e o link continua valendo;
  - o 4º pedido em 1 minuto é recusado.

  Verificar que `npm run test:int` passa
- [ ] 2.2 Criar o `revokePasswordResetLinks` e chamá-lo no `deactivateAccount` (P4). Escrever testes de integração: conta desativada não recebe o e-mail, e um link pedido antes da desativação é recusado depois de desativar e reativar. Verificar que `npm run test:int` passa
- [ ] 2.3 Fazer um teste de falha no envio: com o SMTP apontando para uma porta fechada, o pedido devolve a mesma resposta e o erro vai para o log (P3). Verificar que `npm run test:int` passa

## 3. Páginas de recuperação

- [ ] 3.1 Liberar no `proxy.ts` os `PUBLIC_PATHS` `/login`, `/esqueci-senha` e `/redefinir-senha` sem sessão, redirecionando para `/` quem tem sessão (P6). Atualizar o teste de integração do proxy ou dos guards, se houver um que cubra a lista. Verificar no navegador, sem sessão, que as duas páginas abrem e que `/` leva ao login; e, com sessão, que as duas levam a `/`
- [ ] 3.2 Criar `/esqueci-senha` com o formulário de e-mail, a mensagem padrão e a mensagem de excesso de tentativas, e o link "Esqueci a senha" no login (P6). Verificar no navegador que o pedido de Lyra chega ao Mailpit, que um e-mail inexistente mostra a mesma mensagem e que o 4º pedido seguido mostra "Muitas tentativas"
- [ ] 3.3 Criar `/redefinir-senha` com a nova senha, a validação pelo `passwordSchema`, "Link inválido ou expirado" com "Pedir um novo link", e o retorno ao login com "Senha redefinida. Entre com a nova senha." (P5, P6). Verificar no navegador o caminho completo pelo link do Mailpit: Lyra redefine, entra com a nova senha e cai na página inicial; o mesmo link de novo é recusado; uma senha de 7 caracteres é recusada; e a página sem `token` mostra o erro. Conferir também a 375 px e nos dois temas

## 4. Alteração de e-mail pelo admin

- [ ] 4.1 Implementar o `updateAccountEmail` em `src/server/accounts/service.ts` com a validação, a unicidade, `emailVerified = false` e o `revokePasswordResetLinks`, permitindo a própria conta (P7). Escrever testes de integração:
  - `lyra@mesa.local` muda para `lyra@gmail.com` e o login com o e-mail antigo é recusado;
  - o admin altera o próprio e-mail e a sessão continua;
  - `Thorin@Mesa.com` é recusado por já estar em uso;
  - `lyra@` é recusado;
  - um usuário comum é recusado;
  - um link pedido antes da alteração passa a ser recusado.

  Verificar que `npm run test:int` passa
- [ ] 4.2 Acrescentar à linha da conta em `/admin/contas` a ação "Alterar e-mail", com formulário em linha, inclusive na linha do próprio admin (P7). Verificar no navegador a alteração do e-mail de uma conta de teste, a mensagem de e-mail em uso e a alteração do e-mail do Mestre, e conferir a 375 px

## 5. Configuração de produção e verificação final

- [ ] 5.1 Passar `SMTP_*` e `MAIL_FROM` ao serviço `app` do `compose.yaml`, com `:?` nas obrigatórias (P9), e completar o README com a tabela de variáveis e o fluxo "Esqueci a senha". Verificar que `docker compose --profile prod config` falha sem `SMTP_HOST` e passa com ele
- [ ] 5.2 Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check` e verificar que todos passam
