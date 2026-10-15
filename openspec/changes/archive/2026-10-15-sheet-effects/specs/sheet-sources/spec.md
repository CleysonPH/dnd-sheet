# Spec Delta

## MODIFIED Requirements

### Requirement: Campos de item
Um item SHALL ter: categoria (arma, armadura, escudo, equipamento, consumível ou outro); quantidade inteira de 0 a 9.999; peso unitário em kg, de 0 a 9.999 com até duas casas decimais; preço em texto livre de até 50 caracteres; e as marcações equipado, requer sintonização e sintonizado. Uma armadura SHALL ter também o tipo (leve, média ou pesada) e a CA base, inteira de 0 a 30. Um escudo SHALL ter o bônus de CA, inteiro de 0 a 10, com +2 como valor inicial.

#### Scenario: Item com peso e quantidade
- **WHEN** Lyra cria o item "Azagaia", arma, quantidade 4, peso 1 kg e preço "5 PP"
- **THEN** o Inventário mostra "Azagaia" com quantidade 4, 1 kg cada e preço "5 PP"

#### Scenario: Peso inválido
- **WHEN** Lyra informa -1 ou 0,125 no peso de um item
- **THEN** o campo indica o intervalo aceito e o valor inválido não é salvo

#### Scenario: Armadura
- **WHEN** Lyra cria a "Cota de Malha", armadura pesada de CA base 16
- **THEN** o Inventário mostra a Cota de Malha como armadura pesada, CA 16

#### Scenario: Escudo
- **WHEN** Lyra cria um item de categoria escudo
- **THEN** o escudo começa com bônus de CA +2, que pode ser alterado

### Requirement: Campos de magia
Uma magia SHALL ter: círculo (truque ou 1º a 9º); escola (abjuração, adivinhação, conjuração, encantamento, evocação, ilusão, necromancia ou transmutação); classe que a conhece; tempo de conjuração; alcance; duração; componentes V, S e M, com o texto do material quando houver M; e as marcações concentração, ritual, preparada e em efeito. Os campos de texto SHALL ter até 100 caracteres.

#### Scenario: Magia completa
- **WHEN** Lyra cria "Mísseis Mágicos", 1º círculo, evocação, mago, 1 ação, 36 m, instantânea, componentes V e S
- **THEN** a aba Magias mostra "Mísseis Mágicos" no 1º círculo com esses dados

#### Scenario: Material
- **WHEN** Lyra marca o componente M de uma magia e informa "um pouco de pó de diamante"
- **THEN** a magia mostra os componentes com o material descrito

#### Scenario: Em efeito
- **WHEN** Lyra marca "Armadura Arcana" como em efeito
- **THEN** a aba Magias sinaliza a magia como em efeito

### Requirement: Ações de mesa nas fontes
No modo Jogar, a ficha SHALL permitir equipar e desequipar itens, sintonizar e dessintonizar itens que requerem sintonização, aumentar e diminuir a quantidade de itens, marcar e desmarcar magias como preparadas e marcar e desmarcar magias como em efeito. Criar, editar e excluir fontes SHALL não estar disponível em Jogar.

#### Scenario: Usar uma azagaia na mesa
- **WHEN** Thorin está em Jogar com 4 Azagaias e Lyra diminui a quantidade em 1
- **THEN** a ficha mostra 3 Azagaias e a carga total cai 1 kg

#### Scenario: Sem edição em Jogar
- **WHEN** Thorin está em Jogar
- **THEN** a ficha não oferece criar, editar nem excluir fontes

#### Scenario: Conjurar na mesa
- **WHEN** Elara está em Jogar e Lyra marca "Armadura Arcana" como em efeito
- **THEN** a magia fica em efeito e os efeitos dela passam a valer
