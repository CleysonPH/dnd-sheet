# Design

## Context

- **Expressões** (`src/engine/effects/expression.ts`):
  - `parseExpression` aceita `for`..`car`, `.mod`, `nivel`, `pb` e `conj.mod`;
  - `evaluate(expression, variables)` lê `ExpressionVariables`, que tem `scores`, `mods`, `level`, `pb` e `spellcastingAbility`;
  - os schemas de efeitos (`effects/schema.ts`), de trackers (`resources/schema.ts`) e de ações (`attacks/schema.ts`) chamam `parseExpression` direto para validar;
  - o `ExpressionField` faz o mesmo para a pré-visualização.
- **Ações** (`src/engine/attacks/derive.ts`):
  - `deriveActionLine(action, source, context)` usa `context.stats.values` para os modificadores, o PB, o ataque mágico e a CD;
  - usa `context.stats.variables` nas expressões e `source` para a proficiência automática, o `upcast` e o atributo de conjuração próprio da magia;
  - `context.exhaustion` e `stats.exhaustionPenalty` entram no caminho geral do acerto.
- **Trackers e descansos** (`src/engine/resources/`):
  - `trackerMax`, `rechargeUsed`, `spend` e `recover` são funções puras sobre o tracker e as variáveis;
  - `shortRest(document, variables)` e `longRest(document, variables)` percorrem só as fontes.
- **PV** (`src/engine/stats/hit-points.ts`): `applyDamage` e `applyHealing` operam sobre o `SheetDocument` e chamam `deriveStats`, a concentração e os testes contra a morte.
- **Condições** (`src/engine/traits/`): `ACTIVE_CONDITIONS`, `conditionsSchema` e os resumos em `src/components/sheet/conditions.ts`.
- **Editores**: o `ActionsEditor` e o `TrackersEditor` recebem a `Source` e escrevem nela; o `ActionsEditor` usa `source.kind` e `source.level` para os valores iniciais e para o campo de círculo.
- **Formato**: a ficha está no formato 10 (`SHEET_SCHEMA_VERSION`), limitada a 256 KiB.

Motivação: proposal.md. Comportamento: a spec `sheet-companions` e as deltas.

## Goals / Non-Goals

**Goals:**
- Reaproveitar o modelo de ação, o de tracker e a gramática das expressões sem duplicá-los. O que muda entre uma fonte e um companheiro é só o contexto do cálculo.
- Manter puro e testável o cálculo do companheiro, no motor (`src/engine/companions/`).
- Não mudar nenhum valor calculado do personagem. As fontes só ganham a descrição das ações (H9).

**Non-Goals:**
- Valor manual (override) nos valores do companheiro. Como CA e PV já são expressões, o jogador escreve o número.
- Origem detalhada por efeito nos valores do companheiro. O companheiro não recebe efeitos, e a origem mostra a expressão e o resultado.
- Ligar o companheiro a uma fonte, ou removê-lo junto com ela.

## Decisions

### H1. Formato do companheiro

`companions` entra no documento como uma lista de 0 a 4 itens. Todos os campos ficam sempre presentes, como nas fontes (E1).

```
Companion {
  id
  name: 1..50
  descriptor: 0..100           // "Média Fera, Neutro"
  abilities: { str..cha: 1..30 }
  savingThrows: { str..cha: boolean }
  skills: { <18 perícias>: none | proficient | expertise }
  allChecks: boolean           // "Teste em tudo" (Pack Bond)
  pbMode: owner | own
  pb: 0..10                    // usado com pbMode = own; 2 inicial
  armorClass: expressão        // "10"
  hitPointsMax: expressão      // "1"
  hitDiceCount: expressão      // "1"
  hitDie: 4 | 6 | 8 | 10 | 12 | 20
  speed, senses, languages: 0..100
  traits: 0..2000
  summon: { enabled: boolean, minLevel: 1..9, level: 1..9 }
  actions: Action[0..6]        // o schema de attacks, no escopo do companheiro
  trackers: Tracker[0..10]     // o schema de resources, no escopo do companheiro
  // estado de mesa
  damage: 0..999
  temp: 0..999
  hitDiceSpent: 0..999
  conditions: ActiveCondition[]
}
```

- **Onde fica**: `src/engine/companions/schema.ts`, com `companionsSchema`, `MAX_COMPANIONS = 4` e `createCompanion(id)`. Os ids são únicos na lista, e as ações e os usos também têm ids únicos dentro do companheiro.
- **`summon.level` abaixo de `minLevel`**: o schema aceita, mas o cálculo usa `max(level, minLevel)`. A interface também não deixa descer abaixo do mínimo. Assim, subir o mínimo nunca deixa a ficha inválida, como acontece com o `amount` dos trackers (R1).
- **Alternativa**: o companheiro como um `SheetDocument` dentro da ficha, reaproveitando o `deriveStats`. Isso traria magias, espaços, inventário, Exaustão e testes contra a morte, que não se aplicam, e o `deriveStats` não sabe ler valores de outro documento.
- **Alternativa**: o companheiro como um quinto tipo de fonte. As fontes têm efeitos que alteram o personagem e estados como "equipado", e misturar uma criatura com PV próprio quebraria o painel de fontes e o compêndio.

### H2. Escopo das expressões

O parser ganha um escopo: `parseExpression(text, scope = "sheet")`, com `scope` igual a `"sheet"` ou `"companion"`.

- **No escopo `sheet`**: aceita só as variáveis de hoje. `dono.*` e `circulo` dão "Variável desconhecida", como pede a spec.
- **No escopo `companion`**: aceita, além das de hoje, duas variáveis novas:

  ```
  Variable += { kind: "owner"; inner: score | mod | pb }   // dono.for, dono.for.mod, dono.pb
            | { kind: "spellLevel" }                        // circulo
  ```

- **Variáveis**: `ExpressionVariables` ganha os campos opcionais `owner?: ExpressionVariables` e `spellLevel?: number`. Avaliar `dono.*` sem `owner` lança `EvaluationError`, que vira 0 e sinalização, como a divisão por zero.
- **Schemas**: viram fábricas com o escopo, `expressionSchema(scope)`, `trackersSchemaFor(scope)` e `actionsSchemaFor(scope)`. As fontes continuam com `trackersSchema` e `actionsSchema`, que são as fábricas chamadas com `"sheet"`, e por isso o formato delas não muda.
- **Cache**: `parseExpressionCached` passa a usar como chave o escopo junto com o texto.
- **`nivel` e `conj.mod` no companheiro**: valem os do dono. As variáveis do companheiro copiam `level` e `spellcastingAbility` do dono, mas os modificadores do dono não estão em `mods`, que são os da criatura. Por isso `conj.mod` no companheiro é resolvido pelo `owner`:

  ```
  conj.mod (companion) = owner.mods[owner.spellcastingAbility] ou 0
  ```

- **Por quê** um escopo e não um prefixo aceito em todo lugar: um efeito de fonte com `dono.con.mod` não tem significado, e aceitá-lo produziria 0 em silêncio.

### H3. Cálculo do companheiro

`deriveCompanion(companion, ownerStats)`, em `src/engine/companions/derive.ts`, devolve:

```
CompanionStats {
  variables: ExpressionVariables     // da criatura, com owner e spellLevel
  pb, spellLevel | null
  mods, saves, skills                // { value, multiplier }
  passivePerception, initiative
  armorClass, hitPointsMax, hitDiceMax: { value, error? }
  hitPointsCurrent, hitDiceAvailable
  down: boolean                      // hitPointsCurrent === 0
}
```

- **PB**: `pbMode = owner` usa `ownerStats.values.proficiencyBonus.value`, que já tem o valor manual. `own` usa `companion.pb`.
- **Salvaguardas**: `mod + PB × (savingThrows[a] || allChecks ? 1 : 0)`.
- **Perícias**: `mod + PB × multiplicador`, em que o multiplicador é o da perícia (0, 1 ou 2) e passa a no mínimo 1 com `allChecks`.
- **Percepção passiva**: 10 mais a perícia Percepção. **Iniciativa**: o modificador de DES.
- **Expressões do bloco**: avaliadas com as variáveis do companheiro. Um erro vale 0 e preenche `error` com a mensagem. Um resultado negativo vale 0.
- **PV atual**: `max(0, hitPointsMax - damage)`, como no personagem (S3). **Dados de vida disponíveis**: `max(0, hitDiceMax - hitDiceSpent)`.
- **Desempenho**: uma ficha tem no máximo 4 companheiros, e o cálculo é linear no número de expressões. O cálculo roda num `useMemo` sobre o documento e os `ownerStats` já calculados.

### H4. Ações do companheiro

O contexto das ações deixa de depender de `DerivedStats` e passa a ter os valores já resolvidos:

```
ActionContext {
  mod(ability): number
  pb: number
  spell: { ability: Ability | null, attack: number, saveDc: number }
  exhaustion: number, exhaustionPenalty: number
  level: number                    // para scaleByLevel / scaleAttacks
  variables: ExpressionVariables
  weaponKeys: Set<string>
  host: "sheet" | "companion"
}
```

- **Na ficha**, `actionContext(document, stats)` monta o contexto com os mesmos valores de hoje. As regras que dependem da fonte não mudam: a magia com atributo próprio usa `spellcastingFor`, o item arma usa `weaponKeys`, e o `upcast` só vale em magia de círculo 1 ou acima.
- **No companheiro**, `companionActionContext(stats, ownerStats, ownerDocument)` monta o contexto assim:
  - `mod` e `pb` vêm da criatura;
  - `spell` vem do dono: `spellAttack`, `spellSaveDc` e o atributo de conjuração da ficha, todos já resolvidos;
  - `exhaustion` é 0, e `level` é o nível do dono;
  - `weaponKeys` é vazio, porque não é usado;
  - `host` é `"companion"`.
- **`deriveActionLine(action, host, context)`** recebe um `host` `{ id, name, autoProficient, upcastApplies, spell? }` em vez da `Source`:
  - `sourceHost(source, context)` traduz uma fonte para essa forma;
  - `companionHost(companion)` faz o mesmo com o companheiro: `autoProficient: true`, `upcastApplies: false` e `spell` igual ao do contexto.
- **Rótulos da origem**: no companheiro, a parcela do caminho da conjuração é "Ataque mágico do dono". Nos outros casos, as parcelas seguem G4.
- **Alternativa**: montar um `DerivedStats` falso para o companheiro e manter a assinatura de hoje. Seriam dezenas de valores irrelevantes, e um teste não perceberia um campo esquecido.

### H5. PV, dados de vida e condições

- **Funções** em `src/engine/companions/table.ts`, puras, sobre `Companion` e o `hitPointsMax` calculado:
  - `applyCompanionDamage`: o PV temporário absorve primeiro, e o dano fica limitado ao máximo;
  - `applyCompanionHealing`: limita o dano ao máximo antes de subtrair, como `applyHealing`;
  - `setCompanionTemp`, `spendCompanionHitDie` e `recoverCompanionHitDie`;
  - `toggleCompanionCondition`.
- **Regras**: as mesmas do personagem, extraídas para funções pequenas sobre `{ damage, temp }` e o máximo, que `applyDamage` e `applyHealing` passam a usar. Assim a regra fica num lugar só, e o personagem continua com a concentração e os testes contra a morte por cima.
- **Condições**: a mesma lista `ACTIVE_CONDITIONS` e os mesmos resumos. A faixa do companheiro é um componente simples, sem Exaustão e sem a lógica de imunidades do dono.

### H6. Descansos

- `shortRest` e `longRest` passam a receber o documento e os `ownerStats`. Os `ownerStats` trazem as variáveis do dono, que eles já usavam, e servem para calcular cada companheiro.
- **Descanso curto**: aplica `shortRest` a cada uso do companheiro, com as variáveis dele.
- **Descanso longo**: aplica `longRest` a cada uso e, além disso, faz `damage = 0`, `temp = 0` e `hitDiceSpent = 0`. As condições não mudam.
- **Uso**: o `ResourcesCard`, que chama os descansos, passa a enviar `stats`. A assinatura muda num lugar só.

### H7. Interface

- **Seção** (`src/components/sheet/companions/companions-section.tsx`):
  - fica no `SheetBody`, depois da grade de atributos e cartões e antes do `SourcesPanel`;
  - em Editar, tem o botão "Adicionar companheiro" e fica visível mesmo vazia;
  - em Jogar e na ficha compartilhada, fica oculta quando não há companheiros.
- **Cartão** (`companion-card.tsx`):
  - na linha 1, o nome, a descrição e o seletor de círculo quando invocado, com − e +, entre o mínimo e 9;
  - na linha 2, a CA, o PV atual/máximo e o temporário, Dano e Cura (com o mesmo campo de valor do `HitPointsCard`), os dados de vida disponíveis/máximo com gastar e recuperar, e "Caído" com 0 PV;
  - em seguida, as condições, as ações (com o `CheckValue` e os formatadores de `attacks/labels.ts`) e os usos, com gastar e recuperar;
  - "Ver bloco" expande atributos, salvaguardas, perícias que somam algo, Percepção passiva, iniciativa, deslocamento, sentidos, idiomas e traços;
  - na ficha compartilhada, mostra os mesmos valores, sem nenhum controle.
- **Formulário** (`companion-form.tsx`), em Editar:
  - abre no próprio cartão;
  - tem os campos do bloco, o PB (do dono ou próprio), a invocação, as expressões com o `ExpressionField` no escopo `companion` (com a pré-visualização pelas variáveis do companheiro), as ações e os usos;
  - permite mover o companheiro para cima e para baixo e excluí-lo, com confirmação na própria ficha.
- **Editores reaproveitados**: o `ActionsEditor` e o `TrackersEditor` passam a receber, em vez da `Source`, as props necessárias:
  - a lista e um `onChange`;
  - os ids dos campos;
  - os valores iniciais (`createAction` para o host);
  - se o campo de círculo aparece;
  - o escopo das expressões;
  - as variáveis da pré-visualização.

  O formulário de fonte passa as mesmas props a partir da fonte.
- **Valores iniciais de uma ação do companheiro**: ataque corpo a corpo com FOR e a parte 1d6 com o atributo do ataque, concussão.

### H9. Descrição da ação e "Sem atributo"

- **Descrição**: `Action` ganha `description`, texto de 0 a 500 caracteres, sempre presente e com `""` em `createAction`. Fica no schema comum, então vale para fontes e companheiros. A `ActionLine` leva a descrição, e a interface a mostra em texto pequeno abaixo da linha no cartão Ataques, no cartão do companheiro, no resumo do cartão da fonte e no `EntrySummary`. No editor, é um campo de várias linhas no fim da ação.
- **"Sem atributo"**: `none` já existia em `ACTION_ABILITIES`, com o rótulo "Nenhum" e no fim da lista, depois dos seis atributos. Por isso não era encontrado. O rótulo passa a "Sem atributo", e `none` passa a ser o primeiro item da lista. Assim, a Mordida do Hound fica com "Sem atributo", sempre proficiente e bônus `dono.con.mod`. O texto de ajuda das ações do companheiro dá esse exemplo.
- **Alternativa**: acrescentar "FOR do dono" .. "CAR do dono" às listas de atributo. Isso duplicaria o que a expressão já faz e criaria valores que só valem em um escopo, num enum comum às fontes.

### H8. Formato 11

- `SOURCE_MIGRATIONS[10] = migrateSourceV10ToV11` acrescenta `description: ""` a cada ação da fonte (H9).
- `migrateV10ToV11` aplica esse passo a cada fonte da ficha e acrescenta `companions: []`. `SHEET_SCHEMA_VERSION` passa a 11.
- O compêndio migra as entradas do formato 10 ao ler, como fez no 10.
- O tamanho cabe com folga: um companheiro cheio, com 6 ações, 10 usos e 2.000 caracteres de traços, tem poucos KiB, bem abaixo dos 256 KiB.

## Risks / Trade-offs

- [Mudar a assinatura de `deriveActionLine` e dos editores pode quebrar as ações das fontes] → Os testes da change `attacks` continuam valendo sem mudança de expectativa. As fontes passam pelo `sourceHost`, e os testes de componente do formulário de fonte cobrem o editor.
- [Um escopo errado na validação deixaria uma fonte aceitar `dono.*`, ou um companheiro recusar] → Há testes nos dois sentidos para os três schemas (efeitos, trackers e ações).
- [O jogador espera que o Pack Bond some na iniciativa] → A spec fixa que a iniciativa não muda, como no bloco do livro. O jogador pode somar à mão mais tarde, quando houver um override.
- [Formulário longo no celular] → As seções do formulário (bloco, ligações, ações e usos) são recolhíveis, como as ações e os efeitos.
- [`circulo` igual a 0 sem invocação pode produzir valores estranhos, como CA 10] → É um valor previsível. A pré-visualização mostra o resultado na hora em que o jogador escreve.

## Migration Plan

1. O deploy leva o formato 11. As fichas são migradas ao abrir e gravadas no 11 no próximo salvamento automático.
2. O banco não tem migração SQL. As entradas do compêndio são migradas ao ler e gravadas no 11 quando um admin as salva.
3. **Rollback**: como no formato 10, voltar o deploy deixaria as fichas já gravadas no 11 sem abrir na versão anterior. A recuperação é por um deploy à frente com a correção ou pelo histórico do Neon.
