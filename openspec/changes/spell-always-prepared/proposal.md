# Proposal

## Why

No 5.5e, alguns talentos, itens e subclasses concedem magias que ficam sempre preparadas, como o Passo Nebuloso de Tocado pelas Fadas ou as magias de domínio do clérigo. Essas magias não podem ser despreparadas e não contam no limite de magias preparadas do personagem. Hoje a ficha só tem a marcação "Preparada", que tem dois estados. Uma magia sempre preparada aparece como uma preparada qualquer: pode ser desmarcada na mesa e entra na contagem como se ocupasse uma vaga.

## What Changes

- **"Sempre preparada"**: a preparação de uma magia passa a ter três estados, "Não preparada", "Preparada" e "Sempre preparada". Truques continuam sem preparação.
- **Em Jogar**: uma magia sempre preparada mostra a etiqueta "Sempre preparada" e não pode ser despreparada. O estado só muda em Editar.
- **Contagem da aba Magias**: separa as preparadas das sempre preparadas, porque só as primeiras contam no limite da classe.
- **Rótulo "Origem"**: o campo "Classe" da magia passa a se chamar "Origem", porque também guarda o talento ou o item que concede a magia, como "Tocado pelas Fadas". O dado não muda.
- **Formato 6 da ficha**: a migração do formato 5 converte a preparada em "Preparada" e a não preparada em "Não preparada".

Fora do escopo:
- vincular a magia à fonte que a concede;
- conjuração gratuita por descanso, que já é coberta por um tracker na própria magia.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `sheet-sources`:
  - **Campos de magia**: a marcação "preparada" vira a preparação com três estados, e o campo "classe que a conhece" passa a ser a origem.
  - **Magias por círculo**: a contagem separa as preparadas das sempre preparadas.
  - **Ações de mesa nas fontes**: em Jogar, uma magia sempre preparada não pode ser despreparada.

## Impact

- **Motor** (`src/engine/sources/`):
  - `schema.ts`: o campo `prepared` vira `preparation`, e a regra de truque muda junto;
  - `rules.ts`: `createSource` e a contagem de preparadas mudam, e entra a contagem de sempre preparadas.
- **Documento da ficha** (`src/engine/sheet/`): `SHEET_SCHEMA_VERSION` passa a 6, com a `migrateV5ToV6` em `migrate.ts`.
- **Interface** (`src/components/sheet/sources/`):
  - `source-form.tsx`: seletor de preparação e rótulo "Origem";
  - `source-card.tsx`: caixa "Preparada" ou etiqueta "Sempre preparada", e o detalhe "Origem";
  - `sources-panel.tsx`: as duas contagens.
- **Dados**: todas as fichas gravadas passam pela migração ao serem abertas. O banco não precisa de migração.
