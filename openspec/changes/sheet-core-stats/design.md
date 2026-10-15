# Design

## Context

Estado atual, deixado pela change `character-sheets`, já arquivada:

- **Formato do documento**: definido em `src/engine/sheet/document.ts` como um schema Zod 4 estrito, no formato 1, que só tem `identity`. O mesmo schema valida os campos no formulário e o documento no servidor (`saveSheet`).
- **Migração**: `src/engine/sheet/migrate.ts` converte documentos antigos ao carregar. A lista `SHEET_MIGRATIONS` ainda está vazia, e um teste exige que ela tenha `SHEET_SCHEMA_VERSION - 1` itens.
- **Cálculo**: `src/engine/abilities.ts` já tem `abilityModifier`. O ESLint impede que `src/engine/` importe React, Next, APIs do Node ou outras camadas.
- **Editor**: `src/components/sheet/sheet-editor.tsx` é um formulário com os 5 campos do cabeçalho. Cada campo guarda o texto digitado e valida com o schema; só um valor válido chega ao documento (`edit(...)` de `useSheetAutosave`). O editor remonta quando a versão muda, depois de um "Recarregar".
- **Largura**: o layout `(app)` limita o conteúdo a `max-w-4xl` (896 px).

Decisões de produto já tomadas: D3 (motor puro, executado no cliente) e D6 (override manual) de `dnd-sheet-architecture`. As respostas do usuário nesta change estão no proposal, e o comportamento esperado está em `specs/sheet-core-stats`.

## Goals / Non-Goals

**Goals:**
- Um módulo de cálculo puro, testável com os personagens dos cenários, que `sheet-effects` possa estender sem reescrever: novos alvos e a ordenação por dependências.
- Um único lugar com a lista de valores derivados. Dele saem o schema dos overrides, o cálculo e a UI.
- Campos numéricos reutilizáveis, que repetem para todos os campos novos o comportamento do cabeçalho: o texto inválido fica na tela e nunca chega ao documento.

**Non-Goals:**
- **Grafo genérico de dependências e detecção de ciclos**: aqui a ordem é fixa e não admite ciclos. O grafo chega com os efeitos, em `sheet-effects` (D5).
- **Cálculo no servidor**: o servidor continua validando apenas o formato (D3).
- **Indicador de salvamento com campo inválido**: o indicador continua dizendo "Salvo" mesmo com um campo inválido na tela, como já acontece hoje. É um ponto em aberto da change anterior e continua fora do escopo.

## Decisions

### S1. Formato 2 do documento

```ts
{
  schemaVersion: 2,
  identity: { ... },                       // inalterado
  abilities:    { str, dex, con, int, wis, cha },  // inteiro 1..30
  savingThrows: { str, dex, con, int, wis, cha },  // boolean
  skills: {                                // "none" | "proficient" | "expertise"
    acrobatics, animalHandling, arcana, athletics, performance, deception,
    stealth, history, intimidation, insight, investigation, medicine,
    nature, perception, persuasion, sleightOfHand, religion, survival
  },
  hitPoints: {
    hitDie: 6 | 8 | 10 | 12,
    damage: number,         // inteiro 0..999, dano sofrido (S3)
    temp: number,           // inteiro 0..999
    hitDiceSpent: number    // inteiro 0..999
  },
  deathSaves: { successes: 0..3, failures: 0..3 },
  speed: number,            // metros, 0..999, no máximo 1 casa decimal
  overrides: { [chave de valor derivado]?: number }  // inteiro -999..999
}
```

- **Todas as chaves obrigatórias**: as 6 de atributos, as 18 de perícias e as demais. O schema segue estrito, como no formato 1. Um documento com uma perícia faltando ou sobrando é recusado no servidor.
- **Chaves em inglês e sem acento**, como `class` no formato 1. Os rótulos em português ficam na UI.
- **Deslocamento com uma casa decimal**: a checagem é `Math.round(v * 10) === v * 10`, com tolerância para ponto flutuante. Metros em múltiplos de 1,5 não são exigidos, para não barrar regras da casa.
- **Gastos sem limite pelo nível**: `hitDiceSpent` não é limitado ao nível no schema, para que baixar o nível nunca invalide o documento. Os disponíveis são calculados como `max(0, total - gastos)`.

### S2. Lista única de valores derivados

Em `src/engine/stats/keys.ts` fica a lista fechada de chaves:

```
mod.str .. mod.cha          (6)   modificadores
proficiencyBonus            (1)
save.str .. save.cha        (6)   salvaguardas
skill.acrobatics ..         (18)  perícias
initiative, passivePerception
hitPointsMax, hitDiceMax
```

- O schema dos overrides é gerado dessa lista com `z.partialRecord(z.enum(DERIVED_KEYS), inteiro)`, então uma chave desconhecida é recusada. O cálculo e a UI usam as mesmas constantes.
- Ainda no `engine` ficam as regras do 5.5e em forma de dados: a perícia ligada a cada atributo, a tabela do bônus de proficiência e os dados de vida válidos. Os rótulos em português ficam em `src/components/sheet/labels.ts`.
- **Alternativa**: override em cada campo do documento, por exemplo `skills.stealth = { level, override }`. Rejeitado: espalha o mesmo conceito por formatos diferentes e complica a remoção. Além disso, `sheet-effects` vai precisar de um nome estável para cada alvo, e essas chaves servem para isso.

### S3. PV guardado como dano sofrido

O documento guarda `damage`, e não o PV atual. O PV atual é calculado como `max(0, pvMáximo - damage)`, e editar o PV atual grava `damage = pvMáximo - valor`.

- **Por quê**: o PV atual acompanha o máximo sozinho, que é o comportamento pedido na spec. Isso vale para subir de nível, mudar a CON e aplicar um override no PV máximo. Ficha nova e ficha migrada ficam simplesmente com `damage: 0`, sem precisar calcular o máximo na migração.
- **Alternativa**: guardar o PV atual. Rejeitado por três motivos:
  - o valor guardado pode passar do máximo e exigiria ajuste a cada mudança no máximo;
  - subir de nível não aumentaria o PV atual;
  - a migração precisaria rodar o motor de cálculo.
- **Limite do campo**: o PV atual vai de 0 ao PV máximo efetivo, já com override. Essa checagem é feita no campo, porque o schema não conhece valores derivados. Pelo schema, `damage` vai de 0 a 999.

### S4. Motor de cálculo em ordem fixa

`deriveStats(document): DerivedStats`, em `src/engine/stats/derive.ts`, é uma função pura que calcula os valores nesta ordem:

```
  atributos --> mod.X --> proficiencyBonus (do nível)
                  |              |
                  v              v
               save.X, skill.Y (mod + PB x 0/1/2)
                  |
                  v
          initiative (mod.dex)   passivePerception (10 + skill.perception)
          hitPointsMax (hitDie, nível, mod.con)  -->  PV atual (máx. - dano)
          hitDiceMax (nível)                     -->  dados disponíveis
```

- **Override por nó**: cada nó passa por `resolve(chave, calculado)`, que devolve `{ value, calculated, overridden }`. Os nós seguintes leem `value`, então já recebem o override (spec "Valores dependentes usam o valor manual").
- **PV máximo**: `dado + modCON` no nível 1, mais `(nível - 1) × (dado / 2 + 1 + modCON)`. Cada parcela tem mínimo 1 por nível.
- **Onde roda**: no cliente, com `useMemo` sobre o documento. O servidor não chama o motor.
- **Alternativa**: já montar o grafo genérico de dependências. Rejeitado por ora: não há ciclos possíveis sem efeitos. A troca é local, porque `sheet-effects` substitui a sequência fixa pelo grafo mantendo `resolve` e as chaves de S2.

### S5. Migração do formato 1 para o 2

- `SHEET_SCHEMA_VERSION` passa a 2 e `SHEET_MIGRATIONS` ganha `v1ToV2`, que mantém `identity` e acrescenta os valores iniciais da spec: atributos 10, sem proficiências, d8, sem dano, deslocamento 9 e `overrides: {}`.
- **A migração escreve esses valores literalmente**, sem chamar `createSheetDocument`. Uma migração precisa continuar produzindo o formato 2 mesmo depois que o formato 3 mudar os valores iniciais da ficha nova.
- `createSheetDocument` passa a montar o formato 2 completo, com os mesmos valores.
- **Testes**: os da migração sintética continuam valendo. Entra um teste da migração real, e o teste "cobrem todas as versões" passa a esperar 1 item.

### S6. Campos numéricos com rascunho

Um componente `NumberField` generaliza o `parseField` do cabeçalho:

- Enquanto o campo está em foco, ele guarda o texto digitado (o rascunho). A cada alteração, valida com um parser e só chama `onCommit(valor)` quando o valor é válido. O erro aparece no próprio campo.
- Ao perder o foco, o rascunho é descartado e o campo volta a mostrar o valor do documento. Fora do foco, ele segue o documento, por exemplo quando o PV atual muda por causa do nível.
- **Parsers pequenos e puros**, testados:
  - inteiro num intervalo;
  - decimal com uma casa, aceitando vírgula ou ponto;
  - inteiro com sinal, para os overrides.
- **Intervalos dos parsers**: vêm do schema do documento (`.shape`) sempre que possível, para não duplicar limites. O PV atual é a exceção, porque depende do máximo (S3).
- **Tipo e teclado**: os campos usam `type="text"`.
  - Os campos sem sinal usam `inputMode="numeric"` ou `"decimal"`.
  - O valor manual (override) não usa `inputMode` numérico, porque o teclado numérico do iOS não tem o sinal de menos.
  - **Alternativa**: `type="number"`. Rejeitado: aceita "e" e faz a vírgula se comportar de forma diferente em cada navegador.
- **Controles que não são texto**: proficiência em salvaguarda é um checkbox; nível de perícia é um botão que alterna nenhuma, proficiente e expertise, com o estado em `aria-label`; dado de vida é um `<select>`; testes contra a morte são 3 + 3 checkboxes, com o botão "Limpar"; dados de vida têm os botões "Gastar" e "Recuperar", desabilitados nos limites.
- **O cabeçalho**: passa a usar o mesmo mecanismo. O nível vira um `NumberField`, e os campos de texto mantêm a validação atual.

### S7. Controle de override

Cada valor derivado é mostrado por um componente `DerivedValue`:

- **Aparência**: é um botão com o valor formatado (ex.: "+6" ou "55"). Quando há override, ele ganha destaque visual e o texto "manual", e o `aria-label` informa "valor manual; calculado +4".
- **Painel**: o toque abre um painel embutido logo abaixo, sem modal nem `window.prompt`. O painel tem o valor calculado, o campo "Valor manual" (um `NumberField` com sinal), "Aplicar", e "Usar calculado" quando já houver override.
- **Um painel por vez**: o estado de qual painel está aberto fica no editor.
- **Edição**: aplicar grava `overrides[chave]`; usar o calculado remove a chave. Os dois passam pelo `edit` do autosave, como qualquer outra edição.

### S8. Layout

```
  celular (< 1024 px), uma coluna, na ordem do DOM:
    cabeçalho (identificação + indicador de salvamento)
    combate:   PV atual/máx/temp, dados de vida, testes contra a morte,
               PB, iniciativa, deslocamento, percepção passiva
    atributos: 6 blocos (2 ou 3 por linha) + salvaguardas
    perícias:  lista de 18
    excluir ficha

  desktop (>= 1024 px, lg):
    +------------------------------------------------------+
    | cabeçalho                                            |
    +----------------+------------------+------------------+
    | atributos      | perícias         | combate          |
    | salvaguardas   |                  | (CA no futuro)   |
    +----------------+------------------+------------------+
```

- **Combate primeiro no DOM**: é o que mais se consulta na mesa pelo celular. No desktop, `grid-template-areas` põe cada seção na sua coluna sem mudar a ordem do DOM, que é a ordem lida pelo teclado e pelos leitores de tela.
- **Largura**: o layout `(app)` passa de `max-w-4xl` para `max-w-6xl`, porque 896 px não comportam três colunas confortáveis. As outras páginas (lista, conta e admin) envolvem o conteúdo em `max-w-4xl` para manter a aparência atual.
- **Em telas menores que 1024 px**, a grade dos atributos usa 2 colunas abaixo de `sm` e 3 a partir dele. Nada tem largura fixa maior que 320 px, então não aparece rolagem horizontal a 360 px.
- **Componentes**: as seções viram arquivos separados em `src/components/sheet/` (`identity-section`, `combat-section`, `abilities-section`, `skills-section`). `SheetEditor` guarda o autosave, calcula `deriveStats` e entrega a cada seção o documento, os valores derivados e uma função de edição.

### S9. Testes

- **Unitários (engine)**:
  - `deriveStats` com Thorin, Elara, a ficha nova e cada cenário numérico da spec: PB por nível, extremos de modificador, PV mínimo por nível, subir de nível ferido e máximo abaixo do dano;
  - overrides e a propagação deles;
  - o schema do formato 2 (limites, chaves faltando ou sobrando, deslocamento decimal);
  - a migração v1 -> v2 e os parsers de S6.
- **Integração**: os testes de `service.int.test.ts` continuam passando com o formato 2, mais um caso que salva um documento do formato 2 com overrides e outro que recusa um override com chave desconhecida.
- **Navegador**:
  - montar Thorin e conferir os números da spec;
  - aplicar e remover um override;
  - ver o autosave salvar;
  - abrir uma ficha antiga (Grog e Elara, gravadas no formato 1);
  - conferir o layout a 375 px e a 1280 px.

## Risks / Trade-offs

- **[`sheet-effects` muda o cálculo de valores com override]** → A regra fica fixada aqui: o override substitui o resultado final do nó e os dependentes leem esse resultado. Os efeitos entram antes do override.
- **[Override de modificador surpreende quem esperava mudar só um valor]** → É o que a spec pede. O valor calculado fica visível no painel e o destaque mostra o que está manual.
- **[Ficha migrada com d8 e atributos 10 parece "errada"]** → É o valor inicial definido na spec. Não há como deduzir os números de uma ficha que nunca os teve.
- **[O dano guardado deixa de bater quando o PV máximo cai abaixo dele]** → O PV atual mostra 0 (spec). A próxima edição do PV atual regrava o dano a partir do máximo vigente.
- **[Muitos campos aumentam o número de salvamentos]** → O autosave já agrupa as edições (debounce de 1,5 s, teto de 5 s), e o documento continua pequeno, com alguns KB e longe dos 256 KB.
- **[Alargar o layout muda as outras páginas]** → Cada uma recebe um envoltório `max-w-4xl`, e a conferência no navegador inclui a lista e a página de conta.

## Migration Plan

- Não há migração de banco: a tabela `sheet` não muda. As fichas do formato 1 são convertidas ao abrir (S5) e regravadas no formato 2 no próximo salvamento.
- **Rollback**: voltar o código para a versão anterior faz as fichas já gravadas no formato 2 darem erro de "formato mais novo que o suportado". Isso é aceitável num app interno, e a migração não perde dados. Se for preciso voltar de verdade, a saída é uma migração inversa manual no banco.
