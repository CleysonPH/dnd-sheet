# Spec Delta

## MODIFIED Requirements

### Requirement: Override manual de valores derivados
O jogador SHALL poder substituir por um valor inteiro digitado qualquer valor calculado: modificadores, bônus de proficiência, salvaguardas, perícias, iniciativa, percepção passiva, PV máximo, total de dados de vida, CA e deslocamento. O valor manual SHALL substituir o resultado final, já com os efeitos das fontes. Ele SHALL ficar salvo na ficha e sinalizado na tela, mostrar o valor calculado e poder ser removido para voltar ao cálculo.

#### Scenario: PV máximo por regra da casa
- **WHEN** Thorin tem PV máximo calculado 55 e Lyra define o valor manual 61
- **THEN** a ficha mostra 61 de PV máximo, sinalizado como valor manual, indica que o calculado é 55, e o valor manual continua depois de salvo e reaberto

#### Scenario: Remover o valor manual
- **WHEN** Lyra remove o valor manual do PV máximo de Thorin
- **THEN** o PV máximo volta a 55, sem sinalização

#### Scenario: Valor manual permanece quando o cálculo muda
- **WHEN** a Furtividade de Elara tem o valor manual +9 e Lyra muda a DES dela de 17 para 18
- **THEN** a Furtividade continua +9, e o calculado indicado passa de +7 para +8

#### Scenario: Valor manual inválido
- **WHEN** Lyra digita "abc" ou 2,5 como valor manual
- **THEN** o campo indica que o valor deve ser inteiro e nada é salvo

#### Scenario: Valor manual sobre efeitos
- **WHEN** a CA calculada de Thorin, com efeitos, é 18 e Lyra define o valor manual 20
- **THEN** a CA mostrada é 20, indicando que o calculado é 18

### Requirement: Organização da ficha na tela
A ficha SHALL ter, no topo, a faixa com CA, iniciativa, deslocamento, percepção passiva, bônus de proficiência, o bloco de PV com dano e cura, e os dados de vida. Cada atributo SHALL ser mostrado num bloco com valor, modificador, salvaguarda e as perícias daquele atributo. A ficha SHALL ser utilizável sem rolagem horizontal a partir de 360 px. A partir de 1024 px, os blocos de atributo SHALL ficar em 3 colunas.

#### Scenario: Celular
- **WHEN** Lyra abre a ficha num celular com tela de 375 px de largura
- **THEN** a faixa de topo aparece primeiro, com o PV visível sem rolar, os blocos de atributo aparecem um abaixo do outro, não há rolagem horizontal e, em Editar, todos os campos podem ser editados

#### Scenario: Desktop
- **WHEN** Lyra abre a ficha numa janela de 1280 px de largura
- **THEN** a faixa de topo aparece numa linha e os seis blocos de atributo aparecem em 3 colunas e 2 linhas

#### Scenario: Perícias dentro do atributo
- **WHEN** Lyra abre Thorin, com DES 14, sem proficiência em Acrobacia, Furtividade e Prestidigitação
- **THEN** o bloco de Destreza mostra o valor 14, o modificador +2, a salvaguarda de Destreza +2 e as perícias Acrobacia +2, Furtividade +2 e Prestidigitação +2

#### Scenario: CA reservada
- **WHEN** Lyra abre uma ficha com DES 14, sem armadura nem efeitos de CA
- **THEN** o lugar da CA na faixa de topo mostra o valor calculado, 12, e não mais "—"
