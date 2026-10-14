# Spec Delta

## Purpose

Guarda as fichas de personagem de cada usuário no servidor: listar, criar, abrir, editar o cabeçalho e excluir, com salvamento automático, proteção contra sobrescrita entre dispositivos e acesso restrito ao dono.

## ADDED Requirements

### Requirement: Listar as próprias fichas
A página inicial SHALL listar todas as fichas do usuário logado, e só elas, da alteração mais recente para a mais antiga. Cada item SHALL mostrar nome, espécie, classe e nível.

#### Scenario: Usuário com fichas
- **WHEN** Lyra tem as fichas "Thorin" (alterada ontem) e "Grog" (alterada hoje) e abre a página inicial
- **THEN** vê "Grog" e depois "Thorin", cada uma com espécie, classe e nível

#### Scenario: Fichas de outros usuários não aparecem
- **WHEN** Lyra e o Mestre têm fichas e Lyra abre a página inicial
- **THEN** só as fichas de Lyra aparecem

#### Scenario: Usuário sem fichas
- **WHEN** um usuário sem nenhuma ficha abre a página inicial
- **THEN** vê uma mensagem indicando que ainda não há fichas e a opção de criar a primeira

### Requirement: Criar ficha
O usuário SHALL poder criar uma ficha informando o nome do personagem, entre 1 e 100 caracteres. A ficha nasce no nível 1, com espécie, classe e antecedente vazios, e SHALL abrir em seguida.

#### Scenario: Ficha criada
- **WHEN** Lyra cria uma ficha com o nome "Thorin"
- **THEN** a ficha "Thorin" abre, no nível 1, e passa a aparecer na lista dela

#### Scenario: Nome vazio
- **WHEN** Lyra tenta criar uma ficha com o nome em branco
- **THEN** a criação é recusada com a indicação de que o nome é obrigatório

### Requirement: Fichas restritas ao dono
Uma ficha SHALL ser lida, alterada e excluída apenas pelo usuário que a criou. Para qualquer outro usuário, inclusive admins, a ficha SHALL se comportar como inexistente.

#### Scenario: Outro usuário abre o endereço da ficha
- **WHEN** o Mestre abre o endereço de uma ficha de Lyra
- **THEN** recebe uma página de "não encontrado", sem nenhum dado da ficha

#### Scenario: Outro usuário tenta salvar ou excluir
- **WHEN** uma operação de salvar ou excluir é chamada para uma ficha de Lyra com a sessão de outro usuário
- **THEN** a operação é recusada como ficha inexistente e a ficha não muda

#### Scenario: Ficha inexistente
- **WHEN** um usuário abre o endereço de uma ficha que não existe
- **THEN** recebe uma página de "não encontrado"

### Requirement: Editar o cabeçalho da ficha
O usuário SHALL poder editar nome, espécie, classe, nível e antecedente da ficha. O nome SHALL ter entre 1 e 100 caracteres, o nível SHALL ser um número inteiro de 1 a 20, e espécie, classe e antecedente SHALL ser texto livre de até 100 caracteres.

#### Scenario: Edição válida
- **WHEN** Lyra muda a classe de "Thorin" para "Bárbaro" e o nível para 5
- **THEN** os novos valores aparecem na ficha e, depois de salvos, na lista

#### Scenario: Nível fora do intervalo
- **WHEN** Lyra informa o nível 21
- **THEN** o campo indica que o nível vai de 1 a 20 e o valor inválido não é salvo

#### Scenario: Nome apagado
- **WHEN** Lyra apaga todo o nome do personagem
- **THEN** o campo indica que o nome é obrigatório e o valor inválido não é salvo

### Requirement: Salvamento automático
As alterações na ficha SHALL ser salvas no servidor automaticamente, sem ação do usuário, em até 5 segundos após a última edição. A ficha SHALL mostrar o estado do salvamento: salvando, salvo ou não salvo.

#### Scenario: Edição salva sozinha
- **WHEN** Lyra altera a espécie de "Thorin" e para de digitar
- **THEN** em até 5 segundos a ficha indica "Salvo"

#### Scenario: Ficha aberta em outro dispositivo depois de salva
- **WHEN** Lyra edita "Thorin" no computador, a ficha indica "Salvo", e depois ela abre "Thorin" no celular
- **THEN** o celular mostra os valores editados no computador

#### Scenario: Digitação contínua
- **WHEN** Lyra digita sem pausa por 10 segundos
- **THEN** o resultado final fica salvo em até 5 segundos depois que ela para

### Requirement: Alterações não salvas são preservadas
Quando um salvamento falhar por erro de rede ou do servidor, a ficha SHALL manter as alterações na tela, indicar "Não salvo" e tentar salvar de novo. Ao sair da página com alterações não salvas, o navegador SHALL avisar o usuário.

#### Scenario: Servidor fora do ar por um momento
- **WHEN** Lyra edita a ficha enquanto o servidor não responde, e o servidor volta logo depois
- **THEN** a ficha indica "Não salvo" enquanto falha, mantém as alterações e as salva quando o servidor volta

#### Scenario: Fechar a aba com alteração pendente
- **WHEN** Lyra tenta fechar a aba com uma alteração ainda não salva
- **THEN** o navegador pede confirmação antes de sair

### Requirement: Conflito entre dispositivos
Cada salvamento SHALL informar a versão da ficha em que a edição se baseou. Se a ficha foi salva em outro lugar desde então, o salvamento SHALL ser recusado sem alterar a ficha, a edição na tela SHALL ser bloqueada e o usuário SHALL ser avisado e convidado a recarregar a versão mais nova. Não há opção de sobrescrever.

#### Scenario: Aba antiga tenta salvar
- **WHEN** "Thorin" está aberta no computador e no celular, Lyra muda o nível no celular, a ficha é salva, e depois ela muda a classe no computador
- **THEN** o computador avisa "Esta ficha foi alterada em outro lugar", bloqueia a edição e oferece "Recarregar"; a ficha no servidor mantém a alteração feita no celular

#### Scenario: Recarregar após conflito
- **WHEN** Lyra escolhe "Recarregar" no aviso de conflito
- **THEN** a ficha mostra a versão mais nova, com a alteração feita no celular, e volta a ser editável

### Requirement: Excluir ficha
O usuário SHALL poder excluir uma ficha de forma definitiva. A exclusão SHALL exigir confirmação digitando o nome do personagem exatamente como está na ficha.

#### Scenario: Exclusão confirmada
- **WHEN** Lyra escolhe excluir "Thorin" e digita "Thorin" na confirmação
- **THEN** a ficha é apagada, Lyra volta para a lista e "Thorin" não aparece mais

#### Scenario: Confirmação errada
- **WHEN** Lyra digita "thor" na confirmação de exclusão de "Thorin"
- **THEN** a exclusão não acontece

#### Scenario: Ficha excluída aberta em outro dispositivo
- **WHEN** "Thorin" está aberta no celular, Lyra a exclui no computador e depois edita a ficha no celular
- **THEN** o celular avisa que a ficha não existe mais e bloqueia a edição

### Requirement: Fichas de versões anteriores continuam abrindo
Toda ficha SHALL registrar a versão do formato em que foi gravada. Ao abrir uma ficha gravada num formato anterior, o sistema SHALL convertê-la para o formato atual sem perder os dados que ela já tinha.

#### Scenario: Ficha antiga aberta após atualização
- **WHEN** uma ficha foi gravada no formato 1 e a aplicação passou a usar um formato mais novo
- **THEN** a ficha abre com todos os dados que tinha, e o próximo salvamento a grava no formato atual

### Requirement: Documento validado no servidor
O servidor SHALL recusar salvar uma ficha cujo conteúdo não respeite o formato atual ou ultrapasse 256 KB, sem alterar a versão guardada.

#### Scenario: Conteúdo inválido enviado diretamente
- **WHEN** uma operação de salvamento é chamada com o nível "vinte" ou com campos que o formato não conhece
- **THEN** o salvamento é recusado e a ficha guardada não muda

#### Scenario: Ficha grande demais
- **WHEN** uma operação de salvamento é chamada com um documento de 300 KB
- **THEN** o salvamento é recusado e a ficha guardada não muda
