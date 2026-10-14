# authentication Specification

## Purpose

Controla quem está usando a aplicação: login por e-mail e senha, sessões, logout, troca da própria senha e o bloqueio de acesso enquanto houver uma troca de senha obrigatória pendente.

## Requirements

### Requirement: Login com e-mail e senha
O sistema SHALL autenticar usuários por e-mail e senha. O e-mail SHALL ser comparado sem diferenciar maiúsculas de minúsculas. Em caso de falha, a mensagem SHALL ser a mesma para e-mail inexistente e senha errada.

#### Scenario: Login bem-sucedido
- **WHEN** um usuário ativo informa o e-mail e a senha corretos
- **THEN** o sistema cria uma sessão e o leva à página inicial

#### Scenario: E-mail com maiúsculas
- **WHEN** um usuário cadastrado como `lyra@mesa.com` entra com `Lyra@Mesa.com` e a senha correta
- **THEN** o login é aceito

#### Scenario: Senha errada
- **WHEN** um usuário informa um e-mail cadastrado e uma senha errada
- **THEN** o login é recusado com a mensagem "E-mail ou senha inválidos"

#### Scenario: E-mail inexistente
- **WHEN** alguém informa um e-mail que não está cadastrado
- **THEN** o login é recusado com a mesma mensagem "E-mail ou senha inválidos"

### Requirement: Sem cadastro público
O sistema SHALL NOT permitir que alguém crie a própria conta. Contas só são criadas por um admin ou pelo seed do primeiro admin.

#### Scenario: Página de login sem cadastro
- **WHEN** um visitante abre a página de login
- **THEN** não há opção de criar conta

#### Scenario: Tentativa direta de cadastro
- **WHEN** alguém envia uma requisição diretamente ao endpoint de cadastro de e-mail e senha
- **THEN** o sistema recusa a requisição e nenhuma conta é criada

### Requirement: Conta desativada não entra
O sistema SHALL recusar o login de uma conta desativada, mesmo com a senha correta, informando que a conta está desativada.

#### Scenario: Login de conta desativada
- **WHEN** o usuário de uma conta desativada informa o e-mail e a senha corretos
- **THEN** o login é recusado com a mensagem "Conta desativada. Fale com o administrador."

### Requirement: Páginas protegidas exigem sessão
Todas as páginas e operações da aplicação, exceto a página de login, SHALL exigir uma sessão válida.

#### Scenario: Visitante sem sessão
- **WHEN** alguém sem sessão abre qualquer página que não seja a de login
- **THEN** é redirecionado para a página de login

#### Scenario: Operação sem sessão
- **WHEN** uma operação de servidor da aplicação é chamada sem sessão válida
- **THEN** a operação é recusada e nenhum dado é lido ou alterado

#### Scenario: Usuário logado abre o login
- **WHEN** um usuário com sessão válida abre a página de login
- **THEN** é redirecionado para a página inicial

### Requirement: Logout
O usuário SHALL poder encerrar a própria sessão. Depois do logout, a sessão SHALL deixar de ser válida.

#### Scenario: Sair
- **WHEN** um usuário logado escolhe "Sair"
- **THEN** a sessão é encerrada e ele é levado à página de login

#### Scenario: Página aberta após logout
- **WHEN** depois do logout o usuário tenta abrir uma página protegida, inclusive voltando no navegador
- **THEN** é redirecionado para a página de login

### Requirement: Expiração de sessão
Uma sessão SHALL expirar depois de 30 dias sem uso. O uso da aplicação SHALL renovar a sessão.

#### Scenario: Sessão sem uso por mais de 30 dias
- **WHEN** um usuário volta à aplicação 31 dias depois do último uso
- **THEN** precisa entrar novamente

#### Scenario: Uso frequente
- **WHEN** um usuário usa a aplicação toda semana
- **THEN** continua logado sem precisar entrar de novo

### Requirement: Troca de senha pendente bloqueia o acesso
Enquanto a conta tiver uma troca de senha obrigatória pendente, o usuário SHALL acessar apenas a página de troca de senha e o logout.

#### Scenario: Primeiro login com senha provisória
- **WHEN** um usuário entra com a senha provisória recebida do admin
- **THEN** é levado à página de troca de senha

#### Scenario: Tentativa de abrir outra página
- **WHEN** um usuário com troca pendente tenta abrir qualquer outra página
- **THEN** é redirecionado para a página de troca de senha

#### Scenario: Operação com troca pendente
- **WHEN** uma operação de servidor, que não seja a troca de senha ou o logout, é chamada por um usuário com troca pendente
- **THEN** a operação é recusada e nenhum dado é lido ou alterado

### Requirement: Troca de senha
O usuário SHALL poder trocar a própria senha informando a senha atual e a nova. A nova senha SHALL ter entre 8 e 128 caracteres e SHALL ser diferente da atual. Ao trocar, as outras sessões do usuário SHALL ser encerradas e a troca pendente, se houver, SHALL ser concluída.

#### Scenario: Troca obrigatória concluída
- **WHEN** um usuário com troca pendente informa a senha provisória e uma nova senha válida
- **THEN** a senha é alterada, a pendência some e ele é levado à página inicial

#### Scenario: Troca voluntária
- **WHEN** um usuário sem pendência troca a senha pela página da própria conta
- **THEN** a senha é alterada e a sessão atual continua válida

#### Scenario: Outras sessões encerradas
- **WHEN** um usuário logado no celular e no computador troca a senha no computador
- **THEN** a sessão do celular deixa de ser válida

#### Scenario: Senha atual errada
- **WHEN** o usuário informa a senha atual errada
- **THEN** a troca é recusada e a senha não muda

#### Scenario: Nova senha curta
- **WHEN** o usuário informa uma nova senha com 7 caracteres
- **THEN** a troca é recusada com a indicação de que a senha precisa ter pelo menos 8 caracteres

#### Scenario: Nova senha igual à atual
- **WHEN** o usuário informa como nova senha a mesma senha atual
- **THEN** a troca é recusada

### Requirement: Limite de tentativas de login
O sistema SHALL limitar tentativas repetidas de login vindas do mesmo endereço, recusando temporariamente novas tentativas quando o limite é atingido.

#### Scenario: Muitas tentativas seguidas
- **WHEN** um mesmo endereço faz mais de 5 tentativas de login em 1 minuto
- **THEN** as tentativas seguintes são recusadas até o fim da janela, mesmo com a senha correta
