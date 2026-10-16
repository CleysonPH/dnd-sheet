# Proposal

## Why

A ficha não guarda as proficiências com armaduras, armas, ferramentas e idiomas, nem resistências, imunidades e vulnerabilidades, e o jogador anota tudo fora dela. Muitas dessas entradas vêm de talentos, traços e itens, como Treinamento com Armadura, a resistência a veneno do Anão ou um anel de resistência. Por isso, as fontes precisam concedê-las como já concedem bônus. Na mesa, também falta onde marcar as condições do personagem (Envenenado, Caído...) e a Exaustão, cuja penalidade do 5.5e, −2 por nível nos testes de d20, é fácil de esquecer.

## What Changes

- **Proficiências**: um cartão com:
  - armaduras (Leve, Média, Pesada, Escudo) e armas (Simples, Marciais), em caixas fixas;
  - armas específicas, ferramentas e idiomas, como etiquetas livres com sugestões do PHB.
- **Defesas**: um cartão com resistências, imunidades e vulnerabilidades aos 13 tipos de dano, e imunidade às 15 condições.
- **Efeitos que concedem**: uma operação nova, "conceder", com alvos para cada lista de proficiência e de defesa e um valor (item da lista fechada ou texto livre). Cada lista exibida junta o que o jogador marcou com o que as fontes ativas concedem, mostrando a origem de cada item. Um item que vem de uma fonte só sai quando a fonte é desligada ou excluída.
- **Aviso de armadura sem treinamento**: com uma armadura ou um escudo ativos sem a proficiência correspondente, a ficha avisa da regra do 5.5e (desvantagem em testes de FOR e DES e impossibilidade de conjurar). Os números não mudam.
- **Condições ativas**: uma faixa abaixo do topo onde o jogador marca e desmarca as 14 condições (fora a Exaustão), com o resumo da regra de cada uma. As condições não alteram números.
- **Exaustão de 0 a 6, aplicada pelo motor**:
  - −2 por nível nas salvaguardas, nas perícias, na iniciativa e no ataque mágico, e −1,5 m por nível no deslocamento (sem passar de 0), como parcela visível na origem dos valores;
  - a CD de magia e a Percepção passiva não mudam;
  - no nível 6, a ficha avisa que o personagem morre;
  - o descanso longo reduz a Exaustão em 1.
- **Layout**: Defesas e Proficiências ficam abaixo do cartão Recursos; a faixa de Condições fica abaixo do topo. Condições e Exaustão podem ser alteradas em Jogar; proficiências e defesas, só em Editar. Na ficha compartilhada, as áreas vazias não aparecem.
- **Formato 9 da ficha**: guarda as proficiências, as defesas, as condições ativas, a Exaustão e o valor de cada efeito, com migração.

## Capabilities

### New Capabilities

- `sheet-proficiencies`: proficiências com armaduras, armas, ferramentas e idiomas; defesas contra dano e condições; a união com o que as fontes concedem; o aviso de armadura sem treinamento.
- `sheet-conditions`: condições ativas e Exaustão, com a penalidade aplicada nos valores calculados.

### Modified Capabilities

- `sheet-effects`:
  - **Efeitos nas fontes**: o efeito ganha um valor de texto.
  - **Alvos e operações**: entram os alvos de proficiência e de defesa, com a operação "conceder".
- `sheet-core-stats`:
  - **Organização da ficha na tela**: entram a faixa de Condições e os cartões Defesas e Proficiências.
  - **Modos Jogar e Editar**: condições e Exaustão podem ser alteradas em Jogar.
- `sheet-resources`:
  - **Descanso longo**: reduz a Exaustão em 1.

## Impact

- **Motor**:
  - `src/engine/sheet/`: formato 9 e migração 8 → 9;
  - `src/engine/effects/`: o campo de valor, os alvos novos e a operação "conceder";
  - um módulo novo para as listas de proficiências e defesas, com a união e o aviso de armadura;
  - `src/engine/stats/derive.ts`: a penalidade da Exaustão;
  - `src/engine/resources/rest.ts`: a Exaustão no descanso longo.
- **Interface**:
  - os cartões Proficiências e Defesas;
  - a faixa de Condições;
  - o editor e o resumo dos efeitos;
  - o aviso de armadura;
  - a ficha compartilhada.
- **Dados**: as fichas são migradas ao abrir, e o banco não precisa de migração. Fichas com armadura equipada passam a mostrar o aviso até o jogador marcar o treinamento.
