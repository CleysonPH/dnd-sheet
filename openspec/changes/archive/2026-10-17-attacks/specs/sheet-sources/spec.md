## MODIFIED Requirements

### Requirement: Campos de item
Um item SHALL ter: categoria (arma, armadura, escudo, equipamento, consumível ou outro); quantidade inteira de 0 a 9.999; peso unitário em kg, de 0 a 9.999 com até duas casas decimais; preço em texto livre de até 50 caracteres; e as marcações equipado, requer sintonização e sintonizado. Uma armadura SHALL ter também o tipo (leve, média ou pesada) e a CA base, inteira de 0 a 30. Um escudo SHALL ter o bônus de CA, inteiro de 0 a 10, com +2 como valor inicial. Uma arma SHALL ter também a categoria de arma, simples ou marcial, com simples como valor inicial.

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

#### Scenario: Arma marcial
- **WHEN** Lyra cria o item "Machado de Batalha", de categoria arma, e escolhe a categoria de arma marcial
- **THEN** o Inventário mostra o Machado de Batalha como arma marcial

#### Scenario: Item antigo
- **WHEN** Lyra abre uma ficha gravada antes da categoria de arma
- **THEN** as armas aparecem como simples, e a categoria pode ser alterada em Editar
