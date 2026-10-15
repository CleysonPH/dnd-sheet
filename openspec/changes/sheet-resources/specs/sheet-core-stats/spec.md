# Spec Delta

## MODIFIED Requirements

### Requirement: Modos Jogar e Editar
A ficha SHALL ter dois modos, alternados por uma chave sempre visível. Em Jogar, os valores SHALL aparecer só para leitura, e apenas dano, cura, PV temporário, dados de vida, testes contra a morte, as ações de mesa sobre as fontes, os recursos e os descansos SHALL ser alteráveis. Em Editar, todos os campos, os valores manuais e as fontes SHALL ser alteráveis. A ficha SHALL abrir em Jogar se algum atributo for diferente de 10, e em Editar caso contrário. Trocar de modo SHALL não alterar a ficha.

#### Scenario: Ficha preenchida abre em Jogar
- **WHEN** Lyra abre Thorin, que tem FOR 16
- **THEN** a ficha abre em Jogar, mostra os atributos e as perícias sem campos de texto, e tocar num valor não abre o painel de valor manual

#### Scenario: Ficha nova abre em Editar
- **WHEN** Lyra cria a ficha "Grog", com todos os atributos em 10
- **THEN** a ficha abre em Editar, com os campos de nome, nível e atributos editáveis

#### Scenario: Controles de mesa no modo Jogar
- **WHEN** Thorin está aberto em Jogar
- **THEN** Lyra pode aplicar dano e cura, alterar o PV temporário, gastar e recuperar dados de vida, equipar e sintonizar itens, mudar a quantidade de itens, preparar magias, gastar e recuperar trackers e espaços de magia e fazer descansos, e não pode alterar atributos, nível, proficiências, valores manuais, o máximo dos espaços de magia nem criar, editar ou excluir fontes

#### Scenario: Alternar para Editar
- **WHEN** Thorin está em Jogar e Lyra escolhe Editar
- **THEN** os campos de identificação, atributos, proficiências, dado de vida, deslocamento e PV atual ficam editáveis, tocar num valor calculado abre o painel de valor manual, e as fontes podem ser criadas, editadas e excluídas

#### Scenario: Trocar de modo não salva nada
- **WHEN** Lyra alterna entre Jogar e Editar sem mudar nenhum valor
- **THEN** a ficha continua indicando "Salvo" e nenhuma nova versão é gravada

### Requirement: Organização da ficha na tela
A ficha SHALL ter, no topo, a faixa com CA, iniciativa, deslocamento, percepção passiva, bônus de proficiência, o bloco de PV com dano e cura, e os dados de vida. Cada atributo SHALL ser mostrado num bloco com valor, modificador, salvaguarda e as perícias daquele atributo. A ficha SHALL ser utilizável sem rolagem horizontal a partir de 360 px. A partir de 1024 px, os blocos de atributo SHALL ficar em 2 colunas e 3 linhas, com o cartão Recursos ao lado.

#### Scenario: Celular
- **WHEN** Lyra abre a ficha num celular com tela de 375 px de largura
- **THEN** a faixa de topo aparece primeiro, com o PV visível sem rolar, os blocos de atributo aparecem um abaixo do outro, não há rolagem horizontal e, em Editar, todos os campos podem ser editados

#### Scenario: Desktop
- **WHEN** Lyra abre a ficha numa janela de 1280 px de largura
- **THEN** a faixa de topo aparece numa linha, os seis blocos de atributo aparecem em 2 colunas e 3 linhas e o cartão Recursos aparece à direita deles

#### Scenario: Perícias dentro do atributo
- **WHEN** Lyra abre Thorin, com DES 14, sem proficiência em Acrobacia, Furtividade e Prestidigitação
- **THEN** o bloco de Destreza mostra o valor 14, o modificador +2, a salvaguarda de Destreza +2 e as perícias Acrobacia +2, Furtividade +2 e Prestidigitação +2

#### Scenario: CA reservada
- **WHEN** Lyra abre uma ficha com DES 14, sem armadura nem efeitos de CA
- **THEN** o lugar da CA na faixa de topo mostra o valor calculado, 12, e não mais "—"
