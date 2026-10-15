# sheet-core-stats Specification

## Purpose

Calcula e mostra os números centrais da ficha de D&D 5.5e (atributos, proficiência, salvaguardas, perícias, iniciativa, percepção passiva, deslocamento, pontos de vida, dados de vida e testes contra a morte), com override manual de qualquer valor derivado e um layout que funciona no celular e no desktop.

## Requirements

### Requirement: Atributos e modificadores
A ficha SHALL ter os seis atributos (Força, Destreza, Constituição, Inteligência, Sabedoria e Carisma), cada um com um valor inteiro de 1 a 30 informado pelo jogador. Cada atributo SHALL mostrar o modificador calculado como (valor - 10) / 2, arredondado para baixo, e o modificador SHALL ser atualizado assim que o valor muda.

#### Scenario: Modificadores de Thorin
- **WHEN** Thorin tem FOR 16, DES 14, CON 16, INT 8, SAB 12 e CAR 10
- **THEN** os modificadores mostrados são +3, +2, +3, -1, +1 e +0

#### Scenario: Extremos da tabela
- **WHEN** um atributo vale 1, 9, 10, 17 ou 30
- **THEN** o modificador é -5, -1, +0, +3 ou +10, respectivamente

#### Scenario: Valor fora do intervalo
- **WHEN** Lyra informa 0 ou 31 num atributo
- **THEN** o campo indica que o valor vai de 1 a 30 e o valor inválido não é salvo

### Requirement: Bônus de proficiência
A ficha SHALL mostrar o bônus de proficiência calculado pelo nível do personagem: +2 nos níveis 1 a 4, +3 de 5 a 8, +4 de 9 a 12, +5 de 13 a 16 e +6 de 17 a 20.

#### Scenario: Bônus pelo nível
- **WHEN** o nível é 1, 4, 5, 9, 13, 17 ou 20
- **THEN** o bônus de proficiência é +2, +2, +3, +4, +5, +6 ou +6, respectivamente

#### Scenario: Subir de nível muda o bônus
- **WHEN** Lyra muda o nível de Thorin de 4 para 5
- **THEN** o bônus de proficiência passa de +2 para +3, e as perícias e salvaguardas proficientes sobem 1 ponto

### Requirement: Salvaguardas
A ficha SHALL ter uma salvaguarda por atributo, com proficiência marcável. O bônus da salvaguarda SHALL ser o modificador do atributo, somado ao bônus de proficiência quando a salvaguarda for proficiente.

#### Scenario: Salvaguardas de Thorin
- **WHEN** Thorin, Bárbaro nível 5, com FOR 16, DES 14, CON 16, INT 8, SAB 12 e CAR 10, é proficiente em salvaguardas de Força e Constituição
- **THEN** as salvaguardas são FOR +6, DES +2, CON +6, INT -1, SAB +1 e CAR +0

#### Scenario: Marcar proficiência
- **WHEN** Lyra marca a proficiência na salvaguarda de Sabedoria de Thorin
- **THEN** a salvaguarda de Sabedoria passa de +1 para +4

### Requirement: Perícias
A ficha SHALL listar as 18 perícias do 5.5e, cada uma ligada ao seu atributo e com um nível de proficiência: nenhuma, proficiente ou expertise. O bônus da perícia SHALL ser o modificador do atributo, somado a 0, 1 ou 2 vezes o bônus de proficiência, conforme o nível.

#### Scenario: Lista de perícias
- **WHEN** Lyra abre a ficha
- **THEN** as perícias aparecem com seus atributos: Acrobacia (DES), Adestrar Animais (SAB), Arcanismo (INT), Atletismo (FOR), Atuação (CAR), Enganação (CAR), Furtividade (DES), História (INT), Intimidação (CAR), Intuição (SAB), Investigação (INT), Medicina (SAB), Natureza (INT), Percepção (SAB), Persuasão (CAR), Prestidigitação (DES), Religião (INT) e Sobrevivência (SAB)

#### Scenario: Perícias de Thorin
- **WHEN** Thorin, nível 5, com FOR 16, DES 14 e SAB 12, é proficiente em Atletismo e Percepção e não é proficiente em Furtividade
- **THEN** Atletismo é +6, Percepção é +4 e Furtividade é +2

#### Scenario: Expertise de Elara
- **WHEN** Elara, Ladina nível 3, com DES 17, tem expertise em Furtividade
- **THEN** Furtividade é +7 (modificador +3 mais duas vezes o bônus de proficiência +2)

### Requirement: Iniciativa e Percepção passiva
A ficha SHALL mostrar a Iniciativa, igual ao modificador de Destreza, e a Percepção passiva, igual a 10 mais o bônus da perícia Percepção.

#### Scenario: Valores de Thorin
- **WHEN** Thorin tem DES 14 e Percepção +4
- **THEN** a Iniciativa é +2 e a Percepção passiva é 14

#### Scenario: Percepção passiva de Elara
- **WHEN** Elara, nível 3, com SAB 12, é proficiente em Percepção
- **THEN** a Percepção é +3 e a Percepção passiva é 13

### Requirement: Deslocamento
A ficha SHALL ter o deslocamento em metros, informado pelo jogador, como um número de 0 a 999 com no máximo uma casa decimal.

#### Scenario: Deslocamento editado
- **WHEN** Lyra muda o deslocamento de Thorin de 9 para 7,5
- **THEN** a ficha mostra 7,5 m e o valor é salvo

#### Scenario: Deslocamento inválido
- **WHEN** Lyra informa -3 no deslocamento
- **THEN** o campo indica o intervalo aceito e o valor inválido não é salvo

### Requirement: PV máximo calculado
O jogador SHALL escolher o dado de vida do personagem: d6, d8, d10 ou d12. O PV máximo SHALL ser calculado assim: no nível 1, o valor máximo do dado mais o modificador de Constituição; em cada nível seguinte, a metade do dado mais 1, mais o modificador de Constituição. Cada nível SHALL somar no mínimo 1 PV.

#### Scenario: PV de Thorin
- **WHEN** Thorin é nível 5, com dado de vida d12 e CON 16
- **THEN** o PV máximo é 55 (12 + 3 no nível 1, mais 4 níveis de 7 + 3)

#### Scenario: PV de Elara
- **WHEN** Elara é nível 3, com dado de vida d8 e CON 14
- **THEN** o PV máximo é 24 (8 + 2 no nível 1, mais 2 níveis de 5 + 2)

#### Scenario: Constituição muito baixa
- **WHEN** um personagem é nível 2, com dado de vida d6 e CON 1
- **THEN** o PV máximo é 2, porque cada nível soma no mínimo 1 PV

#### Scenario: Constituição muda o máximo
- **WHEN** Lyra muda a CON de Thorin, nível 5 com d12, de 16 para 18
- **THEN** o PV máximo passa de 55 para 60

### Requirement: PV atual e temporário
A ficha SHALL ter o PV atual, de 0 até o PV máximo, e o PV temporário, um inteiro de 0 a 999. A ficha SHALL guardar o dano sofrido: quando o PV máximo muda, o PV atual muda na mesma quantidade, sem passar de 0. O PV temporário SHALL ser independente do atual e do máximo.

#### Scenario: Sofrer dano
- **WHEN** Thorin tem 55 de 55 PV e Lyra muda o PV atual para 40
- **THEN** a ficha mostra 40 de 55 PV e o valor é salvo

#### Scenario: PV atual acima do máximo
- **WHEN** Lyra informa 60 no PV atual de Thorin, cujo máximo é 55
- **THEN** o campo indica que o PV atual vai de 0 a 55 e o valor inválido não é salvo

#### Scenario: Subir de nível ferido
- **WHEN** Thorin está com 40 de 55 PV e Lyra muda o nível de 5 para 6
- **THEN** a ficha mostra 50 de 65 PV

#### Scenario: Máximo cai abaixo do dano
- **WHEN** um personagem com 10 de PV máximo está com 2 de PV atual e o máximo cai para 7
- **THEN** o PV atual mostrado é 0

#### Scenario: PV temporário
- **WHEN** Lyra informa 5 de PV temporário em Thorin, que está com 40 de 55 PV
- **THEN** a ficha mostra 5 de PV temporário, e o PV atual e o máximo não mudam

### Requirement: Dados de vida
A ficha SHALL mostrar os dados de vida como o número de dados disponíveis sobre o total, que é igual ao nível, com o tipo do dado (ex.: "3/5 d12"). O jogador SHALL poder marcar um dado como gasto e recuperar um dado gasto, sem passar de 0 disponíveis nem do total.

#### Scenario: Gastar dados de vida
- **WHEN** Thorin, nível 5 com d12, tem todos os dados disponíveis e Lyra gasta 2
- **THEN** a ficha mostra 3/5 d12 e o valor é salvo

#### Scenario: Limites
- **WHEN** todos os dados de vida estão disponíveis, ou nenhum está disponível
- **THEN** não é possível recuperar além do total nem gastar abaixo de 0

### Requirement: Testes contra a morte
A ficha SHALL ter os testes contra a morte, com até 3 sucessos e até 3 falhas marcáveis, e uma ação para limpar as marcações. Os testes SHALL aparecer somente quando o PV atual for 0. Sempre que o PV atual passar a ser maior que 0, por cura, edição do PV atual ou mudança no PV máximo, os sucessos e as falhas SHALL ser zerados.

#### Scenario: Marcar testes
- **WHEN** Thorin está com 0 PV, Lyra marca 2 sucessos e 1 falha e reabre a ficha depois de salva
- **THEN** a ficha mostra 2 sucessos e 1 falha

#### Scenario: Limpar testes
- **WHEN** Thorin está com 0 PV e com sucessos e falhas marcados, e Lyra escolhe limpar
- **THEN** a ficha mostra 0 sucessos e 0 falhas

#### Scenario: Testes escondidos com PV acima de 0
- **WHEN** Thorin está com 40 de 55 PV
- **THEN** a ficha não mostra os testes contra a morte

#### Scenario: Testes aparecem ao chegar a 0
- **WHEN** Thorin está com 5 de 55 PV e Lyra aplica 5 de dano
- **THEN** a ficha mostra 0 de 55 PV e os testes contra a morte, sem nenhuma marcação

#### Scenario: Cura zera os testes
- **WHEN** Thorin está com 0 PV, 2 sucessos e 1 falha, e Lyra aplica 4 de cura
- **THEN** a ficha mostra 4 de 55 PV, os testes somem e, ao voltar a 0 PV depois, aparecem com 0 sucessos e 0 falhas

#### Scenario: Subir de nível com 0 PV zera os testes
- **WHEN** Thorin está com 0 de 55 PV e 1 falha, e Lyra muda o nível de 5 para 6
- **THEN** a ficha mostra 10 de 65 PV e os testes contra a morte são zerados

### Requirement: Override manual de valores derivados
O jogador SHALL poder substituir por um valor inteiro digitado qualquer valor calculado: modificadores, bônus de proficiência, salvaguardas, perícias, iniciativa, percepção passiva, PV máximo, total de dados de vida, CA e deslocamento. O valor manual SHALL substituir o resultado final, já com os efeitos das fontes. Ele SHALL ficar salvo na ficha e sinalizado na tela, mostrar o valor calculado e poder ser removido para voltar ao cálculo.

#### Scenario: PV máximo por regra da casa
- **WHEN** Thorin tem PV máximo calculado 55 e Lyra define o valor manual 61
- **THEN** a ficha mostra 61 de PV máximo, sinalizado como valor manual, indica que o calculado é 55, e o valor manual continua depois de salvo e reaberto

#### Scenario: Remover o valor manual
- **WHEN** Lyra remove o valor manual do PV máximo de Thorin
- **THEN** o PV máximo volta a 55, sem sinalização

#### Scenario: Valor manual permanece quando o cálculo muda
- **WHEN** a Furtividade de Elara tem o valor manual +9 e Lyra muda a DES dela de 17 para 18
- **THEN** a Furtividade continua +9, e o calculado indicado passa de +7 para +8

#### Scenario: Valor manual inválido
- **WHEN** Lyra digita "abc" ou 2,5 como valor manual
- **THEN** o campo indica que o valor deve ser inteiro e nada é salvo

#### Scenario: Valor manual sobre efeitos
- **WHEN** a CA calculada de Thorin, com efeitos, é 18 e Lyra define o valor manual 20
- **THEN** a CA mostrada é 20, indicando que o calculado é 18

### Requirement: Valores dependentes usam o valor manual
Quando um valor derivado tiver valor manual, os valores calculados a partir dele SHALL usar o valor manual no lugar do calculado.

#### Scenario: Modificador manual afeta perícias e iniciativa
- **WHEN** Thorin tem DES 14 e Lyra define o valor manual +4 no modificador de Destreza
- **THEN** a Iniciativa passa a +4 e Acrobacia, sem proficiência, passa a +4

#### Scenario: Percepção manual afeta a passiva
- **WHEN** Lyra define o valor manual +6 na Percepção de Thorin
- **THEN** a Percepção passiva passa a 16

#### Scenario: PV máximo manual afeta o PV atual
- **WHEN** Thorin está com 40 de 55 PV e Lyra define o valor manual 61 no PV máximo
- **THEN** a ficha mostra 46 de 61 PV

### Requirement: Valores iniciais dos números da ficha
Uma ficha nova, e uma ficha gravada antes de existirem estes campos, SHALL começar com todos os atributos em 10, sem proficiências em salvaguardas e perícias, com dado de vida d8, sem dano, sem PV temporário, com todos os dados de vida disponíveis, sem testes contra a morte marcados, com deslocamento de 9 m e sem valores manuais. Os dados de identificação que a ficha já tinha SHALL ser mantidos.

#### Scenario: Ficha nova
- **WHEN** Lyra cria a ficha "Grog"
- **THEN** a ficha mostra atributos 10 com modificador +0, bônus de proficiência +2, PV 8 de 8, dados de vida 1/1 d8, Percepção passiva 10 e deslocamento 9 m

#### Scenario: Ficha antiga
- **WHEN** Lyra abre "Thorin", gravada antes desta mudança, com Anão, Bárbaro, nível 5 e Soldado
- **THEN** a ficha mantém a identificação, mostra atributos 10, PV 28 de 28 (d8 no nível 5) e dados de vida 5/5 d8

### Requirement: Organização da ficha na tela
A ficha SHALL ter, no topo, a faixa com CA, iniciativa, deslocamento, percepção passiva, bônus de proficiência, o bloco de PV com dano e cura, e os dados de vida. Cada atributo SHALL ser mostrado num bloco com valor, modificador, salvaguarda e as perícias daquele atributo. A ficha SHALL ser utilizável sem rolagem horizontal a partir de 360 px. A partir de 1024 px, os blocos de atributo SHALL ficar em 3 colunas.

#### Scenario: Celular
- **WHEN** Lyra abre a ficha num celular com tela de 375 px de largura
- **THEN** a faixa de topo aparece primeiro, com o PV visível sem rolar, os blocos de atributo aparecem um abaixo do outro, não há rolagem horizontal e, em Editar, todos os campos podem ser editados

#### Scenario: Desktop
- **WHEN** Lyra abre a ficha numa janela de 1280 px de largura
- **THEN** a faixa de topo aparece numa linha e os seis blocos de atributo aparecem em 3 colunas e 2 linhas

#### Scenario: Perícias dentro do atributo
- **WHEN** Lyra abre Thorin, com DES 14, sem proficiência em Acrobacia, Furtividade e Prestidigitação
- **THEN** o bloco de Destreza mostra o valor 14, o modificador +2, a salvaguarda de Destreza +2 e as perícias Acrobacia +2, Furtividade +2 e Prestidigitação +2

#### Scenario: CA reservada
- **WHEN** Lyra abre uma ficha com DES 14, sem armadura nem efeitos de CA
- **THEN** o lugar da CA na faixa de topo mostra o valor calculado, 12, e não mais "—"

### Requirement: Modos Jogar e Editar
A ficha SHALL ter dois modos, alternados por uma chave sempre visível. Em Jogar, os valores SHALL aparecer só para leitura, e apenas dano, cura, PV temporário, dados de vida, testes contra a morte e as ações de mesa sobre as fontes SHALL ser alteráveis. Em Editar, todos os campos, os valores manuais e as fontes SHALL ser alteráveis. A ficha SHALL abrir em Jogar se algum atributo for diferente de 10, e em Editar caso contrário. Trocar de modo SHALL não alterar a ficha.

#### Scenario: Ficha preenchida abre em Jogar
- **WHEN** Lyra abre Thorin, que tem FOR 16
- **THEN** a ficha abre em Jogar, mostra os atributos e as perícias sem campos de texto, e tocar num valor não abre o painel de valor manual

#### Scenario: Ficha nova abre em Editar
- **WHEN** Lyra cria a ficha "Grog", com todos os atributos em 10
- **THEN** a ficha abre em Editar, com os campos de nome, nível e atributos editáveis

#### Scenario: Controles de mesa no modo Jogar
- **WHEN** Thorin está aberto em Jogar
- **THEN** Lyra pode aplicar dano e cura, alterar o PV temporário, gastar e recuperar dados de vida, equipar e sintonizar itens, mudar a quantidade de itens e preparar magias, e não pode alterar atributos, nível, proficiências, valores manuais nem criar, editar ou excluir fontes

#### Scenario: Alternar para Editar
- **WHEN** Thorin está em Jogar e Lyra escolhe Editar
- **THEN** os campos de identificação, atributos, proficiências, dado de vida, deslocamento e PV atual ficam editáveis, tocar num valor calculado abre o painel de valor manual, e as fontes podem ser criadas, editadas e excluídas

#### Scenario: Trocar de modo não salva nada
- **WHEN** Lyra alterna entre Jogar e Editar sem mudar nenhum valor
- **THEN** a ficha continua indicando "Salvo" e nenhuma nova versão é gravada

### Requirement: Aplicar dano e cura
A ficha SHALL permitir aplicar uma quantidade inteira de 1 a 999 como dano ou como cura. O dano SHALL reduzir primeiro o PV temporário e só o restante o PV atual, sem deixá-lo abaixo de 0. A cura SHALL aumentar o PV atual até o PV máximo, sem alterar o PV temporário.

#### Scenario: Dano absorvido pelo PV temporário
- **WHEN** Thorin está com 40 de 55 PV e 5 de PV temporário, e Lyra aplica 7 de dano
- **THEN** a ficha mostra 0 de PV temporário e 38 de 55 PV

#### Scenario: Dano maior que o PV atual
- **WHEN** Thorin está com 38 de 55 PV, sem PV temporário, e Lyra aplica 100 de dano
- **THEN** a ficha mostra 0 de 55 PV

#### Scenario: Cura limitada ao máximo
- **WHEN** Thorin está com 38 de 55 PV e 3 de PV temporário, e Lyra aplica 20 de cura
- **THEN** a ficha mostra 55 de 55 PV e 3 de PV temporário

#### Scenario: Quantidade inválida
- **WHEN** Lyra informa 0, -5 ou "abc" como quantidade
- **THEN** o campo indica que a quantidade vai de 1 a 999 e nem o dano nem a cura são aplicados

#### Scenario: Dano com PV máximo manual
- **WHEN** Thorin tem PV máximo manual 61, está com 61 de 61 PV e Lyra aplica 10 de dano
- **THEN** a ficha mostra 51 de 61 PV
