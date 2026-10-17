# Proposal

## Why

A ficha não sabe atacar. Uma arma é só um item de categoria "arma", sem acerto nem dano. Uma magia de ataque, salvaguarda ou cura também não mostra o número que se usa na mesa. Por isso, o jogador faz as contas à parte: modificador, proficiência, acuidade, dado do truque que cresce com o nível, dano extra de um item mágico, metade no sucesso. A ficha já tem tudo isso: modificadores, PB, CD e ataque mágico, proficiência com armas e nível. Falta a estrutura do ataque, que junta esses valores no que o jogador lê na hora de agir.

## What Changes

- **Ações nas fontes**: talentos, traços, itens e magias ganham uma lista de ações. Cada ação é resolvida de um destes modos:
  - **ataque**: corpo a corpo ou à distância, com atributo, proficiência e bônus;
  - **salvaguarda**: atributo do alvo, CD de conjuração ou por expressão, e metade ou nada no sucesso;
  - **automática**: sem teste, como a cura ou os Mísseis Mágicos.
- **Vários danos por ação**: cada ação tem de 1 a 4 partes, cada uma com quantidade de dados, dado, atributo, bônus e tipo (os 13 tipos de dano, cura ou PV temporários). O Alaúde do Trovão Retumbante, por exemplo, é um acerto com `1d4+CAR` de concussão e `2d8` trovejante.
- **Atributos especiais**: no acerto e no dano, a ação aceita:
  - **acuidade**: o maior entre FOR e DES;
  - **conjuração**: o atributo de conjuração da magia ou da ficha;
  - **o mesmo do ataque**: só no dano.
- **Arma versátil**: vira duas ações, "Uma mão" e "Duas mãos".
- **Proficiência automática**: o item ganha a categoria de arma (simples ou marcial). Uma ação de arma é proficiente quando a ficha tem proficiência na categoria ou no nome da arma. A ação também pode ser marcada como sempre ou nunca proficiente.
- **Escala por nível do personagem**: uma parte pode multiplicar seus dados por 1, 2, 3 ou 4 nos níveis 1, 5, 11 e 17. Isso cobre os truques e o Sopro do Draconato. Uma ação também pode multiplicar o número de ataques nesses mesmos níveis, como os raios da Rajada Mística.
- **Círculo maior**: numa magia de 1º círculo ou acima, uma parte pode somar dados por círculo acima do da magia. O valor é mostrado ao lado do dano, por exemplo "8d6 fogo (+1d6/círculo)".
- **Lista "Ataques"**: um cartão novo, acima de Recursos, com as ações calculadas. Cada linha mostra o acerto com a origem, ou a CD e o atributo da salvaguarda, e o dano por tipo. A lista junta:
  - os itens equipados;
  - os truques e as magias preparadas ou sempre preparadas;
  - os talentos e traços.

  O cartão de cada fonte também mostra as suas ações.
- **Só exibição**: a ficha não rola dados. Os dados ficam estruturados (quantidade e dado) para que uma rolagem futura não precise de migração.
- **Formato 10 da ficha**: guarda as ações das fontes e a categoria de arma dos itens, com migração. O compêndio também ganha o passo de migração das fontes, porque suas entradas são fontes.

## Capabilities

### New Capabilities

- `sheet-attacks`: ações das fontes (ataque, salvaguarda e automática), partes de dano e cura, atributos especiais, proficiência automática, escala por nível, dados por círculo e a lista "Ataques" com os valores calculados.

### Modified Capabilities

- `sheet-sources`:
  - **Campos de item**: o item ganha a categoria de arma (simples ou marcial).
- `sheet-core-stats`:
  - **Organização da ficha na tela**: entra o cartão Ataques, antes de Recursos.

## Impact

- **Motor**:
  - `src/engine/sheet/`: formato 10 e migração 9 → 10;
  - `src/engine/sources/`: as ações no schema das fontes, a categoria de arma, os valores iniciais e o passo 9 de `SOURCE_MIGRATIONS`;
  - um módulo novo `src/engine/attacks/`, com o schema das ações e o cálculo das linhas, que reaproveita `deriveStats`, `spellcastingFor`, `deriveTraits` e as expressões dos efeitos.
- **Interface**:
  - o editor de ações no formulário de fonte, ao lado de efeitos e trackers;
  - o cartão Ataques;
  - o resumo das ações no cartão da fonte e no resultado do compêndio;
  - a ficha compartilhada.
- **Dados**: as fichas são migradas ao abrir, e o banco não precisa de migração. As entradas do compêndio no formato 9 são migradas ao ler. Nenhum valor calculado existente muda. Os itens existentes ficam com a categoria de arma "simples" e sem ações.
- **Fora do escopo**:
  - rolar dados, vantagem, desvantagem e crítico;
  - alvos de efeito para o acerto e o dano (Arquearia, Duelismo), que ficam para uma change própria;
  - munição e consumo automático de usos.
