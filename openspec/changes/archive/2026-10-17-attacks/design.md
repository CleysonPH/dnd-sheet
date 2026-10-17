# Design

## Context

- **Fontes** (`src/engine/sources/schema.ts`):
  - todas as fontes têm `effects` e `trackers`, com todos os campos sempre presentes (design E1);
  - o item de categoria `weapon` não tem nenhum campo próprio;
  - a magia tem `castingAbility`, que é `sheet` ou um atributo próprio (K1).
- **Cálculo** (`src/engine/stats/derive.ts`):
  - `deriveStats` devolve os valores com parcelas (`Contribution`), as variáveis das expressões (`variables`) e a penalidade da Exaustão (`exhaustionPenalty`);
  - `values.spellAttack` e `values.spellSaveDc` já trazem o valor manual;
  - `spellcastingFor(stats, ability)` calcula o ataque e a CD de uma magia com atributo próprio, com os efeitos e a Exaustão.
- **Proficiências** (`src/engine/traits/derive.ts`):
  - `deriveTraits(document).weapons` junta as categorias e os nomes marcados na ficha com os concedidos pelas fontes ativas;
  - as chaves são `simple`, `martial` ou `tag:` + `tagKey(nome)`.
- **Expressões** (`src/engine/effects/expression.ts`): `parseExpression` e `evaluate` com `nivel`, `pb`, `for.mod`..`car.mod` e `conj.mod`. O nível é `identity.level`, o nível total do personagem.
- **Formato**:
  - a ficha está no formato 9, limitada a 256 KiB (`SHEET_MAX_BYTES`);
  - a partir do 9, toda mudança nas fontes também define o passo correspondente em `SOURCE_MIGRATIONS` (B2), que o compêndio usa ao ler as entradas.
- **Tela**:
  - `sheet-body.tsx` põe Recursos, Defesas e Proficiências na coluna da direita;
  - `derived-value.tsx` tem o `PanelShell` e o `Contributions`, que mostram a origem de um valor;
  - o formulário de fonte (`source-form.tsx`) tem os editores de efeitos e de trackers;
  - o `EntrySummary` mostra os resultados do compêndio.

Motivação: proposal.md. Comportamento: a spec `sheet-attacks` e as deltas.

## Goals / Non-Goals

**Goals:**
- Um único modelo de ação para os quatro tipos de fonte, validado pelo mesmo schema na ficha e no compêndio.
- Cálculo puro no motor (`src/engine/attacks/`), testável sem a interface, que reaproveita os valores já resolvidos em vez de refazer as contas.
- Dados estruturados (quantidade e dado), prontos para uma rolagem futura sem migração.
- Migração 9 → 10 sem mudar nenhum valor calculado.

**Non-Goals:**
- Valor manual no acerto ou na CD de uma ação. O ajuste é feito pelo bônus da ação.
- Dano mínimo, crítico, resistências do alvo, munição e consumo de usos.
- Alvos de efeito novos. Os efeitos de ataque mágico já valem nas ações com conjuração (G4).
- Escolher em que círculo conjurar. A ficha mostra só o acréscimo por círculo.

## Decisions

### G1. Formato da ação e da parte

Os campos ficam sempre presentes, como nos efeitos (E1). O que não se aplica ao modo de resolução é ignorado no cálculo e escondido no editor.

```
Action {
  id, name                       // nome: 0..50; vazio = só o nome da fonte
  resolution: attack | save | auto
  range: melee | ranged          // só ataque
  attackAbility: ActionAbility   // só ataque
  proficiency: auto | always | never
  attackBonus: expressão         // só ataque; "0"
  saveAbility: Ability           // só salvaguarda
  dcMode: spell | expression
  dcAdjust: -10..10              // com dcMode = spell
  dcExpression: expressão        // com dcMode = expression; "8 + pb"
  onSuccess: none | half
  scaleAttacks: boolean          // "×N" pelos níveis 5/11/17
  parts: Part[1..4]
}

Part {
  id
  count: 0..40
  die: d4 | d6 | d8 | d10 | d12 | d20
  ability: ActionAbility | attack   // "attack" = o mesmo do acerto
  bonus: expressão                  // "0"
  type: DamageType | healing | tempHp
  scaleByLevel: boolean
  upcast: 0..20                     // dados extras por círculo; só magias de círculo >= 1
}

ActionAbility = str | dex | con | int | wis | cha | none | finesse | spellcasting
```

- **Validação**: as expressões (`attackBonus`, `bonus` e `dcExpression`) são sempre validadas pelo parser, mesmo quando o modo não as usa. É a regra do `amount` dos trackers (R1): trocar de modo nunca apaga nem invalida nada.
- **Limites**: até 6 ações por fonte (`MAX_ACTIONS_PER_SOURCE`), de 1 a 4 partes por ação, e ids únicos dentro da fonte e dentro da ação.
- **`attack` fora de uma ação de ataque** vale como `none`. O schema não recusa esse valor, porque trocar o modo de resolução tornaria a fonte inválida.
- **Onde fica**: em `src/engine/attacks/schema.ts`. `actions` entra no `base` das fontes, ao lado de `effects` e `trackers`.
- **Alternativa**: o bloco fixo do Roll20 nas magias (Has Attack, Has Save e Has Heal, com 2 danos) e uma lista só nos itens. Ele não cobre o Sopro do Draconato, que é um traço, nem armas versáteis com um bloco único, e duplicaria o formato.
- **Alternativa**: o dano como texto livre ("1d8 + for.mod"), ampliando a gramática com dados. Escalar a quantidade de dados e uma rolagem futura exigiriam reinterpretar o texto. Um dado estruturado resolve as duas coisas sem parser novo.

### G2. Categoria de arma no item

- O item ganha `weaponCategory: simple | martial`, usada quando a categoria é `weapon`.
- Fica sempre presente, como `armorType`, com valor inicial `simple`.

### G3. Proficiência

A função `isProficient(action, source, weaponKeys)` decide assim:

| `proficiency` | Fonte | Resultado |
|---|---|---|
| `always` | qualquer | proficiente |
| `never` | qualquer | não proficiente |
| `auto` | item de categoria `weapon` | `weaponKeys` contém `weaponCategory` ou `tag:` + `tagKey(item.name)` |
| `auto` | outras fontes | proficiente |

`weaponKeys` é o conjunto das chaves de `deriveTraits(document).weapons`. Por isso, o que as fontes ativas concedem já entra, e o nome compara sem diferenciar maiúsculas, como as etiquetas.

### G4. Acerto

- **Caminho da conjuração**: com `attackAbility = spellcasting` e `proficiency = auto`, o acerto é o ataque mágico da fonte mais o `attackBonus`:
  - o ataque mágico é `stats.values.spellAttack.value`, que já traz o valor manual, os efeitos e a Exaustão, quando a fonte usa o atributo da ficha (talentos, traços, itens e magias com `castingAbility = sheet`);
  - é `spellcastingFor(stats, ability).attack` quando a magia tem atributo próprio;
  - as parcelas são "Ataque mágico" e o bônus da ação.
- **Caminho geral**, nos outros casos:

  ```
  acerto = mod(atributo) + PB se proficiente + bônus + exhaustionPenalty
  ```

  - **acuidade**: `max(mod.str, mod.dex)`, e a parcela leva o nome do atributo escolhido, "Acuidade (DES)";
  - **conjuração com `always` ou `never`**: usa o modificador do atributo de conjuração da fonte;
  - **parcelas**: atributo, "Proficiência", "Bônus da ação" (só quando diferente de 0) e "Exaustão N" (só com Exaustão).
- **Modificadores**: vêm de `stats.values["mod.x"].value`, que já trazem o valor manual, como em `spellcastingFor`.
- **Por quê** usar o valor resolvido do ataque mágico: a spec pede que o valor manual e os efeitos do ataque mágico valham nas ações. Recalcular duplicaria a regra K2/K3.

### G5. CD

- **`dcMode = spell`**: `stats.values.spellSaveDc.value`, ou `spellcastingFor(...).saveDc` para uma magia com atributo próprio, mais `dcAdjust`.
- **`dcMode = expression`**: `evaluate(dcExpression, stats.variables)`.
- As parcelas seguem o mesmo padrão do acerto.

### G6. Dano

Para cada parte:

```
mult       = 1 + (nível >= 5) + (nível >= 11) + (nível >= 17)
quantidade = count * (scaleByLevel ? mult : 1)
mod        = modificador(ability)          // attack = o do acerto; none = 0
total      = mod + evaluate(bonus)
texto      = quantidade > 0 ? `${quantidade}${die}${sinal(total)}` : `${total}`
```

- **Sinal**: `sinal(0)` é vazio, e os negativos aparecem como `-1`.
- **Ataques da ação**: `attacks = scaleAttacks ? mult : 1`. A lista mostra "×N" quando N > 1.
- **Círculo maior**: `upcast` aparece como `(+${upcast}${die}/círculo)` só numa magia com `level >= 1` e `upcast > 0`.
- **Resultado do motor**: dados estruturados (`{ count, die, modifier, type, upcast }`), não texto. A interface formata os rótulos em português, como faz com os efeitos.
- **Por quê** um multiplicador e não uma tabela de dados por nível: o 5.5e usa os mesmos degraus (5/11/17) nos truques e no Sopro, e a multiplicação da quantidade cobre todos os casos citados.

### G7. Linhas e onde aparecem

O módulo `src/engine/attacks/derive.ts` exporta:

- `actionContext(document, stats)`: monta uma vez `weaponKeys`, os modificadores, o nível e os valores de conjuração;
- `deriveSourceActions(source, context)`: devolve as linhas de uma fonte, para o cartão da fonte;
- `deriveAttackList(document, stats)`: devolve as linhas da lista Ataques.

A lista Ataques:

- **Quem entra**:
  - itens com `equipped`, mesmo sem a sintonização, porque uma arma que requer sintonização ainda ataca sem ela;
  - todos os talentos e traços;
  - magias com `level === 0` ou `preparation !== "none"`.
- **Ordem**: os itens na ordem da ficha, depois os talentos e traços na ordem da ficha, depois as magias pela ordem de `spellsByLevel`.

A linha (`ActionLine`) tem:

- `sourceId`, `sourceName`, `actionId`, `name`, `resolution` e `range`;
- `toHit` ou `dc`, com o valor e as parcelas;
- `saveAbility`, `onSuccess`, `attacks` e `parts`.

### G8. Interface

- **Cartão Ataques** (`attacks-card.tsx`):
  - fica no topo da coluna da direita, antes de Recursos, e no celular aparece logo depois da faixa de condições;
  - cada linha tem o nome da fonte e o nome da ação, o alcance, o acerto ou "SAB CD 15" e o dano, quebrando em duas linhas na largura do celular;
  - o acerto abre a origem com o `PanelShell` e o `Contributions` de `derived-value.tsx`, exportados para isso, sem valor manual;
  - em Jogar e na ficha compartilhada, o cartão sem linhas não aparece; em Editar, mostra a dica.
- **Editor de ações** (`actions-editor.tsx`), no formulário da fonte, depois de efeitos e trackers:
  - segue o padrão do editor de trackers: lista, mover para cima e para baixo, excluir;
  - os campos aparecem conforme o modo de resolução;
  - as partes ficam em linhas que quebram no celular;
  - as expressões usam o `ExpressionField`, com a pré-visualização;
  - o campo "por círculo" só aparece em magias de círculo 1 ou acima.
- **Valores iniciais** (`createAction(source)`):
  - item arma: ataque corpo a corpo com FOR e a parte 1d8 com o atributo do ataque, concussão;
  - magia: ataque à distância com conjuração e a parte 1d10 de energia, sem atributo;
  - outras fontes: ataque corpo a corpo com FOR e a parte 1d6 com o atributo do ataque, concussão.
- **Resumo**:
  - o cartão da fonte e o `EntrySummary` mostram as linhas da fonte num formato compacto ("+7 · 1d4+4 concussão + 2d8 trovejante");
  - no compêndio, o contexto vem de uma ficha nova (`createSheetDocument` + `deriveStats`, calculados uma vez por módulo), como a pré-visualização das expressões (B6).

### G9. Formato 10

- **Passo das fontes**: `SOURCE_MIGRATIONS[9]` acrescenta `actions: []` a toda fonte e `weaponCategory: "simple"` aos itens.
- **Passo da ficha**: `migrateV9ToV10` aplica esse passo a cada fonte da ficha. É a primeira vez que a regra B2 é usada.
- `SHEET_SCHEMA_VERSION` passa a 10. O compêndio passa a gravar as entradas no formato 10 e migra ao ler as do 9.
- `copyToSheet` e `withoutTableState` não mudam, porque as ações não têm estado de mesa.

## Risks / Trade-offs

- [Muitas ações aumentam o documento: 300 fontes × 6 ações passariam de 256 KiB] → O limite do documento continua valendo, com o erro de salvamento que já existe. Uma ficha real tem dezenas de ações, bem abaixo do limite.
- [Mostrar números diferentes do que a mesa espera, como a versátil sem a segunda ação] → O cartão da fonte mostra as ações mesmo fora da lista, e o editor deixa tudo explícito. Não há regra escondida.
- [Proficiência pelo nome falha com nomes diferentes, como "Rapieira +1" e a proficiência "Rapieira"] → A proficiência pela categoria cobre a maior parte dos casos, e a ação pode ser marcada como sempre proficiente.
- [Penalidade da Exaustão contada duas vezes no caminho da conjuração] → O caminho da conjuração usa o ataque mágico já resolvido e não soma a Exaustão de novo. Um teste cobre isso.
- [Formulário de fonte longo no celular] → As ações e as partes são recolhíveis, como os efeitos, com um resumo de uma linha.

## Migration Plan

1. O deploy leva o formato 10. As fichas são migradas ao abrir e gravadas no 10 no próximo salvamento automático. As entradas do compêndio são migradas ao ler e gravadas no 10 quando um admin as salva.
2. O banco não tem migração SQL.
3. **Rollback**: voltar o deploy deixaria as fichas já gravadas no formato 10 sem abrir na versão anterior, que recusa formatos futuros. Nesse caso, a recuperação é pelo histórico do Neon, como está no README, ou por um deploy à frente com a correção.
