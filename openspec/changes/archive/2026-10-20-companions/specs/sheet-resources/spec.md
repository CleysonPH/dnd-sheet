## MODIFIED Requirements

### Requirement: Descanso curto
O descanso curto SHALL pedir confirmação na própria ficha e então aplicar a cada tracker a sua regra de descanso curto (recuperar tudo, recuperar a quantidade sem passar do máximo, ou nada) e recuperar todos os espaços de Magia de Pacto, sem mexer nos espaços de magia, no PV nem nos dados de vida. A regra de descanso curto SHALL valer também para os usos de cada companheiro, sem mexer no PV nem nos dados de vida dele.

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

#### Scenario: Usos do companheiro no descanso curto
- **WHEN** o Steel Defender de um artífice tem o uso "Reparar" com 0 de 3 (curto: nada, longo: tudo) e o uso "Defletir" com 0 de 1 (curto: tudo), e o personagem faz um descanso curto e confirma
- **THEN** o Steel Defender fica com 0 de 3 em Reparar, 1 de 1 em Defletir, e o PV dele não muda

### Requirement: Descanso longo
O descanso longo SHALL pedir confirmação na própria ficha e então: aplicar a cada tracker a sua regra de descanso longo; recuperar todos os espaços de magia e de pacto; levar o PV ao máximo; zerar o PV temporário; recuperar todos os dados de vida; zerar os testes contra a morte; e reduzir a Exaustão em 1 nível, se ela estiver acima de 0. Em cada companheiro, SHALL também aplicar a regra de descanso longo dos usos, levar o PV ao máximo, zerar o PV temporário e recuperar todos os dados de vida. As condições ativas, do personagem e dos companheiros, SHALL não mudar.

#### Scenario: Thorin descansa
- **WHEN** Thorin está com 40 de 55 PV, 5 de PV temporário, 3 de 5 dados de vida e 0 de 3 Fúrias (curto: 1, longo: tudo), e Lyra faz um descanso longo e confirma
- **THEN** Thorin fica com 55 de 55 PV, 0 de PV temporário, 5 de 5 dados de vida e 3 de 3 Fúrias

#### Scenario: Tracker que não recarrega
- **WHEN** um item tem o tracker "Cargas", que não recupera em nenhum descanso, com 2 de 7, e o personagem faz um descanso curto e depois um longo
- **THEN** o tracker continua 2 de 7

#### Scenario: Descanso reduz a Exaustão
- **WHEN** Thorin está com Exaustão 2 e envenenado, e Lyra faz um descanso longo e confirma
- **THEN** Thorin fica com Exaustão 1 e continua envenenado

#### Scenario: Companheiro descansa
- **WHEN** o Hound de Brann está com 10 de 30 PV, 4 de PV temporário, 2 de 5 dados de vida e amedrontado, e Brann faz um descanso longo e confirma
- **THEN** o Hound fica com 30 de 30 PV, 0 de PV temporário, 5 de 5 dados de vida e continua amedrontado
