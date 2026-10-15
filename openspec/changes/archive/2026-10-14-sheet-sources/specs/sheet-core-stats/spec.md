# Spec Delta

## MODIFIED Requirements

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
