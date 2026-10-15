## ADDED Requirements

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
