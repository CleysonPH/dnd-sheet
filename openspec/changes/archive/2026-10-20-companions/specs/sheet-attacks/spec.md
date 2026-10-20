## ADDED Requirements

### Requirement: Descrição da ação
Toda ação, de uma fonte ou de um companheiro, SHALL ter uma descrição opcional de até 500 caracteres, para o que os valores não mostram, como efeitos extras no acerto ou propriedades da arma. A descrição SHALL aparecer junto da linha da ação no cartão Ataques, no cartão da fonte, no cartão do companheiro e no resultado do compêndio. Uma ficha ou entrada do compêndio gravada antes da descrição SHALL abrir com as ações sem descrição.

#### Scenario: Mordida do Hound
- **WHEN** Brann escreve na Mordida do Hound a descrição "Alvo Grande ou menor: salvaguarda de FOR ou fica Agarrado, Caído ou é empurrado 1,5 m"
- **THEN** o cartão do Hound mostra a Mordida com "+6 · 2d4+5 perfurante" e a descrição logo abaixo

#### Scenario: Descrição longa
- **WHEN** Brann digita 501 caracteres na descrição de uma ação
- **THEN** o campo indica o limite e o texto não é salvo

#### Scenario: Ação antiga
- **WHEN** Lyra abre uma ficha ou uma entrada do compêndio gravada antes da descrição das ações
- **THEN** as ações abrem sem descrição e com os mesmos valores calculados
