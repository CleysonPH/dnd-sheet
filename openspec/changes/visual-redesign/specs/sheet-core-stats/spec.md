# Spec Delta

## ADDED Requirements

### Requirement: Modos Jogar e Editar
A ficha SHALL ter dois modos, alternados por uma chave sempre visível. Em Jogar, os valores SHALL aparecer só para leitura, e apenas dano, cura, PV temporário, dados de vida e testes contra a morte SHALL ser alteráveis. Em Editar, todos os campos e os valores manuais SHALL ser alteráveis. A ficha SHALL abrir em Jogar se algum atributo for diferente de 10, e em Editar caso contrário. Trocar de modo SHALL não alterar a ficha.

#### Scenario: Ficha preenchida abre em Jogar
- **WHEN** Lyra abre Thorin, que tem FOR 16
- **THEN** a ficha abre em Jogar, mostra os atributos e as perícias sem campos de texto, e tocar num valor não abre o painel de valor manual

#### Scenario: Ficha nova abre em Editar
- **WHEN** Lyra cria a ficha "Grog", com todos os atributos em 10
- **THEN** a ficha abre em Editar, com os campos de nome, nível e atributos editáveis

#### Scenario: Controles de mesa no modo Jogar
- **WHEN** Thorin está aberto em Jogar
- **THEN** Lyra pode aplicar dano e cura, alterar o PV temporário, gastar e recuperar dados de vida, e não pode alterar atributos, nível, proficiências nem valores manuais

#### Scenario: Alternar para Editar
- **WHEN** Thorin está em Jogar e Lyra escolhe Editar
- **THEN** os campos de identificação, atributos, proficiências, dado de vida, deslocamento e PV atual ficam editáveis, e tocar num valor calculado abre o painel de valor manual

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

## MODIFIED Requirements

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

### Requirement: Organização da ficha na tela
A ficha SHALL ter, no topo, a faixa com CA, iniciativa, deslocamento, percepção passiva, bônus de proficiência, o bloco de PV com dano e cura, e os dados de vida. Até existir o cálculo de CA, ela SHALL aparecer como "—". Cada atributo SHALL ser mostrado num bloco com valor, modificador, salvaguarda e as perícias daquele atributo. A ficha SHALL ser utilizável sem rolagem horizontal a partir de 360 px. A partir de 1024 px, os blocos de atributo SHALL ficar em 3 colunas.

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
- **WHEN** Lyra abre qualquer ficha
- **THEN** a faixa de topo mostra a CA como "—"
