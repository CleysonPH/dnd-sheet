# Design

## Context

- **`deriveStats`** (`src/engine/stats/derive.ts`) calcula, nesta ordem:
  - os atributos, com `definir` e `somar`, e os modificadores;
  - as salvaguardas e as perícias;
  - a iniciativa, a percepção passiva, o deslocamento, o PV máximo e a CA.

  Cada valor passa por `resolve(key, valor, partes)`, que aplica o valor manual e guarda a origem. Os valores simples usam `withAdds(key, base, rótulo, alvo)`.
- **Efeitos**: cada efeito tem um alvo de uma lista fechada (`EFFECT_TARGETS`), e `operationsFor` define as operações aceitas por alvo.
- **Expressões**: são avaliadas com `ExpressionVariables { scores, mods, level, pb }`. Os modificadores já respeitam o valor manual. `referencedAbilities` informa quais atributos uma expressão lê, para detectar ciclos entre efeitos de atributo.
- **Valores derivados com valor manual**: ficam em `DERIVED_KEYS` (`keys.ts`). `derivedLabel` dá o nome mostrado no painel.
- **Interface**: o cartão Combate (`top-band.tsx`) mostra os quadros com `DerivedValue`.
- **Formato**: o documento está no formato 7.

Motivação: proposal.md. Comportamento: `specs/sheet-core-stats`, `specs/sheet-effects` e `specs/sheet-sources`.

## Goals / Non-Goals

**Goals:**
- A CD e o ataque da ficha seguem exatamente o caminho dos outros valores derivados: origem, valor manual e efeitos.
- A CD e o ataque de uma magia com atributo próprio usam a mesma regra, sem duplicar código.

**Non-Goals:**
- Ataques com armas e CDs de outras habilidades, como a do sopro do draconato.
- Valor manual por magia.
- Força, Destreza ou Constituição como atributo de conjuração.

## Decisions

### K1. Formato 8

- **Na ficha**: `spellcastingAbility: z.enum(["none", "int", "wis", "cha"])`, com `"none"` na ficha nova. A lista fica em `SPELLCASTING_ABILITIES`, em `src/engine/stats/keys.ts`.
- **Na magia**: `castingAbility: z.enum(["sheet", "int", "wis", "cha"])`, com `"sheet"` em `createSource`.
- **Migração** `migrateV7ToV8`: grava `spellcastingAbility: "none"` na ficha e `castingAbility: "sheet"` em cada magia.

### K2. Valores derivados `spellSaveDc` e `spellAttack`

- As duas chaves entram em `DERIVED_KEYS` e em `derivedLabel`, com os nomes "CD de magia" e "Ataque mágico".
- No `deriveStats`, depois das perícias:
  - `spellAttack`: base "Modificador de <ATR>" = `mods[atributo]`, mais a parte "Proficiência" = `pb`, mais os efeitos somar do alvo `spellAttack`;
  - `spellSaveDc`: o mesmo, com a parte fixa "Base" = 8 e os efeitos do alvo `spellSaveDc`.
- Sem atributo (`"none"`), o modificador vale 0. Os valores continuam calculados, mas a interface não os mostra (K5).
- **Por quê calcular sem atributo**: as chaves existem sempre, então o valor manual, a origem e os tipos não precisam de casos especiais.

### K3. CD e ataque de uma magia: `spellcastingFor(stats, ability)`

- Uma função pura exportada de `derive.ts`. Ela recebe o resultado de `deriveStats` e um atributo, e devolve `{ saveDc, attack }`, com o modificador do atributo (já com valor manual), o `pb` e os mesmos totais de efeitos do alvo.
- Para isso, `deriveStats` guarda `spellEffects: { saveDc: number; attack: number }`, o total dos efeitos de cada alvo, que o cálculo da ficha já soma.
- **Por quê**: o cartão da magia não recalcula a ficha. Ele usa o `stats` que o editor já tem. O valor manual da CD da ficha não passa para a magia (spec).

### K4. Alvos de efeito e variável `conj.mod`

- **Alvos**: `"spellSaveDc"` e `"spellAttack"` entram em `EffectTarget` e `EFFECT_TARGETS`. Pelo caso padrão de `operationsFor`, ficam só com "somar". Os rótulos "CD de magia" e "Ataque mágico" entram nos rótulos do editor de efeitos e nos resumos ("+1 CD de magia").
- **Variável**: o parser reconhece `conj.mod` como `{ kind: "spellcasting" }`, e `ExpressionVariables` ganha `spellcastingAbility: Ability | null`. O `evaluate` devolve `mods[spellcastingAbility]`, ou 0 sem atributo.
- **Ciclos**: `referencedAbilities(expression, spellcastingAbility)` passa a tratar `conj.mod` como uma leitura do atributo de conjuração. Assim, um efeito "somar `conj.mod` em INT", com conjuração INT, é detectado como dependência circular, como "somar `int.mod` em INT" já é hoje.
- **Por quê `conj.mod`**: segue o padrão `<abreviação>.mod` das variáveis e lê "modificador de conjuração".

### K5. Interface

- **Cartão Combate**: dois `Tile` novos, "CD de magia" (sem sinal) e "Ataque mágico" (com sinal), com `DerivedValue`, só quando `spellcastingAbility !== "none"`.
- **Topo da aba Magias**: em Editar, um `SelectField` "Atributo de conjuração" com Nenhum, Inteligência, Sabedoria e Carisma. Em Jogar, sem atributo, nada aparece; com atributo, o resumo "Conjuração: CAR · CD 14 · Ataque +6", ao lado da contagem de preparadas.
- **Formulário da magia**: um `SelectField` "Atributo", com "Da ficha", Inteligência, Sabedoria e Carisma.
- **Cartão da magia**: com atributo próprio, a etiqueta "INT · CD 12 · +4", com os valores de `spellcastingFor`.
- **Ajuda das expressões**: o texto de ajuda, onde houver, ganha `conj.mod`.

## Risks / Trade-offs

- **[Magia com atributo próprio numa ficha sem atributo]** → Funciona: a magia usa o próprio atributo e mostra a CD e o ataque dela, mesmo com a ficha sem CD.
- **[O valor manual da CD da ficha não vale para as magias com atributo próprio]** → É o comportamento escolhido. Quem precisa de outro número para uma magia ajusta com um efeito na própria magia, embora isso some na ficha inteira. Por isso fica registrado como limitação.
- **[Efeitos na CD também valem para a magia com atributo próprio]** → É o correto para itens como o Bastão do Pacto, que melhoram todas as magias. Não existe efeito "só para esta magia".

## Migration Plan

Não há migração de banco. As fichas passam ao formato 8 ao serem lidas: sem atributo de conjuração e com as magias usando o da ficha. Para voltar atrás, é preciso reverter o código antes que alguma ficha seja salva no formato 8.
