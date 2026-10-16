## MODIFIED Requirements

### Requirement: Descanso longo
O descanso longo SHALL pedir confirmação na própria ficha e então: aplicar a cada tracker a sua regra de descanso longo; recuperar todos os espaços de magia e de pacto; levar o PV ao máximo; zerar o PV temporário; recuperar todos os dados de vida; zerar os testes contra a morte; e reduzir a Exaustão em 1 nível, se ela estiver acima de 0. As condições ativas SHALL não mudar.

#### Scenario: Thorin descansa
- **WHEN** Thorin está com 40 de 55 PV, 5 de PV temporário, 3 de 5 dados de vida e 0 de 3 Fúrias (curto: 1, longo: tudo), e Lyra faz um descanso longo e confirma
- **THEN** Thorin fica com 55 de 55 PV, 0 de PV temporário, 5 de 5 dados de vida e 3 de 3 Fúrias

#### Scenario: Tracker que não recarrega
- **WHEN** um item tem o tracker "Cargas", que não recupera em nenhum descanso, com 2 de 7, e o personagem faz um descanso curto e depois um longo
- **THEN** o tracker continua 2 de 7

#### Scenario: Descanso reduz a Exaustão
- **WHEN** Thorin está com Exaustão 2 e envenenado, e Lyra faz um descanso longo e confirma
- **THEN** Thorin fica com Exaustão 1 e continua envenenado
