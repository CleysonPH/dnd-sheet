# operations Specification

## Purpose

Garante como a aplicação roda em produção: endereço público com HTTPS, publicação a partir do repositório, migrações antes de cada versão, recuperação de dados, limites e e-mails que funcionam em funções serverless e datas no horário de Brasília.

## Requirements

### Requirement: Aplicação em produção
A aplicação SHALL estar disponível num endereço público com HTTPS. Cada alteração na branch principal do repositório SHALL gerar uma nova versão de produção. Se a construção da nova versão falhar, a versão anterior SHALL continuar no ar.

#### Scenario: Nova versão
- **WHEN** uma alteração é enviada para a branch principal e a construção termina com sucesso
- **THEN** o endereço de produção passa a servir a nova versão, por HTTPS

#### Scenario: Construção com erro
- **WHEN** a construção de uma nova versão falha
- **THEN** o endereço de produção continua servindo a versão anterior, sem interrupção

### Requirement: Migrações antes da nova versão
As migrações do banco SHALL ser aplicadas antes de a nova versão de produção começar a responder. Se uma migração falhar, a nova versão SHALL NOT ser publicada.

#### Scenario: Versão com tabela nova
- **WHEN** uma versão que depende de uma tabela nova é publicada
- **THEN** a tabela já existe no banco de produção quando a versão começa a responder

#### Scenario: Migração com erro
- **WHEN** uma migração falha durante a publicação
- **THEN** a publicação falha e a versão anterior continua no ar com o banco como estava

### Requirement: Recuperação de dados
O banco de produção SHALL poder ser restaurado para qualquer momento das últimas 6 horas. O procedimento SHALL estar documentado e SHALL ter sido ensaiado restaurando para uma cópia separada, sem alterar a produção.

#### Scenario: Ficha apagada por engano
- **WHEN** uma ficha é excluída por engano e o problema é percebido 2 horas depois
- **THEN** o procedimento documentado permite recuperar o banco como estava antes da exclusão

#### Scenario: Ensaio de restauração
- **WHEN** o ensaio restaura o banco de 1 hora atrás numa cópia separada
- **THEN** a cópia tem as fichas daquele momento e a produção não muda

### Requirement: Limites de tentativas entre instâncias
Os limites de tentativas de login e de pedidos de redefinição de senha SHALL valer para o endereço do cliente, mesmo quando as requisições são atendidas por instâncias diferentes da aplicação.

#### Scenario: Requisições em instâncias diferentes
- **WHEN** um mesmo endereço faz 6 tentativas de login em 1 minuto e cada uma é atendida por uma instância diferente
- **THEN** a 6ª tentativa é recusada, como numa instância só

### Requirement: E-mail entregue depois da resposta
O e-mail de redefinição de senha SHALL ser entregue mesmo que a resposta ao pedido já tenha sido enviada, sem que o tempo de resposta revele se a conta existe.

#### Scenario: Pedido em produção
- **WHEN** Lyra, com uma conta ativa e e-mail real, pede a redefinição em produção
- **THEN** a página mostra a mensagem padrão e o e-mail com o link chega à caixa de Lyra

### Requirement: Datas no horário de Brasília
As datas e horas mostradas pela aplicação SHALL usar o horário de Brasília, qualquer que seja o fuso do servidor.

#### Scenario: Ficha atualizada à noite
- **WHEN** Lyra salva uma ficha às 22h10 no horário de Brasília
- **THEN** a lista de fichas mostra a atualização às 22:10 daquele dia, e não às 01:10 do dia seguinte
