# account-management Specification

## Purpose

Permite que admins controlem quem tem acesso à aplicação: criar contas com senha provisória, desativar e reativar acesso, redefinir senhas e definir quem é admin, sem nunca deixar o sistema sem um admin ativo.

## Requirements

### Requirement: Área de contas restrita a admins
A área de administração de contas e todas as suas operações SHALL estar disponíveis apenas para usuários com papel admin.

#### Scenario: Admin abre a área de contas
- **WHEN** um admin abre a área de contas
- **THEN** vê a lista de contas e as ações de administração

#### Scenario: Usuário comum tenta abrir a área de contas
- **WHEN** um usuário comum abre o endereço da área de contas
- **THEN** recebe uma página de "não encontrado" e nenhuma informação de contas é exibida

#### Scenario: Usuário comum chama uma operação de admin
- **WHEN** um usuário comum chama diretamente uma operação de administração de contas
- **THEN** a operação é recusada e nada é alterado

#### Scenario: Atalho visível só para admins
- **WHEN** um usuário comum navega pela aplicação
- **THEN** não vê nenhum link para a área de contas

### Requirement: Listar contas
O admin SHALL ver todas as contas, cada uma com nome, e-mail, papel, estado (ativa ou desativada) e data de criação.

#### Scenario: Lista com contas ativas e desativadas
- **WHEN** existem 3 contas ativas e 1 desativada e o admin abre a área de contas
- **THEN** as 4 contas aparecem, com a desativada identificada como tal

### Requirement: Criar conta
O admin SHALL poder criar uma conta informando nome e e-mail. A conta nasce ativa, com papel de usuário comum, com uma senha provisória gerada pelo sistema e com troca de senha obrigatória pendente.

#### Scenario: Conta criada
- **WHEN** o admin cria uma conta com nome "Lyra" e e-mail "lyra@mesa.com"
- **THEN** a conta aparece na lista como ativa e usuário comum, e o admin vê a senha provisória gerada

#### Scenario: Primeiro acesso da conta criada
- **WHEN** Lyra entra pela primeira vez com a senha provisória
- **THEN** é obrigada a trocar a senha antes de usar a aplicação

#### Scenario: E-mail já cadastrado
- **WHEN** o admin tenta criar uma conta com um e-mail que já existe, em qualquer combinação de maiúsculas e minúsculas
- **THEN** a criação é recusada com a indicação de que o e-mail já está em uso

#### Scenario: Dados inválidos
- **WHEN** o admin tenta criar uma conta com nome vazio ou e-mail em formato inválido
- **THEN** a criação é recusada e o campo com problema é indicado

### Requirement: Senha provisória
Toda senha provisória SHALL ser gerada aleatoriamente pelo sistema, com pelo menos 12 caracteres, e SHALL ser exibida ao admin uma única vez, no momento em que é gerada. O sistema SHALL NOT permitir consultá-la depois.

#### Scenario: Senha exibida uma vez
- **WHEN** o admin cria uma conta, vê a senha provisória e recarrega a página
- **THEN** a senha provisória não aparece mais em lugar nenhum

#### Scenario: Senhas diferentes a cada geração
- **WHEN** o admin cria duas contas seguidas
- **THEN** as duas senhas provisórias são diferentes

### Requirement: Desativar conta
O admin SHALL poder desativar uma conta. A desativação SHALL encerrar imediatamente todas as sessões da conta e impedir novos logins. As fichas e os dados da conta SHALL ser preservados.

#### Scenario: Conta desativada durante o uso
- **WHEN** o admin desativa a conta de Lyra enquanto ela está usando a aplicação
- **THEN** a próxima ação de Lyra a leva à página de login

#### Scenario: Login depois de desativada
- **WHEN** Lyra tenta entrar depois de ter a conta desativada
- **THEN** o login é recusado com a mensagem de conta desativada

### Requirement: Reativar conta
O admin SHALL poder reativar uma conta desativada. Depois de reativada, a conta SHALL voltar a entrar com a senha que tinha e com todos os seus dados.

#### Scenario: Conta reativada
- **WHEN** o admin reativa a conta de Lyra
- **THEN** Lyra consegue entrar com a mesma senha de antes e encontra as fichas que tinha

### Requirement: Contas não são excluídas
O sistema SHALL NOT oferecer exclusão de contas. Desativar é a única forma de remover o acesso de alguém.

#### Scenario: Ações disponíveis para uma conta
- **WHEN** o admin vê as ações de uma conta
- **THEN** não há ação de excluir

### Requirement: Redefinir senha
O admin SHALL poder redefinir a senha de outra conta. A redefinição SHALL gerar uma nova senha provisória, encerrar todas as sessões da conta e deixar a troca de senha obrigatória pendente.

#### Scenario: Jogador esqueceu a senha
- **WHEN** o admin redefine a senha de Lyra
- **THEN** o admin vê a nova senha provisória, a senha antiga deixa de funcionar e Lyra precisa trocar a senha ao entrar

#### Scenario: Sessões encerradas na redefinição
- **WHEN** o admin redefine a senha de Lyra enquanto ela está logada
- **THEN** a próxima ação de Lyra a leva à página de login

### Requirement: Alterar papel
O admin SHALL poder promover um usuário comum a admin e rebaixar um admin a usuário comum. A mudança SHALL valer a partir da próxima ação da conta afetada.

#### Scenario: Promover a admin
- **WHEN** o admin promove Lyra a admin
- **THEN** na próxima ação Lyra tem acesso à área de contas

#### Scenario: Rebaixar um admin
- **WHEN** um admin rebaixa outro admin a usuário comum
- **THEN** na próxima ação a conta rebaixada perde o acesso à área de contas

### Requirement: Admin não altera o próprio acesso
Um admin SHALL NOT poder desativar, rebaixar nem redefinir a senha da própria conta pela área de contas. Isso garante que o sistema sempre tenha ao menos um admin ativo: o que está agindo.

#### Scenario: Tentativa de se desativar
- **WHEN** um admin tenta desativar a própria conta
- **THEN** a operação é recusada e a conta continua ativa

#### Scenario: Tentativa de se rebaixar
- **WHEN** um admin tenta rebaixar a própria conta
- **THEN** a operação é recusada e a conta continua admin

#### Scenario: Ações na própria linha da lista
- **WHEN** o admin vê a própria conta na lista
- **THEN** as ações de desativar, rebaixar e redefinir senha não estão disponíveis para ela

### Requirement: Admin também é usuário
Uma conta admin SHALL ter tudo o que um usuário comum tem, incluindo as próprias fichas, além da área de contas.

#### Scenario: Admin usa a aplicação como jogador
- **WHEN** um admin entra na aplicação
- **THEN** tem acesso às mesmas páginas de um usuário comum e também à área de contas

### Requirement: Seed do primeiro admin
O sistema SHALL oferecer um comando de instalação que cria um admin a partir de nome, e-mail e senha fornecidos por variáveis de ambiente. O admin criado SHALL ter troca de senha obrigatória pendente. O comando SHALL NOT alterar nada se o e-mail já existir.

#### Scenario: Primeira instalação
- **WHEN** o comando de seed roda num banco sem contas, com as variáveis definidas
- **THEN** é criado um admin ativo com aquele e-mail, que precisa trocar a senha no primeiro login

#### Scenario: Seed executado de novo
- **WHEN** o comando de seed roda e já existe uma conta com o e-mail informado
- **THEN** nenhuma conta é criada ou alterada e o comando informa que o admin já existe

#### Scenario: Variáveis ausentes
- **WHEN** o comando de seed roda sem alguma das variáveis necessárias
- **THEN** o comando falha indicando qual variável falta, sem criar nada

### Requirement: Alterar e-mail
O admin SHALL poder alterar o e-mail de qualquer conta, inclusive o da própria. O novo e-mail SHALL ter formato válido e SHALL NOT estar em uso por outra conta, em qualquer combinação de maiúsculas e minúsculas. A alteração SHALL manter a senha e as sessões da conta, e SHALL fazer os links de redefinição de senha pendentes dela deixarem de valer.

#### Scenario: E-mail fictício corrigido
- **WHEN** o admin altera o e-mail de Lyra de `lyra@mesa.local` para `lyra@gmail.com`
- **THEN** a lista mostra `lyra@gmail.com`, Lyra entra com o novo e-mail e a mesma senha, e o login com o e-mail antigo é recusado

#### Scenario: Admin altera o próprio e-mail
- **WHEN** o único admin altera o próprio e-mail para um endereço real
- **THEN** a alteração é aceita e a sessão dele continua válida

#### Scenario: E-mail já em uso
- **WHEN** o admin tenta alterar o e-mail de Lyra para `Thorin@Mesa.com`, sendo que `thorin@mesa.com` já existe
- **THEN** a alteração é recusada com a indicação de que o e-mail já está em uso, e o e-mail de Lyra não muda

#### Scenario: Formato inválido
- **WHEN** o admin tenta alterar o e-mail de Lyra para `lyra@`
- **THEN** a alteração é recusada com a indicação de formato inválido

#### Scenario: Link pendente do e-mail antigo
- **WHEN** Lyra pede um link de redefinição e, antes de usá-lo, o admin altera o e-mail dela
- **THEN** o link antigo é recusado com a mensagem "Link inválido ou expirado"
