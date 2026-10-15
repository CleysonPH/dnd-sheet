# Proposal

## Why

A ficha já calcula números e efeitos, mas não acompanha o que se gasta durante a sessão: usos de Fúria, Inspiração de Bardo, Pontos de Foco, espaços de magia. Hoje o jogador anota isso no papel e recarrega de cabeça ao descansar. É a última peça de automação do roadmap (D7 de `dnd-sheet-architecture`). Ela completa o uso da ficha na mesa: gastar um recurso com um toque e, ao fim do descanso, recuperar com um botão o que o 5.5e manda.

## What Changes

- **Trackers nas fontes**: cada talento, traço, item ou magia pode ter até 10 trackers. Cada tracker tem:
  - nome;
  - máximo por expressão, com as mesmas variáveis dos efeitos (ex.: Inspiração de Bardo = `max(1, car.mod)`);
  - quantidade usada;
  - uma regra de recarga para o descanso curto e outra para o longo: não recupera, recupera tudo ou recupera uma quantidade (expressão). Por exemplo, a Inspiração de Bardo recupera tudo no descanso longo e 1 no curto.

  O valor atual é o máximo menos o usado. Assim, se o máximo muda (CAR sobe, nível sobe), o atual acompanha.
- **Espaços de magia**: o jogador digita quantos espaços tem do 1º ao 9º círculo e marca os usados. Uma linha separada de **Magia de Pacto** (círculo e quantidade) recarrega no descanso curto.
- **Cartão "Recursos"**, logo abaixo da faixa de topo no celular e, em telas grandes, ao lado dos atributos, que passam a 2 colunas e 3 linhas:
  - mostra todos os trackers das fontes e os espaços de magia;
  - tem ações de mesa (gastar e recuperar) nos modos Jogar e Editar;
  - no modo Editar, também permite editar o máximo dos espaços.
- **Descanso curto**, com confirmação na ficha: aplica a regra de descanso curto de cada tracker e recupera a Magia de Pacto.
- **Descanso longo**, com confirmação na ficha: aplica a regra de descanso longo de cada tracker e recupera todos os espaços de magia. Também aplica a regra do 5.5e: PV ao máximo, PV temporário zerado, todos os dados de vida recuperados e testes contra a morte zerados.
- **Formato da ficha**: passa ao formato 5. As fontes ganham `trackers` e a ficha ganha `spellSlots` e `pactSlots`. As fichas do formato 4 são migradas sem trackers e sem espaços.

Fora do escopo:

- **Espaços calculados pela tabela de conjurador**, incluindo multiclasse.
- **Gastar dados de vida rolando a cura no descanso curto**: os dados continuam sendo gastos à mão, como hoje.
- **Desligar automaticamente as magias "em efeito" ou a concentração** ao descansar.
- **Trackers fora das fontes**: todo recurso pertence a uma fonte. Um recurso "solto" vira um traço.

## Capabilities

### New Capabilities

- `sheet-resources`: recursos que se gastam e recarregam. Cobre os trackers das fontes, os espaços de magia e de pacto, o cartão Recursos e os descansos curto e longo.

### Modified Capabilities

- `sheet-core-stats`:
  - **Modos Jogar e Editar**: passa a incluir, entre o que se altera em Jogar, os recursos (gastar e recuperar trackers e espaços) e os descansos.
  - **Organização da ficha na tela**: a partir de 1024 px, os atributos ficam em 2 colunas e 3 linhas, com o cartão Recursos ao lado.

## Impact

- **`src/engine/sheet/`**: formato 5 e migração do 4 para o 5.
- **`src/engine/resources/` (novo)**: schema dos trackers e dos espaços, cálculo do máximo e do atual de cada tracker e as funções puras `shortRest` e `longRest`. Reaproveita o parser de expressões de `src/engine/effects/`.
- **`src/components/sheet/`**:
  - cartão Recursos com os botões de descanso;
  - editor de trackers no formulário de fonte;
  - etiquetas de trackers nos cartões de fonte.
- **O que não muda**: o servidor, o banco e as dependências.
