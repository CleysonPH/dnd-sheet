# Proposal

## Why

A ficha guarda as magias, mas não sabe a CD para resistir às magias do personagem nem o bônus de ataque mágico, dois números consultados a cada turno de um conjurador. O jogador calcula à mão, e itens como o Bastão do Pacto (+1 nos dois) ou a Varinha do Mago de Guerra (+1 no ataque) não entram na conta. Talentos de origem do 5.5e, como Iniciado em Magia e Tocado pelas Fadas, e a multiclasse ainda fazem algumas magias usarem um atributo diferente do da classe principal.

## What Changes

- **Atributo de conjuração da ficha**: nenhum, Inteligência, Sabedoria ou Carisma, escolhido em Editar no topo da aba Magias. Fichas novas e antigas começam sem atributo.
- **CD de magia e ataque mágico calculados**: CD = 8 + modificador + bônus de proficiência, e ataque = modificador + bônus de proficiência, mais os efeitos das fontes ativas.
  - São valores derivados com "Ver origem" e valor manual.
  - Aparecem no cartão Combate e no topo da aba Magias quando a ficha tem atributo de conjuração.
- **Atributo próprio por magia**: cada magia usa o atributo da ficha ou um próprio (INT, SAB ou CAR). Uma magia com atributo próprio mostra a CD e o ataque dela, com os mesmos efeitos e sem valor manual.
- **Alvos de efeito novos**: "CD de magia" e "Ataque mágico", com a operação somar.
- **Variável `conj.mod`** nas expressões: o modificador do atributo de conjuração da ficha, ou 0 sem atributo.
- **Formato 8 da ficha**: guarda o atributo de conjuração da ficha e o atributo de cada magia, com migração.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `sheet-core-stats`: novos requisitos "Atributo de conjuração" e "CD de magia e ataque mágico".
- `sheet-effects`:
  - **Alvos e operações**: entram "CD de magia" e "Ataque mágico".
  - **Expressões**: entra a variável `conj.mod`.
- `sheet-sources`: novo requisito "Atributo de conjuração da magia".

## Impact

- **Motor**:
  - `src/engine/sheet/`: formato 8 e migração 7 → 8;
  - `src/engine/sources/schema.ts`: o campo de atributo da magia;
  - `src/engine/stats/keys.ts` e `derive.ts`: os valores `spellSaveDc` e `spellAttack`, e a função que calcula os de uma magia;
  - `src/engine/effects/targets.ts`: os alvos novos;
  - `src/engine/effects/expression.ts`: a variável `conj.mod` e a detecção de ciclos com ela.
- **Interface**:
  - cartão Combate (`top-band.tsx`): os dois quadros;
  - aba Magias: o seletor da ficha e o resumo;
  - formulário e cartão da magia: o atributo próprio;
  - editor de efeitos e a ajuda de expressões.
- **Dados**: fichas migradas ao abrir. O banco não precisa de migração.
