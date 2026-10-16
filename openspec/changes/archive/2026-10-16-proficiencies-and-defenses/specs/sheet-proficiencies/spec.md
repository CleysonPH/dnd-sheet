## Purpose

Guarda as proficiências do personagem com armaduras, armas, ferramentas e idiomas e as defesas contra dano e condições, juntando o que o jogador marca com o que talentos, traços, itens e magias concedem, e avisa quando uma armadura é usada sem treinamento.

## ADDED Requirements

### Requirement: Proficiências com armaduras e armas
O cartão Proficiências SHALL ter, em Editar, caixas para as armaduras Leve, Média, Pesada e Escudo e para as armas Simples e Marciais. Marcar ou desmarcar uma caixa SHALL ser salvo na ficha.

#### Scenario: Thorin marca o treinamento
- **WHEN** Lyra, em Editar, marca em Thorin as armaduras Leve, Média e Escudo e as armas Simples e Marciais
- **THEN** o cartão mostra essas cinco proficiências, e elas são salvas na ficha

### Requirement: Armas específicas, ferramentas e idiomas
O cartão Proficiências SHALL ter três listas de etiquetas livres: armas específicas, ferramentas e idiomas. Em Editar, o jogador SHALL poder acrescentar e remover etiquetas. Ao digitar, a ficha SHALL sugerir os nomes do PHB 2024 daquela lista, sem impedir outros nomes. Cada etiqueta SHALL ter de 1 a 50 caracteres, cada lista no máximo 30 etiquetas, e a ficha SHALL recusar uma etiqueta igual a outra da mesma lista, sem diferenciar maiúsculas.

#### Scenario: Idioma sugerido
- **WHEN** Lyra digita "Élf" na lista de idiomas de Elara
- **THEN** a ficha sugere "Élfico", e escolher a sugestão acrescenta a etiqueta "Élfico"

#### Scenario: Nome livre
- **WHEN** Lyra acrescenta a ferramenta "Kit de cartografia celeste", que não está entre as sugestões
- **THEN** a etiqueta é acrescentada e salva

#### Scenario: Etiqueta repetida
- **WHEN** Elara já tem o idioma "Élfico" e Lyra tenta acrescentar "élfico"
- **THEN** a ficha recusa a etiqueta e mantém uma só

### Requirement: Defesas contra dano
O cartão Defesas SHALL ter, em Editar, as listas de resistências, imunidades e vulnerabilidades, cada uma com a escolha entre os 13 tipos de dano do 5.5e: ácido, concussão, cortante, elétrico, energia, fogo, frio, necrótico, perfurante, psíquico, radiante, trovejante e veneno. Um mesmo tipo SHALL poder estar em mais de uma lista.

#### Scenario: Resistência a fogo
- **WHEN** Lyra marca em Elara a resistência a fogo
- **THEN** o cartão Defesas mostra "Resistência: fogo", e a marcação é salva

### Requirement: Imunidade a condições
O cartão Defesas SHALL ter, em Editar, a lista de imunidades a condições, com a escolha entre as 15 condições do 5.5e: agarrado, amedrontado, atordoado, caído, cego, enfeitiçado, envenenado, exaustão, imobilizado, incapacitado, inconsciente, invisível, paralisado, petrificado e surdo.

#### Scenario: Imune a enfeitiçado
- **WHEN** Lyra marca em Elara a imunidade a enfeitiçado
- **THEN** o cartão Defesas mostra "Imunidade a condição: enfeitiçado"

### Requirement: Proficiências e defesas concedidas por fontes
Cada lista de proficiência e de defesa exibida SHALL juntar o que o jogador marcou na ficha com o que os efeitos de conceder das fontes ativas concedem. Um item concedido SHALL mostrar o nome da fonte de origem e não SHALL poder ser removido no cartão. Um item que está na ficha e numa fonte, ou em várias fontes, SHALL aparecer uma vez só, com todas as origens. Quando a fonte deixa de estar ativa ou é excluída, o que só ela concedia SHALL sair da lista.

#### Scenario: Talento concede armadura pesada
- **WHEN** Thorin, com Leve e Média marcadas, ganha o talento "Treinamento com Armadura Pesada", com o efeito conceder Pesada
- **THEN** o cartão mostra Pesada com a origem "Treinamento com Armadura Pesada", e a caixa de Pesada não pode ser desmarcada enquanto o talento existir

#### Scenario: Item de resistência desequipado
- **WHEN** Elara tem o "Anel de Resistência ao Fogo", com o efeito conceder resistência a fogo, e Lyra desequipa o anel
- **THEN** a resistência a fogo sai do cartão Defesas, a menos que esteja marcada na ficha

#### Scenario: Idioma repetido entre ficha e fonte
- **WHEN** Thorin tem o idioma "Anão" marcado na ficha e o traço "Anão", que concede o idioma "anão"
- **THEN** a lista de idiomas mostra "Anão" uma vez, com as origens ficha e o traço

### Requirement: Aviso de armadura sem treinamento
Quando uma armadura ativa for de um tipo (leve, média ou pesada) sem a proficiência correspondente, ou um escudo ativo estiver sem a proficiência com escudo, a ficha SHALL mostrar um aviso junto da CA, citando o item e a regra do 5.5e. Para armadura: desvantagem em testes de d20 de Força e Destreza e impossibilidade de conjurar magias. Para escudo: o escudo não dá o bônus de CA. O aviso SHALL não alterar nenhum valor calculado.

#### Scenario: Elara de cota de malha
- **WHEN** Elara, sem proficiência com armaduras, equipa uma "Cota de Malha" pesada
- **THEN** a ficha avisa que Elara usa "Cota de Malha" sem treinamento com armadura pesada, com a desvantagem em FOR e DES e a impossibilidade de conjurar, e a CA continua calculada com a cota

#### Scenario: Treinamento resolve o aviso
- **WHEN** Thorin equipa uma armadura média e tem a proficiência Média, marcada ou concedida
- **THEN** a ficha não mostra o aviso

### Requirement: Exibição das proficiências e defesas
O cartão Proficiências SHALL mostrar as listas de armaduras, armas, ferramentas e idiomas, e o cartão Defesas as de resistências, imunidades, vulnerabilidades e imunidades a condições. Fora de Editar, cada lista vazia SHALL ficar oculta, e um cartão com todas as listas vazias SHALL ficar oculto. Na ficha compartilhada, os cartões SHALL aparecer só para leitura.

#### Scenario: Ficha sem defesas em Jogar
- **WHEN** Thorin não tem nenhuma defesa marcada nem concedida e a ficha está em Jogar
- **THEN** o cartão Defesas não aparece

#### Scenario: Ficha compartilhada
- **WHEN** alguém abre o link compartilhado de Elara, que tem o idioma "Élfico" e resistência a fogo
- **THEN** os cartões mostram essas entradas sem controles de edição

### Requirement: Valores iniciais das proficiências e defesas
Uma ficha nova, e uma ficha gravada antes de existirem estes campos, SHALL começar sem proficiências com armaduras e armas, sem etiquetas e sem defesas.

#### Scenario: Ficha antiga
- **WHEN** Lyra abre "Thorin", gravada antes desta mudança
- **THEN** os cartões Proficiências e Defesas não têm nada marcado na ficha, e Thorin mantém todos os outros dados
