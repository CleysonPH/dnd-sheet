# Design

## Context

A magia é uma fonte `kind: "spell"` (`src/engine/sources/schema.ts`) com `prepared: boolean` e `spellClass` (texto livre de até 100 caracteres, mostrado como "Classe"). As regras ligadas à preparação estão espalhadas:

- **Schema**: o `superRefine` de `sourcesSchema` recusa um truque com `prepared: true`.
- **Motor**: `createSource` cria a magia com `prepared: false`, e `preparedCount` conta as magias de 1º círculo ou acima com `prepared` em `rules.ts`.
- **Interface**:
  - `source-form.tsx` tem a caixa "Preparada", escondida em truques. Ao mudar o círculo para truque, zera o `prepared`.
  - `source-card.tsx` (`SpellActions`) mostra a mesma caixa nos dois modos, Jogar e Editar.
  - `sources-panel.tsx` mostra "Preparadas: N".
- **Formato**: o documento está no formato 5 (`SHEET_SCHEMA_VERSION = 5`). Cada formato novo ganha uma função em `SHEET_MIGRATIONS`, com os valores escritos na própria migração.

Motivação: proposal.md. Comportamento: `specs/sheet-sources`.

## Goals / Non-Goals

**Goals:**
- Um único campo com três estados, sem combinações inválidas.
- Converter as fichas existentes sem perda.

**Non-Goals:**
- Vincular a magia ao talento ou ao item que a concede (descartado na exploração).
- Limite de magias preparadas por classe. A ficha só conta; quem controla o limite é o jogador.
- Renomear `spellClass` no documento. Só o rótulo muda (M5).

## Decisions

### M1. `preparation: "none" | "prepared" | "always"` no lugar de `prepared`

- `SPELL_PREPARATIONS` em `src/engine/sources/kinds.ts` e `SPELL_PREPARATION_LABEL` em `src/components/sheet/sources/labels.ts`, com "Não preparada", "Preparada" e "Sempre preparada", como os outros enums das fontes.
- **Por quê**: um enum torna impossível a combinação "sempre preparada, mas não preparada".
- **Alternativa**: manter `prepared` e acrescentar `alwaysPrepared: boolean`. São dois campos que precisariam de uma regra de consistência, e toda leitura teria de combiná-los.

### M2. Truque só com `"none"`

- O `superRefine` passa a recusar um truque com `preparation` diferente de `"none"`, com a mensagem atual "Truques não são preparados".
- O formulário, ao mudar o círculo para truque, grava `preparation: "none"`, como hoje grava `prepared: false`.

### M3. Formato 6 e a migração 5 → 6

- `SHEET_SCHEMA_VERSION = 6`. A `migrateV5ToV6` troca `prepared` por `preparation` nas magias: `true` vira `"prepared"`, e `false` ou ausente vira `"none"`. As outras fontes não mudam.
- O `spellSchema` é `strictObject`, então um documento migrado que ainda tivesse `prepared` seria recusado. A migração remove o campo.

### M4. Contagens

- `preparedCount` passa a contar só `"prepared"`, e entra `alwaysPreparedCount` para `"always"`. As duas contam só magias de 1º círculo ou acima. Pelo M2, um truque nunca tem outro valor, mas o filtro continua como proteção.
- A aba Magias mostra "Preparadas: N · Sempre preparadas: M", sempre as duas, inclusive com zero, para a leitura ser estável.

### M5. Interface

- **Formulário**: a caixa "Preparada" vira um `SelectField` "Preparação" com os três estados, escondido em truques.
- **Cartão** (`SpellActions`): numa magia `"always"`, a caixa dá lugar à `Badge` "Sempre preparada", sem ação. Nas outras de 1º círculo ou acima, a caixa "Preparada" continua e alterna entre `"none"` e `"prepared"`, nos dois modos. Assim, em Jogar, a sempre preparada não pode ser despreparada (spec), e em Editar o estado muda pelo formulário.
- **Detalhes da magia**: a linha "Classe" vira "Origem", e entra a linha "Preparação" com o rótulo do estado. No formulário, o campo passa a "Origem", com o exemplo "ex.: Mago ou Tocado pelas Fadas".
- **Por quê manter `spellClass`**: renomear o campo exigiria migração e mudanças no schema e nos testes, sem nenhum ganho para quem usa a ficha. Um comentário no schema registra que o campo guarda a origem.

## Risks / Trade-offs

- **[Ficha aberta em outra aba ainda no formato 5 tenta salvar depois do deploy]** → É o mesmo caso das migrações anteriores. O servidor valida no formato atual e recusa um `prepared` que sobrou, e quem salva recebe o erro já tratado pela ficha. Recarregar a página resolve.
- **[Quem usa "Classe" para filtrar ou agrupar mentalmente estranha o rótulo "Origem"]** → O valor gravado não muda, e o exemplo do campo mostra os dois usos.

## Migration Plan

Não há migração de banco. Cada ficha é convertida quando é lida (`migrateSheetDocument`) e gravada no formato 6 no próximo salvamento. Para voltar atrás, é preciso reverter o código antes que alguma ficha seja salva no formato 6. Depois disso, a versão anterior recusaria esses documentos como "mais novos que o suportado".
