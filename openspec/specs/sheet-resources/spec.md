# sheet-resources Specification

## Purpose

Acompanha os recursos que o personagem gasta durante a sessão (trackers das fontes e espaços de magia) e os recupera nos descansos curto e longo pelas regras do 5.5e.

## Requirements

### Requirement: Trackers nas fontes
No modo Editar, toda fonte SHALL poder ter até 10 trackers. Cada tracker SHALL ter um nome de 1 a 50 caracteres, o máximo como expressão (a mesma gramática e as mesmas variáveis dos efeitos), a quantidade usada e uma regra de recarga para o descanso curto e outra para o longo: não recupera, recupera tudo ou recupera uma quantidade, também dada por expressão. Expressões inválidas SHALL ser recusadas sem salvar.

#### Scenario: Inspiração de Bardo
- **WHEN** Lyra, em Editar, acrescenta ao traço "Inspiração de Bardo" de Ária, bardo nível 5 com CAR 16, um tracker "Inspiração" com máximo `max(1, car.mod)`, que recupera tudo no descanso longo e 1 no descanso curto
- **THEN** o tracker mostra 3 de 3, com as regras "curto: 1" e "longo: tudo", e é salvo na ficha

#### Scenario: Máximo inválido
- **WHEN** Lyra digita `max(1, carisma)` como máximo de um tracker
- **THEN** o campo indica que a expressão é inválida e nada é salvo

### Requirement: Valor atual dos trackers
O valor atual de um tracker SHALL ser o máximo menos a quantidade usada, sem ficar abaixo de 0. Quando o máximo mudar, o valor atual SHALL mudar na mesma quantidade. Um máximo que resulte em número negativo ou em erro de avaliação SHALL valer 0, e o tracker SHALL ser sinalizado no caso de erro.

#### Scenario: Atributo sobe
- **WHEN** Ária está com 2 de 3 Inspirações e Lyra muda o CAR dela de 16 para 18
- **THEN** o tracker mostra 3 de 4

#### Scenario: Mínimo da expressão
- **WHEN** um bardo com CAR 8 tem o tracker de Inspiração com máximo `max(1, car.mod)`
- **THEN** o tracker mostra 1 de 1

### Requirement: Gastar e recuperar
Nos modos Jogar e Editar, cada tracker SHALL permitir gastar 1 e recuperar 1, sem passar de 0 nem do máximo.

#### Scenario: Gastar Inspiração
- **WHEN** Ária tem 3 de 3 Inspirações e Lyra gasta uma
- **THEN** o tracker mostra 2 de 3 e o valor é salvo

#### Scenario: Limites
- **WHEN** um tracker está em 0, ou no máximo
- **THEN** não é possível gastar abaixo de 0 nem recuperar acima do máximo

### Requirement: Espaços de magia
A ficha SHALL ter espaços de magia do 1º ao 9º círculo, cada um com o máximo, um inteiro de 0 a 20 editável no modo Editar, e a quantidade usada. A ficha SHALL ter também a Magia de Pacto, com círculo de 1 a 9 e máximo de 0 a 20. Só os círculos com máximo maior que 0 SHALL aparecer em Jogar. Gastar e recuperar espaços SHALL funcionar nos dois modos, sem passar de 0 nem do máximo.

#### Scenario: Espaços de um mago
- **WHEN** Lyra define, em Editar, 4 espaços de 1º círculo e 2 de 2º para Zane
- **THEN** o cartão Recursos mostra 4 de 4 no 1º círculo e 2 de 2 no 2º, e nenhum outro círculo

#### Scenario: Gastar um espaço
- **WHEN** Zane está em Jogar com 4 de 4 espaços de 1º círculo e Lyra gasta um
- **THEN** o 1º círculo mostra 3 de 4

#### Scenario: Magia de Pacto
- **WHEN** Lyra define para um bruxo 2 espaços de Magia de Pacto de 2º círculo
- **THEN** o cartão Recursos mostra a Magia de Pacto, 2º círculo, 2 de 2

### Requirement: Cartão Recursos
A ficha SHALL ter um cartão "Recursos", logo abaixo da faixa de topo no celular e, a partir de 1024 px, ao lado dos atributos, com os trackers de todas as fontes (cada um com o nome da fonte), os espaços de magia e de pacto, e os botões de descanso curto e longo. Sem trackers e sem espaços, o cartão SHALL mostrar só os botões de descanso.

#### Scenario: Recursos de Ária
- **WHEN** Ária tem o tracker de Inspiração e 4 espaços de 1º círculo
- **THEN** o cartão Recursos mostra "Inspiração (Inspiração de Bardo)" e o 1º círculo

#### Scenario: Recursos ao lado dos atributos
- **WHEN** Lyra abre Ária numa janela de 1280 px de largura
- **THEN** o cartão Recursos aparece à direita dos atributos, que ficam em 2 colunas e 3 linhas; num celular de 375 px, ele aparece entre a faixa de topo e os atributos

### Requirement: Descanso curto
O descanso curto SHALL pedir confirmação na própria ficha e então aplicar a cada tracker a sua regra de descanso curto (recuperar tudo, recuperar a quantidade sem passar do máximo, ou nada) e recuperar todos os espaços de Magia de Pacto, sem mexer nos espaços de magia, no PV nem nos dados de vida.

#### Scenario: Monge descansa
- **WHEN** Kai, com 0 de 3 Pontos de Foco (recupera tudo no descanso curto) e 0 de 2 espaços de 1º círculo, faz um descanso curto e confirma
- **THEN** Kai fica com 3 de 3 Pontos de Foco e continua com 0 de 2 espaços de 1º círculo

#### Scenario: Recuperar uma quantidade
- **WHEN** Ária está com 0 de 3 Inspirações (curto: 1, longo: tudo) e faz um descanso curto e confirma
- **THEN** Ária fica com 1 de 3 Inspirações

#### Scenario: Quantidade limitada ao máximo
- **WHEN** um tracker com 2 de 3 recupera 2 no descanso curto e o personagem faz um descanso curto
- **THEN** o tracker fica com 3 de 3

#### Scenario: Bruxo recupera o pacto
- **WHEN** um bruxo com 0 de 2 espaços de pacto faz um descanso curto e confirma
- **THEN** os espaços de pacto voltam a 2 de 2

#### Scenario: Desistir
- **WHEN** Lyra escolhe descanso curto e depois cancela
- **THEN** nenhum recurso muda

### Requirement: Descanso longo
O descanso longo SHALL pedir confirmação na própria ficha e então: aplicar a cada tracker a sua regra de descanso longo; recuperar todos os espaços de magia e de pacto; levar o PV ao máximo; zerar o PV temporário; recuperar todos os dados de vida; e zerar os testes contra a morte.

#### Scenario: Thorin descansa
- **WHEN** Thorin está com 40 de 55 PV, 5 de PV temporário, 3 de 5 dados de vida e 0 de 3 Fúrias (curto: 1, longo: tudo), e Lyra faz um descanso longo e confirma
- **THEN** Thorin fica com 55 de 55 PV, 0 de PV temporário, 5 de 5 dados de vida e 3 de 3 Fúrias

#### Scenario: Tracker que não recarrega
- **WHEN** um item tem o tracker "Cargas", que não recupera em nenhum descanso, com 2 de 7, e o personagem faz um descanso curto e depois um longo
- **THEN** o tracker continua 2 de 7
