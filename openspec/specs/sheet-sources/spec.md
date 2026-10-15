# sheet-sources Specification

## Purpose

Guarda dentro da ficha as fontes do personagem (talentos, traços, itens e magias), digitadas pelo jogador, com os campos de cada tipo, a ativação dos itens e a organização em abas.

## Requirements

### Requirement: Abas de fontes
A ficha SHALL mostrar, abaixo dos atributos, as abas Características (talentos e traços), Inventário (itens) e Magias, cada uma com a quantidade de fontes que contém. Uma aba sem fontes SHALL indicar que está vazia.

#### Scenario: Abas com contagem
- **WHEN** Thorin tem 2 traços, 1 talento e 3 itens, e nenhuma magia
- **THEN** as abas mostram Características (3), Inventário (3) e Magias (0)

#### Scenario: Aba vazia
- **WHEN** Lyra abre a aba Magias de Thorin
- **THEN** a aba indica que ainda não há magias

#### Scenario: Ficha antiga
- **WHEN** Lyra abre uma ficha gravada antes de existirem fontes
- **THEN** a ficha abre com as três abas vazias e com todos os dados que já tinha

### Requirement: Criar fonte
No modo Editar, cada aba SHALL permitir criar uma fonte do seu tipo: talento ou traço em Características, item em Inventário e magia em Magias. O nome SHALL ter de 1 a 100 caracteres e a descrição até 5.000. A nova fonte SHALL aparecer no fim da lista da aba, ou no seu círculo, no caso de magias.

#### Scenario: Novo traço
- **WHEN** Lyra, em Editar, cria em Características o traço "Fúria", de origem Classe, vindo de "Bárbaro"
- **THEN** "Fúria" aparece em Características com a origem "Classe · Bárbaro" e é salvo na ficha

#### Scenario: Nome obrigatório
- **WHEN** Lyra tenta criar uma fonte com o nome em branco
- **THEN** o campo indica que o nome é obrigatório e a fonte não é criada

#### Scenario: Descrição longa demais
- **WHEN** Lyra digita uma descrição com mais de 5.000 caracteres
- **THEN** o campo indica o limite e o texto excedente não é salvo

### Requirement: Campos de talento e traço
Um talento SHALL ter uma categoria: origem, geral, estilo de luta ou dádiva épica. Um traço SHALL ter uma origem (classe, subclasse, espécie, antecedente ou outro) e, opcionalmente, de onde vem, em texto livre de até 100 caracteres.

#### Scenario: Talento com categoria
- **WHEN** Lyra cria o talento "Sentinela" com a categoria geral
- **THEN** Características mostra "Sentinela" identificado como talento geral

#### Scenario: Traço de espécie
- **WHEN** Lyra cria o traço "Visão no Escuro", de origem Espécie, vindo de "Anão"
- **THEN** Características mostra "Visão no Escuro" com a origem "Espécie · Anão"

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

### Requirement: Item ativo
Um item SHALL ser considerado ativo quando estiver equipado e, se requerer sintonização, também sintonizado. A ficha SHALL indicar quais itens estão ativos. Só itens que requerem sintonização SHALL poder ser marcados como sintonizados.

#### Scenario: Item sem sintonização
- **WHEN** Thorin equipa o "Machado Grande", que não requer sintonização
- **THEN** o Machado Grande aparece como ativo

#### Scenario: Item que requer sintonização
- **WHEN** Thorin equipa o "Anel de Proteção", que requer sintonização, sem sintonizá-lo
- **THEN** o anel aparece equipado, mas não ativo, e passa a ativo quando Lyra o marca como sintonizado

#### Scenario: Desequipar
- **WHEN** Thorin desequipa o Anel de Proteção sintonizado
- **THEN** o anel deixa de ser ativo e continua sintonizado

### Requirement: Limite de sintonização
A ficha SHALL mostrar quantos itens estão sintonizados e avisar quando houver mais de 3, sem impedir a marcação.

#### Scenario: Quarto item sintonizado
- **WHEN** Thorin já tem 3 itens sintonizados e Lyra sintoniza um quarto
- **THEN** o quarto item fica sintonizado e o Inventário avisa que o limite de 3 itens sintonizados foi ultrapassado

### Requirement: Carga total
O Inventário SHALL mostrar a carga total carregada, somando o peso unitário vezes a quantidade de todos os itens, em kg com até duas casas decimais.

#### Scenario: Carga de Thorin
- **WHEN** Thorin carrega 1 Machado Grande de 3,5 kg e 4 Azagaias de 1 kg
- **THEN** o Inventário mostra 7,5 kg de carga total

#### Scenario: Quantidade zero
- **WHEN** a quantidade de Azagaias de Thorin passa a 0
- **THEN** a carga total passa a 3,5 kg e a Azagaia continua listada

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

### Requirement: Magias por círculo
A aba Magias SHALL agrupar as magias por círculo, em ordem do truque ao 9º, e dentro de cada círculo em ordem alfabética. Truques SHALL não ter a marcação de preparada. A aba SHALL mostrar quantas magias de 1º círculo ou acima estão preparadas.

#### Scenario: Agrupamento
- **WHEN** Elara conhece "Mãos Mágicas" (truque), "Sono" (1º) e "Enfeitiçar Pessoa" (1º)
- **THEN** a aba mostra o grupo Truques com "Mãos Mágicas" e o grupo 1º círculo com "Enfeitiçar Pessoa" e depois "Sono"

#### Scenario: Contagem de preparadas
- **WHEN** Elara tem "Sono" preparada e "Enfeitiçar Pessoa" não preparada
- **THEN** a aba indica 1 magia preparada

### Requirement: Descrição em Markdown básico
A descrição de toda fonte SHALL ser exibida com formatação básica: parágrafos separados por linha em branco, quebras de linha, negrito com `**texto**`, itálico com `*texto*` e listas com `- ` ou `1. `. Qualquer outro conteúdo SHALL aparecer como texto, sem ser interpretado como HTML.

#### Scenario: Negrito e lista
- **WHEN** a descrição de "Fúria" é "Enquanto em **Fúria**:\n- vantagem em testes de FOR\n- resistência a dano físico"
- **THEN** a ficha mostra "Fúria" em negrito e uma lista com os dois itens

#### Scenario: HTML não é interpretado
- **WHEN** a descrição de uma fonte contém `<script>alert(1)</script>` ou `<b>texto</b>`
- **THEN** a ficha mostra esses caracteres literalmente e nada é executado nem formatado

### Requirement: Editar e excluir fontes
No modo Editar, toda fonte SHALL poder ter seus campos alterados e ser excluída. A exclusão SHALL exigir uma confirmação na própria ficha. No modo Jogar, os campos SHALL aparecer só para leitura, exceto as ações de mesa.

#### Scenario: Editar uma fonte
- **WHEN** Lyra, em Editar, muda o peso da Azagaia de 1 para 1,5 kg
- **THEN** a Azagaia mostra 1,5 kg e a carga total é recalculada

#### Scenario: Excluir com confirmação
- **WHEN** Lyra, em Editar, escolhe excluir "Sentinela" e confirma
- **THEN** "Sentinela" some de Características e a exclusão é salva

#### Scenario: Desistir da exclusão
- **WHEN** Lyra escolhe excluir "Sentinela" e depois cancela
- **THEN** "Sentinela" continua na ficha

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
