# Design

## Context

- **Documento da ficha**: está no formato 2 (`src/engine/sheet/document.ts`), validado por um schema Zod estrito no cliente e no servidor, com limite de 256 KB. A migração entre formatos fica em `src/engine/sheet/migrate.ts`, e cada migração escreve os valores literalmente.
- **Ficha na tela** (`src/components/sheet/`):
  - `SheetEditor` guarda o modo (`SheetModeProvider`) e entrega a cada parte `{ document, stats, update }`. O `update` aceita um patch ou uma função do documento e passa tudo pelo autosave.
  - Campos numéricos usam `NumberField` com os parsers de `parse.ts`.
  - O layout tem a faixa de topo e a grade de atributos.
- **Componentes base** em `src/components/form.tsx` (`Card`, `Badge`, `Button`, `TextField`), com cores só por tokens.
- **Sem dependências** de UI ou de Markdown no projeto.

Decisões de produto: D4 (modelo de fonte) de `dnd-sheet-architecture`, mais as respostas do usuário registradas no proposal. Comportamento: `specs/sheet-sources` e a delta de `specs/sheet-core-stats`.

## Goals / Non-Goals

**Goals:**
- **Formato pronto para os efeitos**: um formato de fonte que a `sheet-effects` possa estender acrescentando `effects[]`, sem reorganizar o resto.
- **Regras de fonte puras e testadas**: item ativo, sintonizados, carga e ordenação de magias ficam fora dos componentes.
- **Edição consistente com o resto da ficha**: os campos gravam enquanto se digita (autosave), e só valores válidos chegam ao documento.

**Non-Goals:**
- Efeitos, trackers e espaços de magia.
- Busca, filtros e reordenação manual.
- Markdown além do subconjunto da spec (sem títulos, links, imagens, tabelas nem código).
- Mostrar no indicador de salvamento o motivo de um salvamento recusado. Ver Riscos.

## Decisions

### F1. Formato 3: `sources` como união discriminada

```ts
type SourceBase = {
  id: string;            // crypto.randomUUID(), 1..64 caracteres, único na ficha
  name: string;          // 1..100, sem espaços nas pontas
  description: string;   // 0..5000, Markdown básico (F4)
};

type Feat  = SourceBase & { kind: "feat";  category: "origin" | "general" | "fightingStyle" | "epicBoon" };
type Trait = SourceBase & { kind: "trait"; origin: "class" | "subclass" | "species" | "background" | "other";
                            from: string /* 0..100 */ };
type Item  = SourceBase & { kind: "item";
  category: "weapon" | "armor" | "shield" | "gear" | "consumable" | "other";
  quantity: number;      // inteiro 0..9999
  weight: number;        // kg por unidade, 0..9999, até 2 casas decimais
  price: string;         // 0..50
  equipped: boolean; requiresAttunement: boolean; attuned: boolean };
type Spell = SourceBase & { kind: "spell";
  level: number;         // 0 (truque) .. 9
  school: "abjuration" | "divination" | "conjuration" | "enchantment"
        | "evocation" | "illusion" | "necromancy" | "transmutation";
  spellClass: string; castingTime: string; range: string; duration: string; // 0..100
  verbal: boolean; somatic: boolean; material: boolean; materialText: string; // 0..100
  concentration: boolean; ritual: boolean; prepared: boolean };

sources: Source[]        // no máximo 300
```

- **Schema**: `z.discriminatedUnion("kind", [...])`, com cada variante estrita. Ele recusa três casos:
  - ids repetidos;
  - `attuned: true` sem `requiresAttunement`;
  - `prepared: true` com `level: 0`.

  Essas regras de coerência ficam no schema, como `superRefine` da lista e de cada variante. Assim, o servidor recusa documentos incoerentes.
- **Coerência na UI**: o formulário mantém os campos coerentes ao mudar outro campo. Desmarcar "requer sintonização" também desmarca "sintonizado", e mudar o círculo para truque desmarca "preparada".
- **Ids**: gerados no cliente com `crypto.randomUUID()`, disponível em contexto seguro (localhost em dev, HTTPS em produção). Eles dão `key` estável no React e um alvo estável para os efeitos da `sheet-effects`.
- **Chaves em inglês** e rótulos em português na UI, como nos formatos anteriores.
- **Alternativa**: listas separadas por tipo (`feats`, `items`, ...). Rejeitado: D4 trata tudo como "fonte", e a `sheet-effects` vai percorrer todas as fontes de uma vez.

### F2. Migração do formato 2 para o 3

- `migrateV2ToV3` acrescenta `sources: []` e não toca no resto.
- `SHEET_SCHEMA_VERSION` passa a 3, `createSheetDocument` cria a ficha com `sources: []` e o teste de cobertura das migrações passa a esperar 2.
- O teste da migração v1 → v2 continua comparando com o formato 2 escrito à mão, para não depender do formato atual.

### F3. Regras puras em `src/engine/sources/`

- **`kinds.ts`**: as listas fechadas (categorias, origens e escolas), usadas pelo schema e pela UI.
- **`rules.ts`**:
  - `isItemActive(item)`: `equipped && (!requiresAttunement || attuned)`;
  - `attunedCount(sources)`;
  - `totalWeight(sources)`: soma em centésimos de kg, com `Math.round(peso * 100) * quantidade`, para evitar erro de ponto flutuante ("7,5", não "7,499999");
  - `spellsByLevel(sources)`: grupos do truque ao 9º, só os não vazios, com as magias em ordem alfabética por `localeCompare("pt-BR")`;
  - `preparedCount(sources)`: magias de círculo 1 ou mais com `prepared`;
  - `createSource(kind, name, id)`: valores iniciais de cada tipo.
- **`ATTUNEMENT_LIMIT = 3`**.

### F4. Markdown básico com parser próprio

- **Parser** (`src/lib/markdown.ts`): `parseMarkdown(text): Block[]`, puro e testado.
  - Blocos separados por linha em branco.
  - Um bloco em que todas as linhas começam com `- ` vira lista não ordenada, e com `\d+\. `, lista ordenada.
  - Os demais blocos viram parágrafos, preservando as quebras de linha.
  - Inline: `**x**` vira forte e `*x*` vira ênfase, com ênfase dentro de forte. Marcadores sem par ficam como texto.
- **Componente** `Markdown` (`src/components/markdown.tsx`): transforma os blocos em `<p>`, `<br>`, `<ul>`/`<ol>`, `<strong>` e `<em>`. Todo texto entra como filho de texto do React, que o escapa, e não há `dangerouslySetInnerHTML`. Por isso `<script>` aparece literalmente (spec).
- **Alternativa**: `react-markdown`. Rejeitado: é uma dependência inteira (e o ecossistema `remark`) para o subconjunto que pedimos. Se o pedido crescer (links, títulos), vale reavaliar.

### F5. Abas e cartões de fonte

```
 +--------------------------------------------------------------------+
 | [Características (3)] [Inventário (3)] [Magias (0)]                 |
 +--------------------------------------------------------------------+
 | (Editar) [ nome da nova fonte ] [Talento|Traço] [Adicionar]        |
 |                                                                    |
 | > Fúria                     Traço . Classe . Bárbaro       [editar] |
 | v Sentinela                 Talento geral                  [editar] |
 |     descrição em Markdown...                                       |
 +--------------------------------------------------------------------+

 Inventário:  carga total 7,5 kg   sintonizados 1/3 (aviso se > 3)
 > Machado Grande   Arma . 3,5 kg   [Equipado v]  ATIVO
 > Azagaia          Arma . 1 kg     [-] 4 [+]
 > Anel de Proteção Outro           [Equipado v] [Sintonizado ]  (equipado, não ativo)

 Magias:  1 preparada
 TRUQUES     > Mãos Mágicas    Conjuração . 1 ação . 9 m
 1º CÍRCULO  > Enfeitiçar Pessoa  [ ] preparada
             > Sono               [x] preparada   C (concentração)
```

- **`SourcesPanel`** (`sources-panel.tsx`): um `Card` de largura total abaixo da grade de atributos. As abas são um `role="tablist"` com setas de teclado, e a aba aberta é estado local, não gravado.
- **`SourceCard`**: o cabeçalho é um botão que expande e mostra o nome, um resumo do tipo e, à direita, as ações de mesa (F6). Expandido, mostra os detalhes do tipo e a descrição em Markdown.
- **Edição (só em Editar)**: o botão "Editar" do cartão troca o corpo por `SourceForm`, com os campos do tipo:
  - textos em `TextField`, com rascunho e validação pelo schema;
  - números em `NumberField`;
  - enums em `<select>` e marcações em checkbox;
  - descrição em `<textarea>`.

  Cada alteração válida grava na hora, como o resto da ficha. "Concluir" fecha o formulário.
- **Criar**: um formulário curto no topo da aba (nome, e talento ou traço em Características) cria a fonte com os valores iniciais de `createSource` e já a abre em edição. Assim, nunca existe fonte sem nome.
- **Excluir**: "Excluir" troca os botões por "Confirmar exclusão" e "Cancelar", na própria ficha, sem `window.confirm`.
- **Alternativa**: um modal de edição. Rejeitado: no celular, um painel embutido no cartão é mais simples e segue o padrão do painel de override.

### F6. Ações de mesa nos dois modos

- **Itens**:
  - "Equipado" é um botão alternável (`aria-pressed`). "Sintonizado" é outro botão, que só aparece se o item requer sintonização.
  - A quantidade tem os botões − e +, com limites de 0 e 9.999.
  - Um `Badge` "Ativo" aparece quando `isItemActive`.
- **Magias**: um checkbox "preparada", que não existe para truques.
- **Nos dois modos**: as ações funcionam em Jogar e em Editar. Em Editar, os mesmos campos aparecem também no formulário.
- **Resto do documento**: todas as alterações passam pelo `update` do `SheetEditor`, que já normaliza os testes contra a morte. As fontes não afetam o PV agora, mas o caminho único evita exceções.

### F7. Testes

- **Unitários**:
  - schema do formato 3: limites de cada campo, tipo desconhecido, ids repetidos, sintonizado sem requisito, truque preparado, 301 fontes;
  - migração v2 → v3;
  - `rules.ts`, com os cenários da spec: carga de 7,5 kg, quantidade 0, anel equipado e não sintonizado, 4 sintonizados, agrupamento e ordem das magias, contagem de preparadas;
  - `parseMarkdown`: parágrafos, quebras, listas, negrito, itálico, marcador sem par, HTML literal.
- **Integração**: salvar uma ficha com uma fonte de cada tipo; recusar `attuned` sem `requiresAttunement`.
- **Navegador**: os cenários de criar, editar, excluir, ações de mesa em Jogar, ausência de edição em Jogar, Markdown e layout a 375 e 1280 px nos dois temas.

## Risks / Trade-offs

- **[Muitas fontes com descrições longas passam de 256 KB]** → 300 fontes × 5.000 caracteres passariam de 1 MB, mas o uso real (dezenas de fontes, descrições de alguns parágrafos) fica bem abaixo. Se acontecer, o autosave mostra "Não salvo: dados inválidos" e para de tentar, sem perder o que está na tela. Melhorar a mensagem, ou subir o limite junto com `serverActions.bodySizeLimit`, fica para quando aparecer.
- **[Uma edição em uma fonte regrava o documento todo]** → Já é o modelo de D2. O documento fica em dezenas de KB e o autosave agrupa as edições.
- **[`crypto.randomUUID` indisponível fora de contexto seguro]** → Em produção há HTTPS (change `deployment`) e em dev é localhost. Fica registrado para não servir a app por HTTP puro num IP.
- **[O parser próprio de Markdown diverge do Markdown "de verdade"]** → O subconjunto é pequeno e está descrito na spec. A ajuda do campo de descrição mostra os quatro formatos aceitos.
- **[O layout cresce para baixo com as abas]** → Fica aceito. A coluna lateral de atributos é uma evolução futura, citada como fora do escopo.

## Migration Plan

- Formato 2 → 3 ao abrir (F2), e o próximo salvamento grava no formato 3. Não há mudança no banco.
- **Rollback**: a versão anterior recusaria fichas do formato 3 ("formato mais novo que o suportado"), como na mudança anterior de formato.
