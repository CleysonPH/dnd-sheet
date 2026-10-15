## MODIFIED Requirements

### Requirement: Páginas protegidas exigem sessão
Todas as páginas e operações da aplicação, exceto a página de login, as páginas de pedido e de redefinição de senha e a página de ficha compartilhada, SHALL exigir uma sessão válida.

#### Scenario: Visitante sem sessão
- **WHEN** alguém sem sessão abre qualquer página que não seja a de login, a de pedido ou a de redefinição de senha, nem a de ficha compartilhada
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

#### Scenario: Ficha compartilhada sem sessão
- **WHEN** alguém sem sessão abre um link de ficha compartilhada ativo
- **THEN** a ficha abre sem pedir login

#### Scenario: Usuário logado abre uma ficha compartilhada
- **WHEN** um usuário com sessão válida abre um link de ficha compartilhada
- **THEN** vê a ficha compartilhada, sem ser redirecionado para a página inicial
