## MODIFIED Requirements

### Requirement: Páginas protegidas exigem sessão
Todas as páginas e operações da aplicação, exceto a página de login e as páginas de pedido e de redefinição de senha, SHALL exigir uma sessão válida.

#### Scenario: Visitante sem sessão
- **WHEN** alguém sem sessão abre qualquer página que não seja a de login, a de pedido ou a de redefinição de senha
- **THEN** é redirecionado para a página de login

#### Scenario: Operação sem sessão
- **WHEN** uma operação de servidor da aplicação é chamada sem sessão válida
- **THEN** a operação é recusada e nenhum dado é lido ou alterado

#### Scenario: Usuário logado abre o login
- **WHEN** um usuário com sessão válida abre a página de login, a de pedido ou a de redefinição de senha
- **THEN** é redirecionado para a página inicial

#### Scenario: Visitante abre a recuperação de senha
- **WHEN** alguém sem sessão segue o link "Esqueci a senha" da página de login
- **THEN** a página de pedido de redefinição abre sem pedir login

## ADDED Requirements

### Requirement: Pedido de redefinição de senha
Sem sessão, a pessoa SHALL poder pedir um link de redefinição informando um e-mail. A resposta SHALL ser a mesma mensagem, "Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha", exista a conta ou não, e mesmo que o envio falhe. Só uma conta ativa SHALL receber o e-mail, com um link que vale 1 hora. O e-mail SHALL ser comparado sem diferenciar maiúsculas de minúsculas.

#### Scenario: Conta ativa pede o link
- **WHEN** Lyra, com a conta ativa `lyra@mesa.com`, pede a redefinição informando `Lyra@Mesa.com`
- **THEN** a página mostra a mensagem padrão e Lyra recebe em `lyra@mesa.com` um e-mail com o link de redefinição

#### Scenario: E-mail não cadastrado
- **WHEN** alguém pede a redefinição para um e-mail que não existe
- **THEN** a página mostra a mesma mensagem padrão e nenhum e-mail é enviado

#### Scenario: Falha no envio
- **WHEN** Lyra pede a redefinição e o servidor de e-mail está fora do ar
- **THEN** a página mostra a mesma mensagem padrão e a falha fica registrada no log do servidor

#### Scenario: Atalho no login
- **WHEN** um visitante abre a página de login
- **THEN** vê o link "Esqueci a senha", que leva à página de pedido de redefinição

### Requirement: Redefinição pelo link
O link SHALL abrir uma página onde a pessoa define a nova senha, com as mesmas regras de tamanho da troca de senha. O link SHALL valer uma única vez. Ao redefinir, o sistema SHALL encerrar todas as sessões da conta, concluir a troca de senha obrigatória pendente e levar a pessoa à página de login. Um link expirado, já usado ou inválido SHALL ser recusado, com a opção de pedir um novo.

#### Scenario: Redefinição bem-sucedida
- **WHEN** Lyra abre o link recebido e define a nova senha "dragao-vermelho"
- **THEN** é levada à página de login, entra com "dragao-vermelho" e a senha antiga deixa de funcionar

#### Scenario: Sessões encerradas
- **WHEN** Lyra está logada no celular e redefine a senha pelo link no computador
- **THEN** a próxima ação de Lyra no celular a leva à página de login

#### Scenario: Troca pendente concluída
- **WHEN** Lyra tem a troca de senha obrigatória pendente e redefine a senha pelo link
- **THEN** ao entrar com a nova senha, vai direto à página inicial, sem passar pela troca de senha

#### Scenario: Link usado de novo
- **WHEN** Lyra redefine a senha e abre o mesmo link outra vez
- **THEN** a redefinição é recusada com a mensagem "Link inválido ou expirado" e a opção de pedir um novo

#### Scenario: Link expirado
- **WHEN** Lyra abre o link 61 minutos depois de pedi-lo
- **THEN** a redefinição é recusada com a mensagem "Link inválido ou expirado" e a senha não muda

#### Scenario: Nova senha curta
- **WHEN** Lyra abre o link e informa uma nova senha com 7 caracteres
- **THEN** a redefinição é recusada com a indicação de que a senha precisa ter pelo menos 8 caracteres, e o link continua valendo

### Requirement: Conta desativada não recupera a senha
Uma conta desativada SHALL NOT receber o link de redefinição. Ao desativar uma conta, os links de redefinição pendentes dela SHALL deixar de valer, e continuam sem valer depois de uma reativação.

#### Scenario: Pedido de conta desativada
- **WHEN** alguém pede a redefinição para o e-mail de uma conta desativada
- **THEN** a página mostra a mensagem padrão e nenhum e-mail é enviado

#### Scenario: Link enviado antes da desativação
- **WHEN** Lyra pede o link, o admin desativa a conta dela e depois a reativa, e então Lyra abre o link
- **THEN** a redefinição é recusada com a mensagem "Link inválido ou expirado"

### Requirement: Limite de pedidos de redefinição
O sistema SHALL limitar pedidos repetidos de redefinição vindos do mesmo endereço, recusando temporariamente novos pedidos quando o limite é atingido.

#### Scenario: Muitos pedidos seguidos
- **WHEN** um mesmo endereço faz mais de 3 pedidos de redefinição em 1 minuto
- **THEN** os pedidos seguintes são recusados até o fim da janela, com a indicação de tentar mais tarde, e nenhum e-mail é enviado
