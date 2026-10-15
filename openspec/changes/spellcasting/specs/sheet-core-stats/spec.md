## ADDED Requirements

### Requirement: Atributo de conjuração
A ficha SHALL ter um atributo de conjuração: nenhum, Inteligência, Sabedoria ou Carisma, escolhido em Editar no topo da aba Magias. Fichas novas e fichas gravadas antes deste campo SHALL começar sem atributo de conjuração.

#### Scenario: Escolher Carisma
- **WHEN** Lyra, em Editar, escolhe Carisma como atributo de conjuração de Ária
- **THEN** a escolha é salva e a ficha passa a mostrar a CD de magia e o ataque mágico

#### Scenario: Ficha antiga
- **WHEN** Lyra abre Thorin, gravado antes deste campo
- **THEN** a ficha está sem atributo de conjuração e não mostra CD de magia nem ataque mágico

### Requirement: CD de magia e ataque mágico
A ficha SHALL calcular a CD de magia como 8 + modificador do atributo de conjuração + bônus de proficiência, e o ataque mágico como modificador do atributo de conjuração + bônus de proficiência, somando os efeitos ativos de cada um. Os dois SHALL ser valores derivados com origem e valor manual, como os demais. Com atributo de conjuração, SHALL aparecer no cartão Combate e no topo da aba Magias; sem atributo, SHALL ficar ocultos.

#### Scenario: Bardo nível 5
- **WHEN** Ária tem CAR 16, nível 5 (PB +3) e conjuração Carisma
- **THEN** o cartão Combate e a aba Magias mostram CD de magia 14 e ataque mágico +6

#### Scenario: Item que soma
- **WHEN** Ária sintoniza o "Bastão do Pacto", com somar 1 na CD de magia e no ataque mágico
- **THEN** a ficha mostra CD 15 e ataque +7, e a origem da CD lista 8, o modificador de CAR +3, a proficiência +3 e o Bastão do Pacto +1

#### Scenario: Modificador manual
- **WHEN** Ária tem o valor manual +4 no modificador de Carisma
- **THEN** a CD de magia passa a 15 e o ataque mágico a +7

#### Scenario: Valor manual da CD
- **WHEN** Lyra define o valor manual 16 na CD de magia de Ária
- **THEN** a ficha mostra 16, sinalizado como valor manual, e indica que o calculado é 14
