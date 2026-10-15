## MODIFIED Requirements

### Requirement: Alvos e operações
Os alvos SHALL ser escolhidos numa lista: valor de atributo, salvaguarda de um atributo, todas as salvaguardas, perícia, todas as perícias, CA, iniciativa, deslocamento, PV máximo, percepção passiva, CD de magia e ataque mágico. A operação "somar" SHALL valer para todos os alvos. "Base alternativa" SHALL valer só para a CA, "definir" só para atributos e deslocamento, e "proficiência" só para salvaguardas e perícias.

#### Scenario: Operação incompatível
- **WHEN** Lyra escolhe o alvo PV máximo
- **THEN** a ficha oferece só a operação somar

#### Scenario: Bastão do Pacto
- **WHEN** Lyra cria no "Bastão do Pacto", que requer sintonização, os efeitos somar `1` na CD de magia e somar `1` no ataque mágico
- **THEN** a ficha oferece só a operação somar para esses alvos e, com o bastão sintonizado, a CD e o ataque sobem 1

### Requirement: Expressões
O valor de um efeito SHALL ser uma expressão de até 100 caracteres com números inteiros, `+`, `-`, `*`, `/` (divisão arredondada para baixo), parênteses, `min(...)`, `max(...)` e as variáveis `for`, `des`, `con`, `int`, `sab`, `car` (valores), as mesmas com `.mod` (modificadores), `nivel`, `pb` e `conj.mod` (modificador do atributo de conjuração da ficha, 0 sem atributo). A ficha SHALL mostrar o resultado da expressão enquanto ela é digitada e recusar, sem salvar, expressões inválidas.

#### Scenario: Pré-visualização
- **WHEN** Lyra digita `10 + des.mod + con.mod` num efeito de Thorin, que tem DES 14 e CON 16
- **THEN** o campo mostra o resultado 15

#### Scenario: Divisão
- **WHEN** um efeito usa `nivel / 2` num personagem de nível 5
- **THEN** o valor do efeito é 2

#### Scenario: Expressão inválida
- **WHEN** Lyra digita `10 + des.mod +` ou `10 + força`
- **THEN** o campo indica que a expressão é inválida, citando o problema, e a expressão não é salva

#### Scenario: Modificador de conjuração
- **WHEN** Ária, bardo com CAR 16 e conjuração Carisma, tem um tracker com máximo `max(1, conj.mod)`
- **THEN** o máximo é 3, e passa a 1 se a ficha ficar sem atributo de conjuração
