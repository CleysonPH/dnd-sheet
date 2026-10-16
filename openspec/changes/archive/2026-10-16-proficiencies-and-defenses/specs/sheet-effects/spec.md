## MODIFIED Requirements

### Requirement: Efeitos nas fontes
No modo Editar, toda fonte SHALL poder ter até 20 efeitos, que podem ser criados, alterados e removidos no formulário da fonte. Cada efeito SHALL ter alvo, operação, valor e as condições opcionais "sem armadura" e "sem escudo". O valor SHALL ser uma expressão ou, na operação conceder, um item da lista do alvo ou um texto de 1 a 50 caracteres. A fonte SHALL mostrar um resumo dos seus efeitos.

#### Scenario: Efeito no Anel de Proteção
- **WHEN** Lyra, em Editar, acrescenta ao "Anel de Proteção" o efeito somar 1 na CA
- **THEN** o anel mostra o resumo "+1 CA" e o efeito é salvo na ficha

#### Scenario: Remover efeito
- **WHEN** Lyra remove o efeito do Anel de Proteção
- **THEN** o anel deixa de alterar a CA

#### Scenario: Efeito que concede um idioma
- **WHEN** Lyra acrescenta ao traço "Élfico" de Elara o efeito conceder o idioma "Élfico"
- **THEN** o traço mostra o resumo "Idioma: Élfico" e o efeito é salvo na ficha

### Requirement: Alvos e operações
Os alvos SHALL ser escolhidos numa lista: valor de atributo, salvaguarda de um atributo, todas as salvaguardas, perícia, todas as perícias, CA, iniciativa, deslocamento, PV máximo, percepção passiva, CD de magia, ataque mágico, proficiência com armadura, com arma, com ferramenta, idioma, resistência, imunidade e vulnerabilidade a dano e imunidade a condição. A operação "somar" SHALL valer para todos os alvos numéricos. "Base alternativa" SHALL valer só para a CA, "definir" só para atributos e deslocamento, "proficiência" só para salvaguardas e perícias, e "conceder" só, e sempre, para os alvos de proficiência, idioma e defesa.

#### Scenario: Operação incompatível
- **WHEN** Lyra escolhe o alvo PV máximo
- **THEN** a ficha oferece só a operação somar

#### Scenario: Bastão do Pacto
- **WHEN** Lyra cria no "Bastão do Pacto", que requer sintonização, os efeitos somar `1` na CD de magia e somar `1` no ataque mágico
- **THEN** a ficha oferece só a operação somar para esses alvos e, com o bastão sintonizado, a CD e o ataque sobem 1

#### Scenario: Conceder com lista fechada
- **WHEN** Lyra escolhe o alvo proficiência com armadura
- **THEN** a ficha oferece só a operação conceder, com a escolha entre Leve, Média, Pesada e Escudo

#### Scenario: Conceder com texto livre
- **WHEN** Lyra escolhe o alvo proficiência com ferramenta e digita "Ferr"
- **THEN** a ficha sugere as ferramentas do PHB 2024 que começam com "Ferr" e aceita também um nome fora das sugestões
