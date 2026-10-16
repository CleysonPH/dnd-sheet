# Design

## Context

- **Efeitos** (`src/engine/effects/`):
  - um efeito é `{ id, target, op, expression, proficiency, noArmor, noShield }`, com todos os campos sempre presentes (design E1);
  - os alvos são numéricos e formam uma lista fechada (E2);
  - `collectActiveEffects` filtra as fontes ativas e as condições "sem armadura" e "sem escudo".
- **Motor de cálculo** (`src/engine/stats/derive.ts`):
  - cada valor é resolvido com parcelas (`Contribution`), que formam a origem mostrada no painel;
  - o valor manual substitui o calculado (`resolve`);
  - a Percepção passiva é `10 + skill.perception`, já resolvida;
  - `spellcastingFor` calcula a CD e o ataque de uma magia com atributo próprio (K3).
- **Ficha**: formato 8 (`SHEET_SCHEMA_VERSION`), com a migração encadeada em `migrate.ts`.
- **Descansos**: `src/engine/resources/rest.ts` (`longRest`).
- **Tela**:
  - `sheet-body.tsx` monta a faixa de topo (`.sheet-top`) e a grade com os atributos à esquerda e Recursos à direita;
  - os avisos seguem o do teste de CON da concentração, no cartão de PV.

Motivação: proposal.md. Comportamento: as specs `sheet-proficiencies` e `sheet-conditions` e as deltas.

## Goals / Non-Goals

**Goals:**
- Um só caminho para "conceder" proficiências e defesas, reaproveitando fonte ativa, resumo e editor dos efeitos.
- Penalidade da Exaustão como parcela do cálculo, com o override funcionando como hoje.
- Migração 8 → 9 sem alterar nenhum valor calculado das fichas existentes.

**Non-Goals:**
- Vantagem e desvantagem. As condições não mexem em números.
- Aplicar a regra de armadura sem treinamento nos números (desvantagem, escudo sem bônus). Fica só o aviso (T5).
- Usar proficiência com armas em ataques: a ficha não tem ataques com arma.
- Tipos de dano ou condições da casa. As listas de defesa são fechadas.
- Remover condições automaticamente (por exemplo, inconsciente ao recuperar PV).

## Decisions

### T1. Campo `value` no efeito e operação `grant`

- O efeito ganha `value: string` (até 50 caracteres) e a operação `grant` ("Conceder").
- **Alvos novos**:

  | Alvo | Valor |
  |---|---|
  | `proficiency.armor` | `light`, `medium`, `heavy` ou `shield` |
  | `proficiency.weapon` | `simple`, `martial` ou um texto livre |
  | `proficiency.tool` | texto livre |
  | `language` | texto livre |
  | `defense.resistance`, `defense.immunity`, `defense.vulnerability` | um dos 13 tipos de dano |
  | `defense.conditionImmunity` | uma das 15 condições |

- **`operationsFor`** devolve só `["grant"]` para esses alvos, e `grant` não vale para os numéricos. `usesExpression("grant")` é falso.
- **Validação** no `superRefine` do efeito: com `grant`, o `value` aparado precisa estar na lista fechada do alvo, ou ter de 1 a 50 caracteres nos alvos livres. Nas outras operações, o `value` é ignorado, como o `proficiency` já é, mas continua limitado a 50 caracteres.
- **Por quê** um campo novo, e não o texto em `expression`: a expressão é validada pelo parser em todas as operações que a usam, e misturar texto livre com expressão confundiria a validação e a pré-visualização. Um campo próprio mantém o formato E1, com tudo sempre presente.
- **Alternativa**: uma lista separada de "concessões" na fonte, fora dos efeitos. Ela duplicaria o editor, o resumo e a regra de fonte ativa.

### T2. Dados na ficha (formato 9)

```
proficiencies: {
  armor:   { light, medium, heavy, shield: boolean },
  weapons: { simple, martial: boolean, other: string[] },  // até 30
  tools:     string[],                                     // até 30
  languages: string[],                                     // até 30
}
defenses: {
  resistances, immunities, vulnerabilities: DamageType[],  // sem repetição
  conditionImmunities: Condition[],
}
conditions: ActiveCondition[]   // as 14, sem exaustão, sem repetição
exhaustion: 0..6
```

- **Etiquetas**: aparadas, de 1 a 50 caracteres, sem repetição na mesma lista, comparando com `toLocaleLowerCase("pt-BR")`. A recusa acontece no schema, então vale no cliente e no servidor.
- **Listas fechadas** em `src/engine/traits/keys.ts`: `DAMAGE_TYPES` (13), `CONDITIONS` (15) e `ACTIVE_CONDITIONS` (as 15 sem `exhaustion`). Os rótulos em português ficam em `src/components/sheet/labels.ts`, como nas outras listas.
- **Migração 8 → 9**:
  - acrescenta os campos vazios, `exhaustion: 0` e `value: ""` em cada efeito de cada fonte;
  - os valores ficam escritos na própria migração (S5).

### T3. União das listas com origem

Uma função pura, `deriveTraits(document)`, em `src/engine/traits/derive.ts`, devolve cada lista como `{ key, label, origins }[]`:
- **`key`**: o valor fechado ou o texto em minúsculas;
- **`label`**: o texto da primeira ocorrência, com a ficha primeiro;
- **`origins`**: `"sheet"` e/ou os nomes das fontes.

Ela usa `collectActiveEffects`, então vale a mesma regra de fonte ativa, inclusive "sem armadura" e "sem escudo". A ordem é a da ficha, seguida dos itens novos das fontes. Nas listas fechadas, segue a ordem da lista.

- **Interface**:
  - um item com origem de fonte aparece com o nome da fonte e sem o botão de remover;
  - se ele também está na ficha, continua sem o botão de remover enquanto a fonte o conceder;
  - nas caixas fixas, uma caixa concedida aparece marcada e desabilitada, com a origem ao lado.
- **Por quê** fora do `deriveStats`: as listas não são números, não têm override nem dependências. Um módulo separado mantém o `deriveStats` só numérico.

### T4. Exaustão no cálculo

- **Testes de d20**: com `exhaustion = N > 0`, o `deriveStats` acrescenta a parcela `{ label: "Exaustão N", amount: -2N, kind: "add" }` antes do `resolve` em:
  - `save.*` e `skill.*` (dentro de `proficient`);
  - `initiative`;
  - `spellAttack`;
  - o ataque de `spellcastingFor`.

  O valor manual continua substituindo o calculado inteiro.
- **Percepção passiva**: passa a usar a Percepção **sem** a Exaustão. Se a Percepção tem valor manual, usa o manual, como hoje. Se não, usa o calculado menos a parcela da Exaustão.
  - **Por quê**: no 5.5e, a Exaustão reduz a *rolagem* dos testes de d20, e o valor passivo não é rolado. Não achei uma regra explícita sobre isso, e a leitura literal é a do spec. Se a mesa preferir o contrário, a mudança fica isolada neste ponto.
- **Deslocamento**: depois de "definir" e "somar", aplica `max(0, valor − 1,5N)`, com a parcela "Exaustão N" valendo o quanto de fato tirou (para não mostrar −4,5 quando o deslocamento era 3).
- **CD de magia**: não muda, porque não é rolada.
- **Exaustão 6**: só o aviso, com `role="alert"`, na faixa de condições, junto do controle da Exaustão. A ficha não é bloqueada.

### T5. Aviso de armadura sem treinamento

- Uma função pura, `untrainedArmor(document, traits)`, devolve os itens ativos sem treinamento: cada armadura cujo `armorType` não está na lista de armaduras unida, e cada escudo sem `shield`.
- A faixa de topo mostra o aviso junto da CA, com o nome do item e a regra. A CA não muda.
- **Por quê** só o aviso:
  - as fichas migradas não têm nada marcado, e aplicar a regra derrubaria a CA de todo personagem com escudo até o jogador marcar o treinamento;
  - a desvantagem não é modelada.

  O aviso torna a pendência visível sem mudar números.

### T6. Condições ativas

- São marcadas e desmarcadas por um menu "+ Condição", que lista as que faltam. Cada uma vira um chip com "×".
- **Resumo da regra**: um texto curto, escrito para o projeto, em `src/components/sheet/conditions.ts`. Aparece no `title` e num popover ao tocar, como a ajuda das expressões.
- **Exaustão**: na mesma faixa, com `−` e `+`.
- **Modos**: as duas ações valem em Jogar e em Editar, como a inspiração heroica, e salvam pelo autosave.
- **Imunidade**: a ficha não cruza as condições ativas com as imunidades. A mesa decide.

### T7. Layout

- A faixa de condições é um componente novo entre `.sheet-top` e a grade.
- A coluna da direita passa a ser uma pilha: Recursos, Defesas, Proficiências. No celular, a ordem do DOM fica: topo, condições, Recursos, Defesas, Proficiências, atributos, fontes. Assim, Defesas e Proficiências vêm antes dos atributos, junto com Recursos, que já vem antes deles (R3).
- **Modo leitura**:
  - listas e cartões vazios ficam ocultos;
  - na ficha compartilhada (`"view"`), a faixa de condições só aparece se há condição marcada ou Exaustão acima de 0.

### T8. Descanso longo

O `longRest` faz `exhaustion = max(0, exhaustion − 1)` e não mexe em `conditions`. O texto de confirmação do descanso longo passa a citar a Exaustão quando ela está acima de 0.

### T9. Sugestões

- **Onde ficam**: as listas do PHB 2024 em `src/components/sheet/suggestions.ts`:
  - armas: as 38 armas simples e marciais;
  - ferramentas: as de artesão, os kits, os jogos e os instrumentos;
  - idiomas: os padrões e os raros.
- **Como aparecem**: por `<datalist>`, no cartão e no editor de efeitos. O jogador pode digitar outro nome.
- **Por quê** na UI: são texto em português, sem efeito no cálculo.

## Risks / Trade-offs

- **[Fichas com armadura equipada passam a mostrar o aviso logo depois da migração]** → É o comportamento desejado. O aviso diz o que marcar, e a CA não muda.
- **[A Percepção passiva com Exaustão é uma leitura da regra (T4)]** → Fica isolada numa função e registrada no spec, então mudar custa um teste e uma linha.
- **[O documento cresce com as listas]** → São até 30 etiquetas de 50 caracteres em cada lista livre, bem abaixo dos 256 KB do documento.
- **[O texto livre de fonte e de ficha pode divergir na grafia ("Anão" e "anão")]** → A comparação ignora maiúsculas. Acentos diferentes ("Elfico") continuam como itens separados, o que é aceitável.
- **[O efeito ganha um campo que só a operação `grant` usa]** → É o mesmo padrão de `proficiency`, `noArmor` e `noShield` (E1). O editor esconde o campo nas outras operações.

## Migration Plan

1. O formato 9 e a migração 8 → 9 entram com testes. As fichas são migradas ao abrir, e o banco não muda.
2. **Rollback**: um deploy anterior não lê o formato 9 (versão futura). Para voltar, é preciso o instant restore do Neon. Antes de publicar, a migração precisa estar coberta pelos testes de integração.
