# Spec Delta

## Purpose

Define o tema visual da aplicação: escuro por padrão, com a opção de usar o tema claro, guardada por aparelho e aplicada já no carregamento da página.

## ADDED Requirements

### Requirement: Tema escuro por padrão
Todas as páginas da aplicação SHALL usar o tema escuro quando o aparelho não tiver uma preferência de tema guardada, independentemente da preferência de cor do sistema operacional.

#### Scenario: Primeiro acesso
- **WHEN** Lyra abre a aplicação pela primeira vez num aparelho cujo sistema usa o tema claro
- **THEN** a página aparece no tema escuro

### Requirement: Alternar entre claro e escuro
O cabeçalho da aplicação e as telas de login e de troca de senha SHALL ter uma chave que alterna entre o tema escuro e o claro. A troca SHALL valer na hora, para a página aberta, sem recarregar.

#### Scenario: Mudar para o claro
- **WHEN** Lyra está na lista de fichas no tema escuro e usa a chave de tema
- **THEN** a página passa para o tema claro na hora, sem recarregar e sem perder o que estava na tela

#### Scenario: Chave no login
- **WHEN** alguém abre a tela de login
- **THEN** a chave de tema está disponível antes de entrar

### Requirement: Preferência guardada por aparelho
A escolha de tema SHALL ser guardada no navegador do aparelho e valer para todas as páginas e sessões nesse navegador. Ela SHALL não ser compartilhada com outros aparelhos nem depender da conta.

#### Scenario: Voltar depois
- **WHEN** Lyra escolhe o tema claro no computador, sai da conta e volta no dia seguinte
- **THEN** a aplicação abre no tema claro, inclusive a tela de login

#### Scenario: Outro aparelho
- **WHEN** Lyra escolheu o tema claro no computador e abre a aplicação no celular pela primeira vez
- **THEN** o celular mostra o tema escuro

### Requirement: Sem troca visível de tema ao carregar
Ao carregar qualquer página, o tema guardado SHALL ser aplicado antes da primeira exibição, sem que a página apareça em um tema e troque para o outro.

#### Scenario: Recarregar no tema claro
- **WHEN** Lyra usa o tema claro e recarrega a ficha
- **THEN** a página aparece desde o início no tema claro, sem um instante no escuro
