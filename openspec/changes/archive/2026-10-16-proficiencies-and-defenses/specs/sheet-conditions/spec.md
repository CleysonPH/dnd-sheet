## Purpose

Acompanha as condições em que o personagem está durante a sessão e o nível de Exaustão, aplicando a penalidade da Exaustão do 5.5e nos testes de d20 e no deslocamento.

## ADDED Requirements

### Requirement: Condições ativas
A ficha SHALL permitir marcar e desmarcar, em Jogar e em Editar, as 14 condições do 5.5e além da Exaustão: agarrado, amedrontado, atordoado, caído, cego, enfeitiçado, envenenado, imobilizado, incapacitado, inconsciente, invisível, paralisado, petrificado e surdo. Cada condição marcada SHALL mostrar o resumo da sua regra ao ser tocada ou apontada. As condições SHALL não alterar valores calculados.

#### Scenario: Envenenado
- **WHEN** Thorin está em Jogar e Lyra marca a condição envenenado
- **THEN** a faixa de condições mostra "Envenenado", tocar nela mostra o resumo da regra, os valores da ficha não mudam e a marcação é salva

#### Scenario: Remover condição
- **WHEN** Thorin está envenenado e Lyra desmarca a condição
- **THEN** "Envenenado" sai da faixa

### Requirement: Nível de Exaustão
A ficha SHALL ter o nível de Exaustão, de 0 a 6, com controles para subir e descer 1 nível em Jogar e em Editar.

#### Scenario: Primeiro nível
- **WHEN** Thorin está sem Exaustão e Lyra sobe a Exaustão
- **THEN** a faixa mostra "Exaustão 1", e o nível é salvo

#### Scenario: Limites
- **WHEN** a Exaustão está em 0
- **THEN** o controle de descer fica indisponível, e em 6 o de subir fica indisponível

### Requirement: Exaustão nos testes de d20
Com Exaustão de nível N, as salvaguardas, as perícias, a iniciativa e o ataque mágico, inclusive o de magias com atributo próprio, SHALL ter 2 × N a menos. A origem de cada um desses valores SHALL mostrar a parcela "Exaustão N". A CD de magia e a Percepção passiva SHALL não mudar. Um valor manual SHALL substituir o valor calculado, já com a penalidade.

#### Scenario: Furtividade de Thorin
- **WHEN** Thorin, com DES 14 e sem proficiência em Furtividade, está com Exaustão 1
- **THEN** a Furtividade é +0, e a origem mostra o modificador de DES +2 e "Exaustão 1" −2

#### Scenario: Percepção passiva não cai
- **WHEN** Thorin, com Percepção +4 e Percepção passiva 14, fica com Exaustão 1
- **THEN** a Percepção passa a +2 e a Percepção passiva continua 14

#### Scenario: Conjuradora exausta
- **WHEN** Elara, nível 3, com INT 16 e conjuração Inteligência, está com Exaustão 2
- **THEN** o ataque mágico é +1 e a CD de magia continua 13

#### Scenario: Sem Exaustão
- **WHEN** a Exaustão volta a 0
- **THEN** os valores voltam ao que eram e a parcela "Exaustão" some da origem

### Requirement: Exaustão no deslocamento
Com Exaustão de nível N, o deslocamento SHALL ter 1,5 × N metros a menos, sem ficar abaixo de 0, e a origem do deslocamento SHALL mostrar a parcela "Exaustão N".

#### Scenario: Thorin cansado
- **WHEN** Thorin, com deslocamento 9 m, está com Exaustão 2
- **THEN** o deslocamento é 6 m

#### Scenario: Deslocamento não fica negativo
- **WHEN** um personagem com deslocamento 3 m está com Exaustão 3
- **THEN** o deslocamento é 0 m

### Requirement: Exaustão 6
Com Exaustão 6, a ficha SHALL mostrar o aviso de que o personagem morre por Exaustão.

#### Scenario: Aviso de morte
- **WHEN** Lyra sobe a Exaustão de Thorin de 5 para 6
- **THEN** a ficha mostra o aviso de que Thorin morre por Exaustão

### Requirement: Faixa de condições
As condições e a Exaustão SHALL aparecer numa faixa logo abaixo da faixa de topo. Para o dono da ficha, a faixa SHALL estar sempre visível, com a opção de acrescentar condições. Na ficha compartilhada, a faixa SHALL mostrar só as condições marcadas e a Exaustão acima de 0, sem controles, e SHALL ficar oculta quando não houver nenhuma delas.

#### Scenario: Celular
- **WHEN** Lyra abre Thorin, envenenado, num celular com 375 px de largura
- **THEN** a faixa de condições aparece logo depois da faixa de topo, sem rolagem horizontal

#### Scenario: Ficha compartilhada sem condições
- **WHEN** alguém abre o link compartilhado de Thorin, sem condições e sem Exaustão
- **THEN** a faixa de condições não aparece

### Requirement: Valores iniciais das condições
Uma ficha nova, e uma ficha gravada antes de existirem estes campos, SHALL começar sem condições marcadas e com Exaustão 0.

#### Scenario: Ficha antiga
- **WHEN** Lyra abre "Thorin", gravada antes desta mudança
- **THEN** a faixa de condições não tem condições marcadas e mostra Exaustão 0, e os valores calculados não mudam
