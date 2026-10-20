# Proposal

## Why

Várias classes e magias dão ao personagem uma criatura com ficha própria: o Hound do Dog and Hound, o Steel Defender do Battle Smith, o familiar do Find Familiar e o Otherworldly Steed do Find Steed. Hoje o jogador acompanha essa criatura fora da ficha, com papel ou com uma segunda ficha que não conhece o personagem. Isso é um problema porque os números da criatura costumam depender do dono, como "12 + seu modificador de CON", "5 + 5 × seu nível" ou "bônus igual ao seu ataque mágico". Outras dependem do círculo usado na invocação, como "10 + 1 por círculo". O motor da ficha já tem expressões, ações de ataque, trackers e o bloco de PV. Falta um lugar para a criatura que use essas peças com os valores dela e os do dono.

## What Changes

- **Companheiros na ficha**: cada ficha pode ter até 4 companheiros. Eles ficam guardados dentro da própria ficha, com um bloco de criatura:
  - nome e descrição livre (tamanho, tipo, alinhamento);
  - seis atributos;
  - salvaguardas e perícias proficientes;
  - CA, PV máximo e dados de vida por expressão;
  - deslocamento, sentidos, idiomas e traços em texto;
  - ações no mesmo modelo da change `attacks`;
  - usos (trackers).
- **Três ligações opcionais com o dono**, que um familiar com números fixos pode não usar:
  - **PB**: o do dono ou um próprio;
  - **variáveis do dono** nas expressões: `dono.con.mod`, `dono.pb` e as demais. `nivel` e `conj.mod` também são os do dono;
  - **invocação por magia**: um círculo mínimo e o círculo atual, que o jogador troca em Jogar. O círculo atual vale como a variável `circulo`.
- **Teste em tudo**: uma marcação que soma o PB em todo teste de atributo e salvaguarda da criatura, como o Pack Bond do Hound.
- **Ações do companheiro**: são calculadas com os atributos da criatura e, quando usam conjuração, com o ataque mágico e a CD de magia do dono. Aparecem no cartão do companheiro, e não no cartão Ataques do personagem.
- **Estado de mesa**: dano e cura com o PV temporário, dados de vida gastos, usos e uma faixa de condições própria, só com os rótulos. Com 0 PV, o companheiro aparece como caído, sem testes contra a morte.
- **Descansos**: o descanso curto da ficha também recarrega os usos de curto dos companheiros. O descanso longo também restaura os PV, os PV temporários, os dados de vida e os usos de longo deles.
- **Tela**: uma seção "Companheiros" antes do painel de fontes. Cada companheiro tem um cartão compacto (CA, PV, dados de vida, círculo e ações) que se expande para o bloco completo e abre o formulário em Editar. A ficha compartilhada mostra os companheiros só para leitura.
- **Descrição da ação**: toda ação, de fonte ou de companheiro, ganha uma descrição opcional para o que os valores não mostram, como o efeito extra da Mordida do Hound.
- **"Sem atributo" no acerto**: a opção que já existia como "Nenhum", no fim da lista, passa a se chamar "Sem atributo" e vem primeiro. É o caminho para um acerto que soma só o PB e um bônus como `dono.con.mod`.
- **Formato 11 da ficha**, com migração que acrescenta a lista vazia de companheiros e a descrição vazia em toda ação. O compêndio ganha o passo correspondente das fontes.

## Capabilities

### New Capabilities

- `sheet-companions`: os companheiros da ficha:
  - o bloco de criatura e as ligações com o dono;
  - as variáveis das expressões do companheiro;
  - os valores calculados e as ações;
  - os usos, o estado de mesa, as condições e a seção na tela.

### Modified Capabilities

- `sheet-attacks`:
  - **Descrição da ação** (novo requisito): texto opcional em toda ação, mostrado junto dos valores.

- `sheet-resources`:
  - **Descanso curto**: também recarrega os usos de curto dos companheiros;
  - **Descanso longo**: também restaura os PV, os PV temporários, os dados de vida e os usos de longo dos companheiros.
- `sheet-core-stats`:
  - **Organização da ficha na tela**: entra a seção Companheiros, antes do painel de fontes.

## Impact

- **Motor**:
  - `src/engine/sheet/`: formato 11 e migração 10 → 11;
  - `src/engine/sources/migrate.ts`: o passo 10 das fontes, com a descrição das ações;
  - `src/engine/effects/expression.ts`: um escopo de companheiro, com as variáveis `dono.*` e `circulo`, que as fontes continuam recusando;
  - `src/engine/attacks/derive.ts`: o cálculo das ações aceita, além de uma fonte, um companheiro;
  - `src/engine/resources/`: os descansos passam pelos companheiros, e os schemas de tracker passam a aceitar o escopo das expressões;
  - um módulo novo `src/engine/companions/`, com o schema, o cálculo e o dano e a cura.
- **Interface**:
  - a seção e o cartão do companheiro;
  - o formulário do companheiro, que reaproveita os editores de ações e de trackers;
  - a faixa de condições do companheiro;
  - a ficha compartilhada.
- **Dados**: as fichas são migradas ao abrir, e o banco não precisa de migração. Nenhum valor calculado do personagem muda. As entradas do compêndio no formato 10 são migradas ao ler, ganhando a descrição vazia nas ações.
- **Fora do escopo**:
  - compêndio de criaturas;
  - efeitos entre o dono e a criatura, como o Life Bond ou o Mutt With Moxie;
  - variantes automáticas (Celestial, Fey ou Fiend);
  - iniciativa e ordem de turno;
  - Exaustão do companheiro;
  - rolar dados.
