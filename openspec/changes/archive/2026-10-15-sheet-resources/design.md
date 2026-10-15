# Design

## Context

- **Formato 4** (`src/engine/sheet/document.ts`, `src/engine/sources/schema.ts`): fontes com efeitos. As expressões têm parser, avaliador e cache próprios (`src/engine/effects/expression.ts`), e `deriveStats` devolve as variáveis atuais (`stats.variables`).
- **PV guardado como dano** (`hitPoints.damage`): o atual é calculado. Os dados de vida guardam os gastos (`hitDiceSpent`). Dano, cura e a normalização dos testes contra a morte estão em `src/engine/stats/hit-points.ts`.
- **Toda edição passa por `update`** no `SheetEditor`, que aplica `normalizeDeathSaves` e entrega ao autosave.
- **Faixa de topo** (`.sheet-top` em `globals.css`): PV, combate e dados de vida. Logo abaixo vem a grade de atributos.
- **Confirmações** já são feitas na própria ficha, sem `window.confirm` (excluir ficha, excluir fonte).

Decisões de produto: D7 de `dnd-sheet-architecture`, mais as respostas do usuário registradas no proposal. Comportamento: `specs/sheet-resources` e a delta de `sheet-core-stats`.

## Goals / Non-Goals

**Goals:**
- **Recursos guardados como "usado"**: como o PV guarda o dano, para que mudar o máximo leve o atual junto e o descanso seja só zerar o usado.
- **Descansos como funções puras e testadas** sobre o documento.
- **Uma regra de recarga por tipo de descanso**, cobrindo a recarga parcial do 5.5e (ex.: Inspiração de Bardo recupera tudo no longo e 1 no curto). *(Acrescentado a pedido do usuário depois da primeira implementação.)*

**Non-Goals:**
- Tabela de espaços por classe, multiclasse e rolagem de dados de vida.
- Desligar "em efeito" ou a concentração no descanso.

## Decisions

### R1. Formato 5

```ts
type Tracker = {
  id: string;             // crypto.randomUUID(), único na fonte
  name: string;           // 1..50
  max: string;            // expressão, mesma gramática dos efeitos (0..100)
  used: number;           // inteiro 0..999
  shortRest: Recharge;    // regra do descanso curto
  longRest: Recharge;     // regra do descanso longo
};

type Recharge = {
  mode: "none" | "all" | "amount";
  amount: string;         // expressão (0..100), usada quando mode = "amount"
};

// em toda fonte:
trackers: Tracker[]       // até 10

// na ficha:
spellSlots: { max: number; used: number }[]   // exatamente 9 (1º..9º), inteiros 0..20
pactSlots: { level: number; max: number; used: number }  // level 1..9, max/used 0..20
```

- **`used` em vez do valor atual**, pela mesma razão do dano (S3 de `sheet-core-stats`): o atual é `max(0, máximo - usado)`. Quando o máximo cresce (CAR, nível), o atual cresce junto, e recarregar é `used = 0`.
- **Uma regra por descanso**, em vez de um único "recarrega no curto/longo": cada descanso aplica só a sua regra, como o texto das características do 5.5e ("ao terminar um descanso curto ou longo"). Pontos de Foco ficam "curto: tudo, longo: tudo"; Inspiração de Bardo e Fúria, "curto: 1, longo: tudo".
- **`amount` sempre presente e validado** como expressão, mesmo com outro modo, para que trocar o modo no formulário não apague nada (como nos efeitos, E1).
- **Validação do máximo**: o schema valida a expressão com o mesmo `parseExpression` dos efeitos e mensagem igual. Os ids dos trackers são únicos na fonte.
- **`used` acima do máximo** (o máximo caiu) é permitido no schema e mostrado como 0 de atual, como o dano acima do PV máximo.
- **Migração 4 → 5**: escreve literalmente `trackers: []` em toda fonte, nove `{ max: 0, used: 0 }` e `pactSlots: { level: 1, max: 0, used: 0 }`.

### R2. Regras puras em `src/engine/resources/`

- **`trackers.ts`**:
  - `resolveTrackers(document, variables)` devolve, para cada tracker de cada fonte, `{ sourceId, sourceName, tracker, max, current, error? }`, avaliando o máximo com `parseExpressionCached` e `evaluate`.
  - Máximo negativo vira 0. Erro de avaliação (divisão por zero) vira máximo 0 com `error`.
  - Os trackers aparecem para todas as fontes, ativas ou não: as cargas de uma varinha existem mesmo com ela guardada.
- **`spend` e `recover`**: funções para trackers e espaços, com os limites de 0 e do máximo. Recuperar a partir de `used` acima do máximo parte do máximo, como na cura (V3).
- **`rest.ts`**:
  - `rechargeUsed(used, max, regra, variáveis)`: `all` zera o usado; `amount` faz `max(0, min(usado, máximo) - quantidade)`; `none` não muda. Quantidade negativa ou com erro vale 0.
  - `shortRest(document, variables)`: aplica `shortRest` de cada tracker e zera `pactSlots.used`.
  - `longRest(document, variables)`: aplica `longRest` de cada tracker e zera os `spellSlots` e `pactSlots`. Também faz `hitPoints.damage = 0`, `temp = 0`, `hitDiceSpent = 0` e `deathSaves` zerados.
- **Alternativa**: guardar o valor atual e recalcular no descanso. Rejeitado: o atual ficaria "preso" quando o máximo muda e exigiria normalização a cada edição.

### R3. Cartão Recursos

```
 +---------------------------------------------------------------+
 | RECURSOS                    [Descanso curto] [Descanso longo]  |
 |  Inspiração (Inspiração de Bardo)   [-]  2 / 3  [+]   longo    |
 |  Pontos de Foco (Monge)             [-]  3 / 3  [+]   curto    |
 |  ESPAÇOS DE MAGIA  1º  [-] 3 / 4 [+]   2º  [-] 2 / 2 [+]       |
 |  PACTO (2º)        [-] 2 / 2 [+]                               |
 +---------------------------------------------------------------+
```

- **Posição**: `resources-card.tsx` é um `Card` entre `.sheet-top` e a grade de atributos, que é a ordem do DOM e a do celular. A partir de `lg`, uma grade de duas colunas põe os atributos à esquerda, em 2 colunas e 3 linhas, e o cartão Recursos à direita. Dentro do cartão, os trackers e os espaços passam a uma coluna nessa largura. *(Ajustado a pedido do usuário depois da primeira implementação; antes os atributos ficavam em 3 colunas e o cartão ocupava a largura toda.)*
- **Trackers e espaços**: cada linha tem os botões − e +, desativados nos limites, com `aria-label` com o nome.
- **Tracker com erro no máximo**: `Badge` de perigo com a mensagem.
- **Editar**: cada círculo, do 1º ao 9º, mostra um `NumberField` de máximo, e a Magia de Pacto mostra círculo e máximo.
- **Jogar**: aparecem só os círculos com máximo maior que 0, e o pacto só se tiver máximo.
- **Descansos**: cada botão troca a linha por uma confirmação embutida ("Confirmar descanso longo" / "Cancelar") com o resumo do que recupera. A confirmação aplica `update(shortRest)` ou `update(longRest)`, que passam pelo autosave como qualquer edição.

### R4. Editor de trackers

- **Seção "Trackers" no `SourceForm`**, acima dos efeitos: uma linha por tracker com:
  - nome;
  - máximo (campo de expressão com pré-visualização e erro, reaproveitando o `ExpressionField` dos efeitos, extraído para um componente comum);
  - recarga no descanso curto e no longo (`<select>` com "Não recupera", "Recupera tudo" e "Recupera quantidade", mais o campo de expressão da quantidade);
  - usado, que fica só no cartão Recursos;
  - remover.
- **"Adicionar tracker"**: cria `{ name: "Usos", max: "1", used: 0, curto: não recupera, longo: tudo }`, até 10.
- **No cartão da fonte**, etiquetas "Inspiração 2/3" ao lado dos efeitos.

### R5. Testes

- **Unitários**:
  - schema do formato 5 (máximo inválido, ids repetidos, 11 trackers, limites dos espaços) e migração 4 → 5;
  - `resolveTrackers`: Inspiração 3 com CAR 16, 1 com CAR 8, 3 de 4 ao subir o CAR, máximo negativo e divisão por zero;
  - `spend` e `recover` nos limites;
  - `shortRest`: Pontos de Foco recarregam, espaços normais não, pacto sim;
  - `longRest`: os números de Thorin (55/55, temporário 0, 5/5 dados, Fúria 3/3) e o tracker sem recarga mantido.
- **Integração**: salvar uma ficha com trackers e espaços; recusar tracker com máximo inválido.
- **Navegador**:
  - Ária com Inspiração;
  - Zane com espaços;
  - bruxo com pacto;
  - Kai e Thorin nos descansos, com confirmação e cancelamento;
  - em Jogar, sem edição do máximo dos espaços;
  - layout a 375 px.

## Risks / Trade-offs

- **[Descanso aplicado por engano]** → Há confirmação embutida, e o autosave guarda versões. Desfazer fica fora do escopo, mas o jogador pode reajustar à mão em Editar.
- **[Muitos trackers deixam o cartão Recursos grande no celular]** → Linhas compactas. Se incomodar, o cartão pode ganhar recolher e expandir depois.
- **[Regras de recarga mais ricas (ex.: "recupera 1d4")]** → Ficam fora: a quantidade é uma expressão sem dados. O jogador ajusta com + e −.

## Migration Plan

- Formato 4 → 5 ao abrir (R1), e o próximo salvamento grava no formato 5. Não há mudança no banco.
- **Rollback**: a versão anterior recusaria fichas do formato 5, como nas mudanças anteriores.
