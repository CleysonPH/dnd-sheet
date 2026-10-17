# sheet-attacks Specification

## Purpose

Configura nas fontes da ficha os ataques, as salvaguardas e as curas que elas dão, e mostra na ficha o acerto, a CD e o dano já calculados com os valores do personagem, sem rolar dados.

## Requirements

### Requirement: Ações nas fontes
Todo talento, traço, item e magia SHALL poder ter até 6 ações, criadas, editadas, reordenadas e excluídas no formulário da fonte, em Editar. Cada ação SHALL ter um nome opcional de até 50 caracteres e ser resolvida por ataque, por salvaguarda ou de forma automática. Uma ficha ou entrada do compêndio gravada antes das ações SHALL abrir com todas as fontes sem ações.

#### Scenario: Arma versátil
- **WHEN** Lyra, em Editar, dá ao "Machado de Batalha" de Thorin duas ações de ataque, "Uma mão" com 1d8 cortante e "Duas mãos" com 1d10 cortante
- **THEN** o machado passa a ter as duas ações, e elas são salvas na ficha

#### Scenario: Sétima ação
- **WHEN** uma fonte já tem 6 ações
- **THEN** o formulário não permite criar outra

#### Scenario: Ficha antiga
- **WHEN** Lyra abre uma ficha gravada antes das ações
- **THEN** a ficha abre com todos os dados que tinha, as fontes sem ações e nenhum valor calculado alterado

#### Scenario: Ações em Jogar
- **WHEN** Thorin está em Jogar
- **THEN** as ações aparecem só para leitura, e a ficha não oferece criar, editar nem excluir ações

### Requirement: Partes de dano e cura
Cada ação SHALL ter de 1 a 4 partes. Cada parte SHALL ter: quantidade de dados, de 0 a 40; o dado (d4, d6, d8, d10, d12 ou d20); um atributo ou nenhum; um bônus, em expressão com a mesma gramática dos efeitos; e um tipo, que é um dos 13 tipos de dano, cura ou PV temporários. A parte SHALL ser mostrada como dados, mais o modificador do atributo e o bônus somados num número só, seguido do tipo. As partes da ação SHALL ser mostradas juntas, ligadas por "+".

#### Scenario: Dois danos no mesmo acerto
- **WHEN** Ária, CAR 18, tem o "Alaúde do Trovão Retumbante" com uma ação de ataque que tem duas partes: 1d4 com o atributo do ataque, concussão, e 2d8 sem atributo, trovejante
- **THEN** a ação mostra o dano "1d4+4 concussão + 2d8 trovejante"

#### Scenario: Modificador negativo
- **WHEN** Ária, FOR 8, tem uma "Clava" com uma parte 1d4 com FOR, concussão
- **THEN** o dano aparece como "1d4-1 concussão"

#### Scenario: Sem dados
- **WHEN** Thorin, FOR 16, tem o "Ataque Desarmado" com uma parte de 0 dados, bônus 1, com FOR, concussão
- **THEN** o dano aparece como "4 concussão"

#### Scenario: Bônus inválido
- **WHEN** Lyra digita "2 * nivel +" no bônus de uma parte
- **THEN** o campo indica o erro da expressão e a parte inválida não é salva

### Requirement: Acerto da ação de ataque
Uma ação de ataque SHALL ser corpo a corpo ou à distância e ter um atributo, uma proficiência (automática, sempre ou nunca) e um bônus em expressão. O acerto SHALL ser o modificador do atributo, mais o bônus de proficiência quando proficiente, mais o bônus da ação, mais a penalidade da Exaustão. O acerto SHALL mostrar a origem, com uma parcela para cada um desses valores, como os outros valores calculados.

#### Scenario: Machado de Thorin
- **WHEN** Thorin, FOR 16, nível 5, proficiente com armas marciais, tem o Machado de Batalha marcial equipado, com as ações "Uma mão" (1d8 cortante) e "Duas mãos" (1d10 cortante), ataque e dano com FOR
- **THEN** a lista Ataques mostra "Uma mão" com +6 e "1d8+3 cortante", e "Duas mãos" com +6 e "1d10+3 cortante"

#### Scenario: Arma mágica
- **WHEN** a ação de uma "Espada Longa +1" de Thorin tem bônus 1 no acerto e uma parte 1d8 com FOR e bônus 1
- **THEN** a lista mostra +7 e "1d8+4 cortante", e a origem do acerto tem a parcela de bônus da ação +1

#### Scenario: Exaustão no acerto
- **WHEN** Thorin, com o Machado de Batalha em +6, fica com Exaustão 1
- **THEN** o acerto passa a +4, com a parcela "Exaustão 1" −2, e o dano não muda

### Requirement: Proficiência automática com armas
Com a proficiência automática, uma ação de ataque de um item de categoria arma SHALL ser proficiente quando a ficha tiver proficiência na categoria do item (simples ou marcial), marcada ou concedida, ou numa arma com o mesmo nome do item, sem diferenciar maiúsculas. Em outras fontes, a proficiência automática SHALL ser proficiente. "Sempre" e "nunca" SHALL ignorar as proficiências da ficha.

#### Scenario: Arma marcial sem proficiência
- **WHEN** Ária, DES 14, nível 5, proficiente só com armas simples, tem uma "Rapieira" marcial com uma ação de ataque com acuidade e proficiência automática
- **THEN** a lista mostra a Rapieira com +2, sem a parcela de proficiência

#### Scenario: Proficiência com a arma pelo nome
- **WHEN** Lyra acrescenta "rapieira" às armas de Ária
- **THEN** a Rapieira passa a +5

#### Scenario: Talento que concede a categoria
- **WHEN** Ária ganha um talento ativo que concede proficiência com armas marciais
- **THEN** a Rapieira passa a +5, e volta a +2 quando o talento é excluído

#### Scenario: Nunca proficiente
- **WHEN** uma ação de ataque de Thorin está marcada como nunca proficiente
- **THEN** o acerto não inclui o bônus de proficiência, mesmo com a proficiência na categoria

### Requirement: Atributos especiais da ação
O atributo do acerto e o das partes SHALL poder ser um dos seis atributos, nenhum, acuidade ou conjuração. As partes de uma ação de ataque SHALL poder usar também o mesmo atributo do acerto. Acuidade SHALL ser o maior modificador entre FOR e DES. Conjuração SHALL ser o atributo de conjuração da magia, se ela tiver um próprio, e o da ficha nos outros casos.

#### Scenario: Acuidade escolhe a Destreza
- **WHEN** Ária, FOR 8 e DES 14, tem a Rapieira com acerto por acuidade e a parte 1d8 com o atributo do ataque, perfurante
- **THEN** o dano aparece como "1d8+2 perfurante"

#### Scenario: Acuidade escolhe a Força
- **WHEN** Thorin, FOR 16 e DES 12, usa uma "Adaga" com acerto por acuidade e proficiência automática, sendo proficiente com armas simples, nível 5
- **THEN** a adaga mostra +6

#### Scenario: Conjuração com atributo próprio
- **WHEN** Ária, conjuração Carisma, nível 5, tem "Raio de Fogo" com atributo próprio Inteligência, INT 12, e uma ação de ataque com conjuração
- **THEN** o acerto é +4, com o modificador de INT +1 e o PB +3, e não +7

### Requirement: Ataque com conjuração
Uma ação de ataque com o atributo conjuração e proficiência automática SHALL mostrar como acerto o ataque mágico da magia, mais o bônus da ação. O ataque mágico SHALL ser o da ficha, com o valor manual quando houver, se a fonte usar o atributo da ficha, ou o calculado para o atributo próprio da magia. Os efeitos ativos de ataque mágico e a Exaustão SHALL valer como valem no ataque mágico.

#### Scenario: Raio de Fogo de Elara
- **WHEN** Elara, INT 16, nível 3, conjuração Inteligência, tem o truque "Raio de Fogo" com uma ação de ataque à distância com conjuração e a parte 1d10 fogo
- **THEN** a lista mostra +5 e "1d10 fogo"

#### Scenario: Valor manual do ataque mágico
- **WHEN** Lyra põe +8 como valor manual do ataque mágico de Elara
- **THEN** o Raio de Fogo passa a +8

#### Scenario: Item que soma no ataque mágico
- **WHEN** Elara, sem valor manual, sintoniza uma varinha com somar 1 no ataque mágico
- **THEN** o Raio de Fogo passa a +6

### Requirement: Ação de salvaguarda
Uma ação de salvaguarda SHALL ter o atributo da salvaguarda do alvo, a CD e o que acontece no sucesso: nada ou metade do dano. A CD SHALL ser a CD de magia, calculada como o ataque com conjuração, mais um ajuste inteiro, ou uma expressão com a gramática dos efeitos. A lista SHALL mostrar o atributo, a CD, o dano e, com metade no sucesso, a indicação "metade no sucesso".

#### Scenario: Zombaria Viciosa
- **WHEN** Ária, CAR 18, nível 5, conjuração Carisma, tem o truque "Zombaria Viciosa" com salvaguarda de SAB pela CD de magia, nada no sucesso, e uma parte 1d6 psíquico com escala por nível
- **THEN** a lista mostra "SAB CD 15" e "2d6 psíquico"

#### Scenario: Bola de Fogo
- **WHEN** Elara, INT 16, nível 5, tem "Bola de Fogo" preparada, com salvaguarda de DES pela CD de magia, metade no sucesso, e uma parte 8d6 fogo
- **THEN** a lista mostra "DES CD 14", "8d6 fogo" e "metade no sucesso"

#### Scenario: CD por expressão
- **WHEN** Kriv, CON 14, nível 11, tem o traço "Sopro de Dragão" com salvaguarda de DES pela expressão "8 + con.mod + pb", metade no sucesso
- **THEN** a lista mostra "DES CD 14"

### Requirement: Ação automática
Uma ação automática SHALL mostrar só as partes, sem acerto nem CD. As partes de cura e de PV temporários SHALL ser mostradas com os tipos "cura" e "PV temporários".

#### Scenario: Palavra Curativa
- **WHEN** Ária, CAR 18, tem "Palavra Curativa" preparada, com uma ação automática e a parte 2d4 com conjuração, cura
- **THEN** a lista mostra "2d4+4 cura"

#### Scenario: Mísseis Mágicos
- **WHEN** Elara tem "Mísseis Mágicos" preparada, com uma ação automática "Por míssil" e a parte 1d4 com bônus 1, energia
- **THEN** a lista mostra "Por míssil" com "1d4+1 energia"

### Requirement: Escala por nível do personagem
Uma parte SHALL poder escalar pelo nível do personagem: a quantidade de dados é multiplicada por 1 do nível 1 ao 4, por 2 do 5 ao 10, por 3 do 11 ao 16 e por 4 do 17 em diante. Uma ação SHALL poder escalar o número de ataques pelos mesmos níveis, e a lista SHALL mostrar a quantidade, como "×2", quando for maior que 1.

#### Scenario: Truque cresce com o nível
- **WHEN** Elara tem "Raio de Fogo" com a parte 1d10 fogo com escala por nível e passa do nível 4 ao 5
- **THEN** o dano passa de "1d10 fogo" para "2d10 fogo", e no nível 11 passa para "3d10 fogo"

#### Scenario: Sopro do Draconato
- **WHEN** Kriv, nível 11, tem o "Sopro de Dragão" com a parte 1d10 fogo com escala por nível
- **THEN** a lista mostra "3d10 fogo"

#### Scenario: Raios da Rajada Mística
- **WHEN** Ária, nível 5, tem "Rajada Mística" com uma ação de ataque com escala de ataques e a parte 1d10 energia sem escala
- **THEN** a lista mostra "×2" com +7 e "1d10 energia"

#### Scenario: Nível 1 sem multiplicador
- **WHEN** uma ação com escala de ataques está numa ficha de nível 1
- **THEN** a lista não mostra a quantidade de ataques

### Requirement: Dados por círculo maior
Numa magia de 1º círculo ou acima, cada parte SHALL poder ter de 0 a 20 dados extras, do mesmo dado da parte, por círculo acima do da magia. Quando houver dados extras, a lista SHALL mostrá-los depois do dano da parte, como "(+1d6/círculo)". Em truques e nas outras fontes, o campo SHALL não aparecer e SHALL ser ignorado.

#### Scenario: Bola de Fogo em círculo maior
- **WHEN** a parte 8d6 fogo da "Bola de Fogo" de Elara tem 1 dado extra por círculo
- **THEN** a lista mostra "8d6 fogo (+1d6/círculo)"

#### Scenario: Cura em círculo maior
- **WHEN** a parte de cura da "Palavra Curativa" de Ária tem 2 dados extras por círculo
- **THEN** a lista mostra "2d4+4 cura (+2d4/círculo)"

#### Scenario: Magia vira truque
- **WHEN** Lyra muda o círculo de uma magia com dados extras para truque
- **THEN** os dados extras deixam de aparecer na lista e no formulário

### Requirement: Lista Ataques
A ficha SHALL ter o cartão Ataques com uma linha por ação, mostrando o nome da fonte e o da ação, o alcance (corpo a corpo ou à distância) e os valores calculados. A lista SHALL incluir, nesta ordem: as ações dos itens equipados, na ordem do Inventário; as dos talentos e traços, na ordem de Características; e as dos truques e das magias preparadas ou sempre preparadas, por círculo e nome. A ficha SHALL NOT rolar dados.

#### Scenario: Item desequipado
- **WHEN** Thorin desequipa o Machado de Batalha
- **THEN** as ações do machado saem da lista Ataques e continuam no cartão do item

#### Scenario: Magia não preparada
- **WHEN** Elara desmarca "Bola de Fogo" como preparada, em Jogar
- **THEN** a Bola de Fogo sai da lista Ataques, e o Raio de Fogo, que é truque, continua

#### Scenario: Ordem da lista
- **WHEN** Ária tem a Rapieira equipada, o traço "Inspiração de Bardo" com uma ação, "Palavra Curativa" preparada e o truque "Zombaria Viciosa"
- **THEN** a lista mostra Rapieira, Inspiração de Bardo, Zombaria Viciosa e Palavra Curativa, nessa ordem

#### Scenario: Sem ações
- **WHEN** nenhuma fonte listada tem ações
- **THEN** em Jogar e na ficha compartilhada o cartão Ataques não aparece, e em Editar ele indica que as ações são criadas no formulário das fontes

#### Scenario: Ficha compartilhada
- **WHEN** um visitante abre o link compartilhado de Thorin
- **THEN** o cartão Ataques aparece com os mesmos valores, só para leitura

### Requirement: Ações no cartão da fonte
O cartão de cada fonte com ações SHALL mostrar as suas ações com os valores calculados, como na lista Ataques, mesmo quando a fonte não está na lista. O resultado do compêndio SHALL mostrar as ações com os valores de uma ficha nova.

#### Scenario: Magia não preparada mostra as ações
- **WHEN** Elara tem "Bola de Fogo" não preparada
- **THEN** o cartão da Bola de Fogo, na aba Magias, mostra "DES CD 14 · 8d6 fogo"

#### Scenario: Resultado do compêndio
- **WHEN** Lyra busca "Raio de Fogo" no painel do compêndio, e a entrada tem a ação de ataque com conjuração e 1d10 fogo
- **THEN** o resultado mostra a ação com o dano "1d10 fogo"
