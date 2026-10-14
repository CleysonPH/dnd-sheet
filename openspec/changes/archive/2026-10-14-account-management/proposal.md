# Proposal

## Why

Nenhuma outra capacidade (fichas, motor, recursos) pode existir sem saber quem é o usuário e o que ele pode fazer. A aplicação é de uso interno e não tem cadastro público, então o acesso é controlado inteiramente pelo admin: ele cria as contas, entrega uma senha provisória e ativa ou desativa o acesso. Esta change implementa a decisão D8 de `dnd-sheet-architecture`.

## What Changes

- Login por e-mail e senha, logout e sessões persistidas no banco. Não existe cadastro público.
- Troca de senha obrigatória no primeiro acesso e sempre que o admin redefinir a senha; até trocar, o usuário não acessa mais nada.
- O usuário pode trocar a própria senha a qualquer momento.
- Área de administração de contas, só para admins:
  - listar contas, com estado (ativa/desativada) e papel;
  - criar conta (nome, e-mail), gerando uma senha provisória exibida uma única vez;
  - desativar e reativar contas. Desativar encerra as sessões abertas, e a conta não consegue mais entrar. Contas não são excluídas;
  - redefinir a senha de uma conta (nova senha provisória);
  - promover uma conta a admin e rebaixar um admin a usuário.
- Proteções: o sistema nunca fica sem um admin ativo, e um admin não pode desativar nem rebaixar a própria conta.
- O admin também é um usuário comum: terá fichas próprias quando a capacidade de fichas existir.
- Script de seed que cria o primeiro admin a partir de variáveis de ambiente.
- Introduz a camada de banco de dados do projeto (biblioteca de acesso e migrações), usada pelas próximas capacidades.

Fora do escopo: recuperação de senha por e-mail, verificação de e-mail, login social, 2FA, exclusão de contas, edição de nome/e-mail pelo admin e log de auditoria.

## Capabilities

### New Capabilities

- `authentication`: login, logout, sessões, troca da própria senha e o bloqueio de acesso enquanto houver troca de senha pendente.
- `account-management`: administração de contas pelo admin (criar, listar, desativar, reativar, redefinir senha, alterar papel), as proteções do último admin e o seed do primeiro admin.

O roadmap em `dnd-sheet-architecture` listava tudo isso como uma capacidade só, `account-management`. A separação deixa a autenticação, da qual todas as outras capacidades dependem, com uma spec própria e enxuta.

### Modified Capabilities

Nenhuma (ainda não há specs no projeto).

## Impact

- Novas dependências: `better-auth`, `drizzle-orm`, `drizzle-kit` e o driver `pg`.
- Novas variáveis de ambiente: segredo e URL base da autenticação, e as credenciais do admin inicial para o seed.
- Novas tabelas no Postgres: usuários, sessões, contas de credencial e verificações (schema do Better Auth).
- Novas rotas: login, troca de senha, área de contas do admin, o handler HTTP da autenticação e um `proxy.ts` que redireciona quem não está logado.
- `src/server/` passa a conter o acesso ao banco e a configuração da autenticação.
- Uma página inicial provisória para usuários logados, que será substituída pela lista de fichas na change `character-sheets`.
