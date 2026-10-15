# sheet-effects Specification

## Purpose

Faz as fontes da ficha (talentos, traços, itens e magias) alterarem os valores calculados por meio de efeitos com alvo, operação, valor e condições, incluindo o cálculo da CA, e mostra de onde vem cada número.

## Requirements

### Requirement: Efeitos nas fontes
No modo Editar, toda fonte SHALL poder ter até 20 efeitos, que podem ser criados, alterados e removidos no formulário da fonte. Cada efeito SHALL ter alvo, operação, valor e as condições opcionais "sem armadura" e "sem escudo". A fonte SHALL mostrar um resumo dos seus efeitos.

#### Scenario: Efeito no Anel de Proteção
- **WHEN** Lyra, em Editar, acrescenta ao "Anel de Proteção" o efeito somar 1 na CA
- **THEN** o anel mostra o resumo "+1 CA" e o efeito é salvo na ficha

#### Scenario: Remover efeito
- **WHEN** Lyra remove o efeito do Anel de Proteção
- **THEN** o anel deixa de alterar a CA

### Requirement: Fonte ativa
Os efeitos de uma fonte SHALL valer só enquanto ela estiver ativa. Talentos e traços estão sempre ativos, itens quando ativos (equipados e, se exigirem, sintonizados) e magias quando marcadas como "em efeito".

#### Scenario: Item desequipado
- **WHEN** Thorin desequipa o Anel de Proteção, que soma 1 na CA
- **THEN** a CA cai 1 ponto

#### Scenario: Magia em efeito
- **WHEN** Elara, com DES 17 e sem armadura, tem a magia "Armadura Arcana" com o efeito base alternativa de CA `13 + des.mod`, e Lyra a marca como em efeito
- **THEN** a CA de Elara passa de 13 para 16, e volta a 13 quando a marcação é removida

### Requirement: Alvos e operações
Os alvos SHALL ser escolhidos numa lista: valor de atributo, salvaguarda de um atributo, todas as salvaguardas, perícia, todas as perícias, CA, iniciativa, deslocamento, PV máximo, percepção passiva, CD de magia e ataque mágico. A operação "somar" SHALL valer para todos os alvos. "Base alternativa" SHALL valer só para a CA, "definir" só para atributos e deslocamento, e "proficiência" só para salvaguardas e perícias.

#### Scenario: Operação incompatível
- **WHEN** Lyra escolhe o alvo PV máximo
- **THEN** a ficha oferece só a operação somar

#### Scenario: Bastão do Pacto
- **WHEN** Lyra cria no "Bastão do Pacto", que requer sintonização, os efeitos somar `1` na CD de magia e somar `1` no ataque mágico
- **THEN** a ficha oferece só a operação somar para esses alvos e, com o bastão sintonizado, a CD e o ataque sobem 1

### Requirement: Expressões
O valor de um efeito SHALL ser uma expressão de até 100 caracteres com números inteiros, `+`, `-`, `*`, `/` (divisão arredondada para baixo), parênteses, `min(...)`, `max(...)` e as variáveis `for`, `des`, `con`, `int`, `sab`, `car` (valores), as mesmas com `.mod` (modificadores), `nivel`, `pb` e `conj.mod` (modificador do atributo de conjuração da ficha, 0 sem atributo). A ficha SHALL mostrar o resultado da expressão enquanto ela é digitada e recusar, sem salvar, expressões inválidas.

#### Scenario: Pré-visualização
- **WHEN** Lyra digita `10 + des.mod + con.mod` num efeito de Thorin, que tem DES 14 e CON 16
- **THEN** o campo mostra o resultado 15

#### Scenario: Divisão
- **WHEN** um efeito usa `nivel / 2` num personagem de nível 5
- **THEN** o valor do efeito é 2

#### Scenario: Expressão inválida
- **WHEN** Lyra digita `10 + des.mod +` ou `10 + força`
- **THEN** o campo indica que a expressão é inválida, citando o problema, e a expressão não é salva

#### Scenario: Modificador de conjuração
- **WHEN** Ária, bardo com CAR 16 e conjuração Carisma, tem um tracker com máximo `max(1, conj.mod)`
- **THEN** o máximo é 3, e passa a 1 se a ficha ficar sem atributo de conjuração

### Requirement: Somar
Os efeitos de somar ativos SHALL ser somados ao valor calculado do alvo. Um efeito em "todas as salvaguardas" ou "todas as perícias" SHALL somar em cada uma.

#### Scenario: Talento Alerta
- **WHEN** Thorin, com iniciativa +2 e PB +3, tem o talento "Alerta" com o efeito somar `pb` na iniciativa
- **THEN** a iniciativa de Thorin é +5

#### Scenario: Talento Robusto
- **WHEN** Thorin, nível 5 com 55 de PV máximo, tem o talento "Robusto" com o efeito somar `2 * nivel` no PV máximo
- **THEN** o PV máximo de Thorin é 65

#### Scenario: Anel em todas as salvaguardas
- **WHEN** o Anel de Proteção ativo soma 1 em todas as salvaguardas de Thorin, que tem FOR +6 e DES +2
- **THEN** as salvaguardas de FOR e DES passam a +7 e +3, e as demais também sobem 1

#### Scenario: Deslocamento
- **WHEN** Thorin, com deslocamento 9 m, tem um traço que soma 3 no deslocamento
- **THEN** o deslocamento mostrado é 12 m

### Requirement: Definir
Um efeito de definir SHALL tornar o valor do alvo o maior entre o valor base e o resultado do efeito. Havendo vários, SHALL valer o maior. Os valores que dependem do atributo SHALL usar o valor definido.

#### Scenario: Manoplas de Força do Ogro
- **WHEN** Thorin, com FOR 16, sintoniza e equipa "Manoplas de Força do Ogro", que definem FOR 19
- **THEN** a FOR passa a 19, o modificador a +4 e Atletismo, com proficiência, a +7

#### Scenario: Atributo já maior
- **WHEN** um personagem com FOR 20 usa as mesmas manoplas
- **THEN** a FOR continua 20

### Requirement: Proficiência por efeito
Um efeito de proficiência SHALL dar metade, proficiência ou expertise na salvaguarda ou perícia alvo, ou em todas. O multiplicador SHALL ser o maior entre o marcado na ficha e os dos efeitos ativos. Metade SHALL somar metade do bônus de proficiência, arredondada para baixo.

#### Scenario: Pau para Toda Obra
- **WHEN** um bardo nível 5 (PB +3), com CAR 10 e proficiente só em Atuação, tem o traço "Pau para Toda Obra" com proficiência metade em todas as perícias
- **THEN** as perícias sem proficiência recebem +1, e Atuação continua com +3

#### Scenario: Expertise por efeito
- **WHEN** Elara, nível 3 com DES 17 e proficiente em Furtividade, tem um traço com expertise em Furtividade
- **THEN** a Furtividade de Elara é +7

### Requirement: Cálculo da CA
A CA SHALL ser a maior entre as bases válidas, somada ao bônus do escudo ativo e aos efeitos de somar. As bases são: 10 + modificador de DES, quando não há armadura ativa; a fórmula da armadura ativa; e as bases alternativas ativas cujas condições são atendidas. As fórmulas são: armadura leve, CA base + DES; média, CA base + DES até +2; pesada, só a CA base. Com mais de uma armadura ou escudo ativo, SHALL valer o maior.

#### Scenario: Sem armadura e sem efeitos
- **WHEN** um personagem com DES 14 não tem armadura nem efeitos de CA
- **THEN** a CA é 12

#### Scenario: Defesa sem Armadura do Bárbaro
- **WHEN** Thorin, com DES 14 e CON 16, tem o traço "Defesa sem Armadura" com a base alternativa `10 + des.mod + con.mod` e a condição sem armadura
- **THEN** a CA de Thorin é 15, e passa a 17 ao equipar um escudo de +2

#### Scenario: Armadura pesada
- **WHEN** Thorin, com a Defesa sem Armadura, equipa uma "Cota de Malha" pesada de CA base 16
- **THEN** a Defesa sem Armadura deixa de valer e a CA é 16

#### Scenario: Armadura leve e média
- **WHEN** Thorin, com DES 14, equipa um "Couro Batido" leve de CA base 12, e Elara, com DES 17, equipa uma "Cota de Escamas" média de CA base 14
- **THEN** a CA de Thorin é 14 e a de Elara é 16

### Requirement: Condições sem armadura e sem escudo
Um efeito com a condição "sem armadura" SHALL valer só quando nenhuma armadura estiver ativa, e um efeito com "sem escudo" só quando nenhum escudo estiver ativo. As duas condições podem ser combinadas.

#### Scenario: Defesa sem Armadura do Monge
- **WHEN** Kai, monge com DES 16 e SAB 15, tem a base alternativa `10 + des.mod + sab.mod` com as condições sem armadura e sem escudo
- **THEN** a CA de Kai é 15, e com um escudo de +2 equipado passa a 15 (10 + DES + escudo), porque a Defesa sem Armadura deixa de valer

### Requirement: Dependência circular
Quando efeitos de atributos dependerem uns dos outros em ciclo, os efeitos do ciclo SHALL ser ignorados, os atributos SHALL manter o valor sem esses efeitos e a ficha SHALL sinalizar os efeitos envolvidos, sem travar.

#### Scenario: FOR e DES em ciclo
- **WHEN** um item define FOR como `des.mod + 10` e outro item define DES como `for.mod + 10`, os dois ativos
- **THEN** FOR e DES mantêm os valores da ficha, e os dois efeitos aparecem sinalizados como dependência circular

#### Scenario: Atributo que depende de si mesmo
- **WHEN** um efeito soma `for.mod` na própria FOR
- **THEN** o efeito é ignorado e sinalizado como dependência circular

### Requirement: Origem dos valores
O painel de cada valor calculado SHALL listar as contribuições que formam o valor: a base, cada efeito ativo com a fonte e o quanto soma, e as bases ou definições que não foram usadas por serem menores.

#### Scenario: Composição da CA
- **WHEN** Thorin está sem armadura, com a Defesa sem Armadura (15), um escudo de +2 e o Anel de Proteção ativo (+1)
- **THEN** o painel da CA mostra 18, formado por Defesa sem Armadura 15, escudo +2 e Anel de Proteção +1, e lista a base 10 + DES (12) como não usada
