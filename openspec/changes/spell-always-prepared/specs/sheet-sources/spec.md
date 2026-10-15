## MODIFIED Requirements

### Requirement: Campos de magia
Uma magia SHALL ter: círculo (truque ou 1º a 9º); escola (abjuração, adivinhação, conjuração, encantamento, evocação, ilusão, necromancia ou transmutação); origem (a classe, o talento ou o item que dá a magia); tempo de conjuração; alcance; duração; componentes V, S e M, com o texto do material quando houver M; preparação (não preparada, preparada ou sempre preparada); e as marcações concentração, ritual e em efeito. Os campos de texto SHALL ter até 100 caracteres.

#### Scenario: Magia completa
- **WHEN** Lyra cria "Mísseis Mágicos", 1º círculo, evocação, mago, 1 ação, 36 m, instantânea, componentes V e S
- **THEN** a aba Magias mostra "Mísseis Mágicos" no 1º círculo com esses dados

#### Scenario: Material
- **WHEN** Lyra marca o componente M de uma magia e informa "um pouco de pó de diamante"
- **THEN** a magia mostra os componentes com o material descrito

#### Scenario: Em efeito
- **WHEN** Lyra marca "Armadura Arcana" como em efeito
- **THEN** a aba Magias sinaliza a magia como em efeito

#### Scenario: Magia de talento sempre preparada
- **WHEN** Lyra cria "Passo Nebuloso", 2º círculo, com origem "Tocado pelas Fadas" e preparação "Sempre preparada"
- **THEN** a aba Magias mostra "Passo Nebuloso" com a etiqueta "Sempre preparada" e a origem "Tocado pelas Fadas"

#### Scenario: Truque sem preparação
- **WHEN** Lyra edita uma magia de 1º círculo sempre preparada e muda o círculo para truque
- **THEN** a magia fica sem preparação, e a ficha não oferece a escolha de preparação para truques

### Requirement: Magias por círculo
A aba Magias SHALL agrupar as magias por círculo, em ordem do truque ao 9º, e dentro de cada círculo em ordem alfabética. Truques SHALL não ter preparação. A aba SHALL mostrar, separadamente, quantas magias de 1º círculo ou acima estão preparadas e quantas estão sempre preparadas.

#### Scenario: Agrupamento
- **WHEN** Elara conhece "Mãos Mágicas" (truque), "Sono" (1º) e "Enfeitiçar Pessoa" (1º)
- **THEN** a aba mostra o grupo Truques com "Mãos Mágicas" e o grupo 1º círculo com "Enfeitiçar Pessoa" e depois "Sono"

#### Scenario: Contagem de preparadas
- **WHEN** Elara tem "Sono" preparada e "Enfeitiçar Pessoa" não preparada
- **THEN** a aba indica 1 magia preparada

#### Scenario: Sempre preparadas contadas à parte
- **WHEN** Elara tem "Sono" preparada, "Passo Nebuloso" e "Bênção" sempre preparadas, e "Enfeitiçar Pessoa" não preparada
- **THEN** a aba indica 1 magia preparada e 2 sempre preparadas

### Requirement: Ações de mesa nas fontes
No modo Jogar, a ficha SHALL permitir equipar e desequipar itens, sintonizar e dessintonizar itens que requerem sintonização, aumentar e diminuir a quantidade de itens, marcar e desmarcar magias como preparadas e marcar e desmarcar magias como em efeito. Uma magia sempre preparada SHALL NOT poder ser despreparada em Jogar. Criar, editar e excluir fontes SHALL não estar disponível em Jogar.

#### Scenario: Usar uma azagaia na mesa
- **WHEN** Thorin está em Jogar com 4 Azagaias e Lyra diminui a quantidade em 1
- **THEN** a ficha mostra 3 Azagaias e a carga total cai 1 kg

#### Scenario: Sem edição em Jogar
- **WHEN** Thorin está em Jogar
- **THEN** a ficha não oferece criar, editar nem excluir fontes

#### Scenario: Conjurar na mesa
- **WHEN** Elara está em Jogar e Lyra marca "Armadura Arcana" como em efeito
- **THEN** a magia fica em efeito e os efeitos dela passam a valer

#### Scenario: Sempre preparada na mesa
- **WHEN** Elara está em Jogar com "Passo Nebuloso" sempre preparada
- **THEN** a magia mostra a etiqueta "Sempre preparada", sem a opção de despreparar, enquanto "Sono" continua podendo ser marcada e desmarcada como preparada
