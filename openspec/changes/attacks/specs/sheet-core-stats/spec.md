## MODIFIED Requirements

### Requirement: Organização da ficha na tela
A ficha SHALL ter, no topo, a faixa com CA, iniciativa, deslocamento, percepção passiva, bônus de proficiência, o bloco de PV com dano e cura, e os dados de vida. Cada atributo SHALL ser mostrado num bloco com valor, modificador, salvaguarda e as perícias daquele atributo. A ficha SHALL ser utilizável sem rolagem horizontal a partir de 360 px. A partir de 1024 px, os blocos de atributo SHALL ficar em 2 colunas e 3 linhas, com os cartões Ataques, Recursos, Defesas e Proficiências, nessa ordem, ao lado. A faixa de condições SHALL ficar logo abaixo da faixa de topo. Abaixo de 1024 px, Ataques, Recursos, Defesas e Proficiências SHALL vir antes dos blocos de atributo.

#### Scenario: Celular
- **WHEN** Lyra abre a ficha num celular com tela de 375 px de largura
- **THEN** a faixa de topo aparece primeiro, com o PV visível sem rolar, os blocos de atributo aparecem um abaixo do outro, não há rolagem horizontal e, em Editar, todos os campos podem ser editados

#### Scenario: Desktop
- **WHEN** Lyra abre a ficha numa janela de 1280 px de largura
- **THEN** a faixa de topo aparece numa linha, a faixa de condições logo abaixo dela, os seis blocos de atributo aparecem em 2 colunas e 3 linhas e os cartões Ataques, Recursos, Defesas e Proficiências aparecem à direita deles, um abaixo do outro

#### Scenario: Ataques no celular
- **WHEN** Lyra abre Thorin, com o Machado de Batalha equipado, num celular com tela de 375 px
- **THEN** o cartão Ataques aparece logo depois da faixa de condições, antes de Recursos, e as linhas de ataque cabem sem rolagem horizontal

#### Scenario: Perícias dentro do atributo
- **WHEN** Lyra abre Thorin, com DES 14, sem proficiência em Acrobacia, Furtividade e Prestidigitação
- **THEN** o bloco de Destreza mostra o valor 14, o modificador +2, a salvaguarda de Destreza +2 e as perícias Acrobacia +2, Furtividade +2 e Prestidigitação +2

#### Scenario: CA reservada
- **WHEN** Lyra abre uma ficha com DES 14, sem armadura nem efeitos de CA
- **THEN** o lugar da CA na faixa de topo mostra o valor calculado, 12, e não mais "—"
