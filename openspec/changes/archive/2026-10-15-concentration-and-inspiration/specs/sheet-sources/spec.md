## ADDED Requirements

### Requirement: Uma concentração por vez
No máximo uma magia com a marcação de concentração SHALL estar em efeito. Pôr em efeito uma magia de concentração, ou marcar como de concentração uma magia em efeito, SHALL tirar de efeito qualquer outra magia de concentração, e os efeitos dela deixam de valer. Magias sem concentração SHALL NOT ser afetadas.

#### Scenario: Trocar de concentração
- **WHEN** Elara está concentrada em "Escudo da Fé" e Lyra põe "Bênção", também de concentração, em efeito
- **THEN** "Bênção" fica em efeito, "Escudo da Fé" sai de efeito e a ficha mostra "Concentrando em Bênção"

#### Scenario: Magia sem concentração não interfere
- **WHEN** Elara está concentrada em "Escudo da Fé" e Lyra põe "Armadura Arcana", sem concentração, em efeito
- **THEN** as duas magias ficam em efeito e a ficha continua mostrando "Concentrando em Escudo da Fé"

#### Scenario: Ficha antiga com duas concentrações
- **WHEN** Lyra abre uma ficha gravada com "Escudo da Fé" e "Bênção", ambas de concentração, em efeito, e escolhe encerrar a concentração
- **THEN** a ficha abre normalmente, mostra a concentração na primeira das duas na ordem da ficha e, ao encerrar, tira as duas de efeito
