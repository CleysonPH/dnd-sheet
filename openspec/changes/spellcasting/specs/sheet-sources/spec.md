## ADDED Requirements

### Requirement: Atributo de conjuração da magia
Cada magia SHALL usar o atributo de conjuração da ficha ou um próprio (Inteligência, Sabedoria ou Carisma), escolhido no formulário da magia; o padrão é o da ficha. Uma magia com atributo próprio SHALL mostrar a CD de magia e o ataque mágico calculados com esse atributo, o bônus de proficiência e os efeitos ativos de CD e ataque, sem valor manual. As magias que usam o da ficha SHALL NOT repetir esses valores.

#### Scenario: Talento com outro atributo
- **WHEN** Ária, conjuração Carisma, PB +3 e INT 12, tem "Passo Nebuloso" de "Tocado pelas Fadas" com atributo Inteligência
- **THEN** o cartão de "Passo Nebuloso" mostra "INT · CD 12 · +4", e as outras magias não mostram CD nem ataque

#### Scenario: Item vale para a magia com atributo próprio
- **WHEN** Ária sintoniza o "Bastão do Pacto", com somar 1 na CD de magia e no ataque mágico
- **THEN** o cartão de "Passo Nebuloso" passa a mostrar "INT · CD 13 · +5"

#### Scenario: Magia antiga usa o da ficha
- **WHEN** Lyra abre uma ficha gravada antes deste campo
- **THEN** todas as magias usam o atributo de conjuração da ficha
