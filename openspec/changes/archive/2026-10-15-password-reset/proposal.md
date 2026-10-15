# Proposal

## Why

Hoje, só o admin redefine senhas, e só as de outras contas. Um jogador que esquece a senha depende do admin. Se o único admin esquecer a própria senha, a aplicação não tem saída: a área de Contas recusa a ação sobre a própria conta e o seed não altera uma conta que já existe. Um link de redefinição enviado por e-mail resolve os dois casos sem depender de ninguém. Ele precisa existir antes do deploy (tarefa 4.1 do roadmap), que vai receber a configuração de envio.

## What Changes

- **"Esqueci a senha"** na página de login. A pessoa informa o e-mail e a resposta é sempre a mesma, exista a conta ou não. Se a conta existir e estiver ativa, ela recebe um link de redefinição.
- **Página de redefinição pelo link.** O link vale 1 hora e serve uma vez. A nova senha segue as regras da troca de senha. Ao redefinir, todas as sessões da conta são encerradas, a troca obrigatória pendente some e a pessoa volta ao login.
- **Conta desativada não recupera a senha.** Ela não recebe o link, e um link enviado antes da desativação para de funcionar.
- **Limite de pedidos**, por endereço, contra abuso do envio.
- **Alterar e-mail de uma conta** na área de Contas, inclusive o do próprio admin. Sem isso, as contas criadas com e-mail fictício nunca recebem o link. Links pendentes do e-mail antigo deixam de valer.
- **Envio de e-mail por SMTP genérico**, configurado por variáveis de ambiente. Em desenvolvimento e nos testes de integração, o envio vai para um Mailpit local, que sobe pelo Compose com um profile próprio.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `authentication`:
  - **Páginas protegidas exigem sessão**: as páginas de pedido e de redefinição de senha passam a abrir sem sessão, como o login.
  - Novos requisitos: pedido de redefinição por e-mail, redefinição pelo link, conta desativada sem recuperação e limite de pedidos.
- `account-management`: novo requisito "Alterar e-mail".

## Impact

- **Dependência nova**: `nodemailer`.
- **Variáveis de ambiente novas**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` e `MAIL_FROM`. Entram no `.env.example`, na validação de ambiente, no `compose.yaml` (serviço `app`) e no README.
- **Better Auth** (`src/server/auth/config.ts`): envio do link, validade do link, encerramento de sessões na redefinição, limite de pedidos e o fim da troca pendente depois da redefinição.
- **Páginas novas** `/esqueci-senha` e `/redefinir-senha`, liberadas sem sessão no `proxy.ts`. Link "Esqueci a senha" no login.
- **Contas** (`src/server/accounts/service.ts` e a área `/admin/contas`): alteração de e-mail, e os links pendentes apagados ao desativar a conta ou alterar o e-mail.
- **Compose**: serviço `mailpit` no profile `dev`.
- **Testes de integração**: passam a exigir o Mailpit rodando, além do Postgres. Leem os e-mails pela API do Mailpit.
- **Deploy (4.1)**: precisa configurar um provedor SMTP real, e `BETTER_AUTH_URL` precisa ser a URL pública, porque o link é montado a partir dela.
