## MODIFIED Requirements

### Requirement: Modos Jogar e Editar
A ficha SHALL ter dois modos, alternados por uma chave sempre visível. Em Jogar, os valores SHALL aparecer só para leitura, e apenas dano, cura, PV temporário, dados de vida, testes contra a morte, a inspiração heroica, o encerramento da concentração, as ações de mesa sobre as fontes, os recursos e os descansos SHALL ser alteráveis. Em Editar, todos os campos, os valores manuais e as fontes SHALL ser alteráveis. A ficha SHALL abrir em Jogar se algum atributo for diferente de 10, e em Editar caso contrário. Trocar de modo SHALL não alterar a ficha.

#### Scenario: Ficha preenchida abre em Jogar
- **WHEN** Lyra abre Thorin, que tem FOR 16
- **THEN** a ficha abre em Jogar, mostra os atributos e as perícias sem campos de texto, e tocar num valor não abre o painel de valor manual

#### Scenario: Ficha nova abre em Editar
- **WHEN** Lyra cria a ficha "Grog", com todos os atributos em 10
- **THEN** a ficha abre em Editar, com os campos de nome, nível e atributos editáveis

#### Scenario: Controles de mesa no modo Jogar
- **WHEN** Thorin está aberto em Jogar
- **THEN** Lyra pode aplicar dano e cura, alterar o PV temporário, gastar e recuperar dados de vida, equipar e sintonizar itens, mudar a quantidade de itens, preparar magias, gastar e recuperar trackers e espaços de magia, fazer descansos, ligar e desligar a inspiração heroica e encerrar a concentração, e não pode alterar atributos, nível, proficiências, valores manuais, o máximo dos espaços de magia nem criar, editar ou excluir fontes

#### Scenario: Alternar para Editar
- **WHEN** Thorin está em Jogar e Lyra escolhe Editar
- **THEN** os campos de identificação, atributos, proficiências, dado de vida, deslocamento e PV atual ficam editáveis, tocar num valor calculado abre o painel de valor manual, e as fontes podem ser criadas, editadas e excluídas

#### Scenario: Trocar de modo não salva nada
- **WHEN** Lyra alterna entre Jogar e Editar sem mudar nenhum valor
- **THEN** a ficha continua indicando "Salvo" e nenhuma nova versão é gravada

### Requirement: Valores iniciais dos números da ficha
Uma ficha nova, e uma ficha gravada antes de existirem estes campos, SHALL começar com todos os atributos em 10, sem proficiências em salvaguardas e perícias, com dado de vida d8, sem dano, sem PV temporário, com todos os dados de vida disponíveis, sem testes contra a morte marcados, sem inspiração heroica, com deslocamento de 9 m e sem valores manuais. Os dados de identificação que a ficha já tinha SHALL ser mantidos.

#### Scenario: Ficha nova
- **WHEN** Lyra cria a ficha "Grog"
- **THEN** a ficha mostra atributos 10 com modificador +0, bônus de proficiência +2, PV 8 de 8, dados de vida 1/1 d8, Percepção passiva 10 e deslocamento 9 m

#### Scenario: Ficha antiga
- **WHEN** Lyra abre "Thorin", gravada antes desta mudança, com Anão, Bárbaro, nível 5 e Soldado
- **THEN** a ficha mantém a identificação, mostra atributos 10, PV 28 de 28 (d8 no nível 5) e dados de vida 5/5 d8

## ADDED Requirements

### Requirement: Inspiração heroica
A ficha SHALL ter a marcação "Inspiração heroica", que o jogador liga e desliga em Jogar e em Editar e que fica gravada na ficha. Ela SHALL NOT mudar com os descansos.

#### Scenario: Ganhar e gastar a inspiração
- **WHEN** Thorin está em Jogar sem inspiração, e Lyra liga "Inspiração heroica" e depois a desliga
- **THEN** a ficha mostra a inspiração ligada, grava a mudança e, ao desligar, volta a mostrá-la desligada

#### Scenario: Descanso não mexe na inspiração
- **WHEN** Thorin tem a inspiração heroica ligada e faz um descanso longo
- **THEN** a inspiração continua ligada

### Requirement: Concentração
O personagem SHALL estar concentrado quando uma magia com a marcação de concentração estiver em efeito. A ficha SHALL mostrar "Concentrando em" com o nome dessa magia e a opção de encerrar, em Jogar e em Editar. Encerrar SHALL tirar de efeito as magias de concentração, e os efeitos delas deixam de valer.

#### Scenario: Concentrado em Escudo da Fé
- **WHEN** Elara tem "Escudo da Fé", com concentração e um efeito de +2 na CA, e Lyra a põe em efeito
- **THEN** a ficha mostra "Concentrando em Escudo da Fé" e a CA sobe 2

#### Scenario: Encerrar a concentração
- **WHEN** Elara está concentrada em "Escudo da Fé" e Lyra escolhe encerrar
- **THEN** "Escudo da Fé" sai de efeito, a CA volta ao valor anterior e a ficha deixa de mostrar a concentração

#### Scenario: Magia em efeito sem concentração
- **WHEN** Elara tem apenas "Armadura Arcana", sem concentração, em efeito
- **THEN** a ficha não mostra concentração

### Requirement: Teste de concentração ao sofrer dano
Quando o personagem concentrado sofre dano e continua com PV atual acima de 0, a ficha SHALL avisar o teste de resistência de Constituição para manter a concentração, com o nome da magia, a CD e o bônus da salvaguarda de Constituição. A CD SHALL ser a metade do dano aplicado, arredondada para baixo, no mínimo 10 e no máximo 30, contando o dano absorvido pelo PV temporário. O aviso SHALL oferecer "Manteve", que só fecha o aviso, e "Perdeu", que encerra a concentração.

#### Scenario: Dano pequeno
- **WHEN** Elara, com salvaguarda de Constituição +2 e concentrada em "Escudo da Fé", sofre 14 de dano
- **THEN** a ficha avisa "Teste de resistência de Constituição CD 10 (+2) para manter Escudo da Fé"

#### Scenario: Dano grande
- **WHEN** Elara, concentrada e com 60 PV, sofre 46 de dano
- **THEN** o aviso mostra CD 23

#### Scenario: Dano absorvido pelo PV temporário
- **WHEN** Elara, concentrada e com 8 de PV temporário, sofre 8 de dano
- **THEN** o PV atual não muda e a ficha ainda avisa o teste com CD 10

#### Scenario: Manteve a concentração
- **WHEN** a ficha avisa o teste e Lyra escolhe "Manteve"
- **THEN** o aviso some e "Escudo da Fé" continua em efeito

#### Scenario: Perdeu a concentração
- **WHEN** a ficha avisa o teste e Lyra escolhe "Perdeu"
- **THEN** o aviso some, "Escudo da Fé" sai de efeito e a CA volta ao valor anterior

#### Scenario: Sem concentração, sem aviso
- **WHEN** Thorin, sem nenhuma magia de concentração em efeito, sofre 20 de dano
- **THEN** a ficha não avisa teste de concentração

### Requirement: Concentração encerrada com 0 PV
Quando o dano leva o PV atual do personagem concentrado a 0, a ficha SHALL encerrar a concentração sem pedir o teste e SHALL avisar que a concentração terminou.

#### Scenario: Cair a 0 PV
- **WHEN** Elara está concentrada em "Escudo da Fé" com 12 PV e sofre 20 de dano
- **THEN** a ficha mostra 0 PV, "Escudo da Fé" sai de efeito e a ficha avisa que a concentração em "Escudo da Fé" terminou
