## MODIFIED Requirements

### Requirement: Fichas restritas ao dono
Uma ficha SHALL ser lida, alterada e excluída apenas pelo usuário que a criou, exceto a leitura pelo link de compartilhamento ativo. Para qualquer outro usuário, inclusive admins, a ficha SHALL se comportar como inexistente no endereço dela.

#### Scenario: Outro usuário abre o endereço da ficha
- **WHEN** o Mestre abre o endereço de uma ficha de Lyra
- **THEN** recebe uma página de "não encontrado", sem nenhum dado da ficha

#### Scenario: Outro usuário tenta salvar ou excluir
- **WHEN** uma operação de salvar ou excluir é chamada para uma ficha de Lyra com a sessão de outro usuário
- **THEN** a operação é recusada como ficha inexistente e a ficha não muda

#### Scenario: Ficha inexistente
- **WHEN** um usuário abre o endereço de uma ficha que não existe
- **THEN** recebe uma página de "não encontrado"

#### Scenario: Outro usuário com o link
- **WHEN** Lyra compartilha Ária e o Mestre abre o link de compartilhamento
- **THEN** o Mestre vê a ficha só para leitura, e o endereço da ficha continua respondendo "não encontrado" para ele

## ADDED Requirements

### Requirement: Link de compartilhamento
O dono SHALL poder gerar um link de compartilhamento para a ficha, copiá-lo, desativá-lo e gerar um novo. Cada ficha SHALL ter no máximo um link ativo, e gerar um novo SHALL invalidar o anterior. Fichas novas e as que já existiam SHALL começar sem link. O link SHALL conter um código aleatório que não dá para adivinhar nem deduzir do endereço da ficha.

#### Scenario: Gerar e copiar
- **WHEN** Lyra abre Ária, que não tem link, e escolhe "Gerar link"
- **THEN** a ficha mostra o endereço do link e a opção de copiá-lo

#### Scenario: Desativar
- **WHEN** Lyra escolhe "Desativar link" em Ária
- **THEN** a ficha volta a mostrar "Gerar link" e o endereço antigo responde "não encontrado"

#### Scenario: Gerar outro
- **WHEN** Ária tem um link e Lyra escolhe "Gerar novo link"
- **THEN** a ficha mostra um endereço diferente, que abre a ficha, e o anterior responde "não encontrado"

#### Scenario: Só o dono gerencia o link
- **WHEN** uma operação de gerar, trocar ou desativar o link de Ária é chamada com a sessão de outro usuário
- **THEN** a operação é recusada como ficha inexistente e o link não muda

### Requirement: Ficha compartilhada
Quem abre um link ativo, com ou sem conta, SHALL ver a versão salva mais recente da ficha, com os mesmos valores calculados e a origem de cada um, só para leitura: sem modo Editar, sem controles que alteram a ficha e sem salvar nada. A página SHALL NOT mostrar o nome, o e-mail ou o identificador do jogador, e SHALL pedir aos buscadores que não a indexem.

#### Scenario: Visitante sem conta
- **WHEN** alguém sem conta abre o link de Ária
- **THEN** vê o nome, os atributos, o PV, as fontes e os recursos de Ária, sem campos editáveis nem botões de dano, cura, descanso ou recursos

#### Scenario: Ficha ao vivo
- **WHEN** Lyra aplica 5 de dano em Ária e o visitante recarrega o link
- **THEN** o visitante vê o PV já com o dano

#### Scenario: Origem dos valores
- **WHEN** o visitante toca na CA de Ária
- **THEN** vê de onde vem o valor, sem a opção de definir um valor manual

#### Scenario: Sem dados do jogador
- **WHEN** alguém abre o link de Ária
- **THEN** a página não mostra o nome nem o e-mail de Lyra

### Requirement: Link que não vale mais
O endereço de um link SHALL responder "não encontrado", sem nenhum dado da ficha, quando o código não existe, o link foi desativado ou trocado, a ficha foi excluída ou a conta do dono está desativada.

#### Scenario: Ficha excluída
- **WHEN** Lyra exclui Ária e alguém abre o link dela
- **THEN** recebe "não encontrado"

#### Scenario: Dono desativado
- **WHEN** o admin desativa a conta de Lyra e alguém abre o link de Ária
- **THEN** recebe "não encontrado", e o link volta a funcionar se a conta for reativada

#### Scenario: Código inventado
- **WHEN** alguém abre `/compartilhada/` com um código que não existe
- **THEN** recebe "não encontrado"
