# Design

## Context

- **Cálculo** (`src/engine/stats/derive.ts`): `deriveStats(document)` calcula numa ordem fixa (modificadores, PB, salvaguardas, perícias, iniciativa, passiva, PV máximo e dados de vida). Cada nó passa por `resolve(chave, calculado)`, que aplica o override e devolve `{ value, calculated, overridden }`. A change `sheet-core-stats` previu que os efeitos entrariam antes do override e que a sequência fixa poderia virar um grafo.
- **Formato 3** (`src/engine/sheet/document.ts` + `src/engine/sources/schema.ts`): as fontes têm id estável e item ativo (`isItemActive`). A CA aparece como "—" (`top-band.tsx`), e o deslocamento é um campo simples.
- **Override na tela** (`derived-value.tsx`): só existe em Editar. Em Jogar, o valor é texto.
- **`DERIVED_KEYS`** (`src/engine/stats/keys.ts`) define as chaves aceitas em `overrides`. O schema de overrides é gerado dessa lista.

Decisões de produto: D4 e D5 de `dnd-sheet-architecture`, mais as respostas do usuário registradas no proposal. Comportamento: `specs/sheet-effects` e as deltas de `sheet-core-stats` e `sheet-sources`.

## Goals / Non-Goals

**Goals:**
- **Efeitos que reproduzem os casos de referência**: Defesa sem Armadura (Bárbaro e Monge), Armadura Arcana, Anel de Proteção, Alerta, Robusto, Manoplas de Força do Ogro, Pau para Toda Obra e as armaduras leve, média e pesada.
- **Motor puro, testável com personagens reais**, que nunca trava. Expressões inválidas e ciclos viram problemas sinalizados.
- **Cada número explicável**, com a lista de contribuições.

**Non-Goals:**
- Grafo genérico de dependências entre todos os valores. Ciclos só são possíveis entre atributos (E3).
- Expressões com dados, condicionais ou referências a valores além de atributos, modificadores, nível e PB.
- Condições além de "sem armadura" e "sem escudo".

## Decisions

### E1. Formato 4

```ts
type Effect = {
  id: string;                 // crypto.randomUUID(), único na fonte
  target: EffectTarget;       // E2
  op: "add" | "altBase" | "set" | "proficiency";
  expression: string;         // 0..100; usado por add/altBase/set
  proficiency: "half" | "proficient" | "expertise"; // usado por proficiency
  noArmor: boolean;
  noShield: boolean;
};

// em toda fonte:
effects: Effect[]             // até 20

// item, além do formato 3:
armorType: "light" | "medium" | "heavy";  // usado se category = "armor"
armorBase: number;                        // inteiro 0..30, inicial 10
shieldBonus: number;                      // inteiro 0..10, inicial 2; usado se category = "shield"

// magia, além do formato 3:
active: boolean;                          // "em efeito"
```

- **Efeito com forma única**: todos os campos estão sempre presentes, em vez de uma união por operação. Trocar a operação no formulário não apaga nada, e o schema continua estrito. O campo que não se aplica à operação é ignorado no cálculo.
- **Mesma ideia nos itens**: os campos de armadura e escudo ficam em todo item, para que mudar a categoria não exija migrar dados.
- **Validação no schema** (`superRefine`), que vale no cliente e no servidor:
  - a operação é compatível com o alvo (E2);
  - a expressão é válida (E4) nas operações que a usam;
  - os ids dos efeitos são únicos na fonte.
- **Migração 3 → 4**: escreve literalmente `effects: []` em toda fonte, `armorType: "light"`, `armorBase: 10` e `shieldBonus: 2` nos itens, e `active: false` nas magias.

### E2. Alvos e operações

`src/engine/effects/targets.ts` tem a lista fechada:

```
ability.str .. ability.cha      (valor do atributo)   add, set
save.str .. save.cha, save.all                        add, proficiency
skill.<18 perícias>, skill.all                        add, proficiency
armorClass                                            add, altBase
speed                                                 add, set
initiative, hitPointsMax, passivePerception           add
```

- `OPERATIONS_BY_TARGET` alimenta o schema e o formulário. Assim, a UI só oferece as combinações válidas (spec "Operação incompatível").
- **Novas chaves de override**: `DERIVED_KEYS` ganha `armorClass` e `speed`. O schema de overrides é gerado dela, então as fichas antigas continuam válidas, e a migração não precisa mexer em `overrides`.

### E3. Ordem de cálculo

`deriveStats` continua com ordem fixa, agora com os efeitos:

```
 fontes ativas + condições (armadura/escudo ativos)  -->  efeitos que valem
 nível --> PB (override)
 atributos: base --> definir (maior) --> somar   [ordem topológica, ciclos fora]
 modificadores (override)
 salvaguardas / perícias: mod + piso(mult x PB) + somar (alvo e "todas")  (override)
 iniciativa: mod.des + somar (override)   passiva: 10 + Percepção + somar (override)
 deslocamento: base --> definir --> somar (override)
 PV máximo: fórmula + somar (override)      dados de vida (override)
 CA: max(bases válidas) + escudo + somar (override)
```

- **Variáveis das expressões**: `nivel`, `pb` e os atributos e modificadores *finais*, já com efeitos e overrides. Como só os efeitos de atributo leem atributos que outros efeitos alteram, um ciclo só pode existir entre atributos.
- **Atributos em ordem topológica**:
  - Cada efeito num atributo X que lê `Y` ou `Y.mod` gera a aresta Y → X.
  - Os componentes fortemente conexos com mais de um nó, ou com laço próprio, são ciclos. Os efeitos que formam o ciclo são ignorados e registrados como problema `cycle`.
  - Os atributos são resolvidos em ordem topológica do grafo que sobra.
- **Multiplicador de proficiência**: o maior entre o marcado na ficha e os dos efeitos ativos (alvo ou "todas"). Metade vale `piso(0,5 × PB)`.
- **Erros na avaliação** (divisão por zero): o efeito é ignorado e registrado como problema `error`. O cálculo segue.
- **Override por último**: continua substituindo o resultado final (spec modificada "Override manual").

### E4. Expressões: parser e avaliador próprios

`src/engine/effects/expression.ts`:

```
expr    = term (("+" | "-") term)*
term    = unary (("*" | "/") unary)*
unary   = "-" unary | primary
primary = inteiro | variável | ("min" | "max") "(" expr ("," expr)* ")" | "(" expr ")"
variável = ("for"|"des"|"con"|"int"|"sab"|"car") [".mod"] | "nivel" | "nível" | "pb"
```

- **`parseExpression(text)`**: devolve `{ ok: true, ast }` ou `{ ok: false, error }`, com mensagens em português ("Expressão incompleta", "Variável desconhecida: força", "Símbolo inesperado: #", "Falta fechar parênteses").
- **`evaluate(ast, vars)`**: avalia a árvore. `/` é divisão inteira para baixo (`Math.floor`), e dividir por zero lança um erro, tratado em E3.
- **`referencedAbilities(ast)`**: devolve os atributos lidos, para o grafo de E3.
- **Cache**: o resultado do parse fica num `Map` por texto, porque `deriveStats` roda a cada edição.
- **Alternativa**: uma biblioteca de expressões (`expr-eval`, `mathjs`). Rejeitado: seria uma dependência para uma gramática de dez linhas, e as mensagens de erro em português e a lista fechada de variáveis ficam mais simples num parser próprio.

### E5. Contribuições e problemas

`DerivedValue` ganha `parts: Contribution[]`:

```ts
type Contribution = {
  label: string;                         // "Modificador de DES", "Anel de Proteção", "Escudo"
  amount: number;
  kind: "base" | "add" | "set" | "proficiency" | "unused";
};
```

- **`DerivedStats` também ganha**:
  - `abilityScores`: valor final, base e contribuições de cada atributo, porque o atributo não é um valor derivado com override;
  - `issues: { sourceId, effectId, reason: "cycle" | "error", message }[]`.
- **Bases e definições não usadas** entram com `kind: "unused"`, para o painel mostrar por que não valeram (spec "Origem dos valores").
- **Rótulo de cada contribuição**: o nome da fonte. As partes fixas têm rótulos próprios ("10 + DES", "Armadura: Cota de Malha", "Proficiência ×1").

### E6. Painel de origem em Jogar e Editar

- **Editar**: o `OverridePanel` acrescenta a lista de contribuições acima do campo de valor manual.
- **Jogar**: os valores calculados viram botões que abrem um painel só de leitura (`OriginPanel`), com o total e as contribuições, sem o campo de valor manual. Isso respeita o requisito de modos, que proíbe o painel de *valor manual* em Jogar, e ajuda a conferir números na mesa.
- **CA e deslocamento**: passam a ser `DerivedValue`.
- **Bloco de atributo**: mostra o valor final. Em Editar, o campo continua editando a base, e um "efetivo 19" aparece quando efeitos mudam o valor.

### E7. Editor de efeitos

- **Seção "Efeitos" no `SourceForm`**: uma linha por efeito, com:
  - **Alvo**: `<select>` com `optgroup` (Atributos, Salvaguardas, Perícias, Combate);
  - **Operação**: filtrada por `OPERATIONS_BY_TARGET`;
  - **Valor**: campo de expressão com a pré-visualização "= 15" (avaliada com as variáveis atuais da ficha), ou um `<select>` de proficiência;
  - **Condições**: checkboxes "sem armadura" e "sem escudo";
  - **Remover**.
- **"Adicionar efeito"**: começa com `add` na CA e expressão `1`, e fica desativado em 20 efeitos.
- **Resumo no cartão**: `describeEffect` gera uma etiqueta por efeito ("+1 CA", "CA base 10 + des.mod + con.mod", "FOR = 19", "Expertise em Furtividade"). Um efeito com problema ganha `Badge` de perigo com a mensagem.
- **Itens**: com categoria Armadura, o formulário mostra o tipo e a CA base; com Escudo, o bônus. O resumo mostra "Armadura pesada · CA 16" ou "Escudo +2".
- **Magias**: ganham a ação de mesa "Em efeito" (botão alternável, como "Equipado"), disponível nos dois modos.

### E8. Testes

- **Unitários**:
  - expressões: precedência, unário, `min` e `max`, divisão para baixo, divisão por zero, variáveis com e sem acento, e cada mensagem de erro;
  - schema do formato 4 e a migração 3 → 4;
  - `deriveStats`, com todos os cenários numéricos da spec: CA 12/15/17/16/14/16, Monge 15/15, Armadura Arcana 13 → 16, Alerta +5, Robusto 65, Anel nas salvaguardas, deslocamento 12, Manoplas 19 e 20, Pau para Toda Obra, expertise +7, ciclo FOR/DES, autorreferência e o override sobre efeitos;
  - as contribuições da CA 18.
- **Integração**: salvar uma ficha com efeitos; recusar efeito com operação incompatível ou expressão inválida.
- **Navegador**: montar o Bárbaro e o Monge com os efeitos, equipar e desequipar, a pré-visualização da expressão, a expressão inválida recusada, o painel de origem em Jogar e em Editar, e o layout a 375 px.

## Risks / Trade-offs

- **[`deriveStats` mais pesado roda a cada tecla]** → Há poucas fontes e efeitos, e o parse fica em cache. Se pesar, usar `useMemo` por `sources` e `abilities` separadamente.
- **[Jogador cria um efeito que não faz o que espera]** → A pré-visualização, as contribuições e as etiquetas de resumo mostram o resultado. O override continua sendo a válvula de escape.
- **[Ordem fixa fica curta para valores futuros]** → Se um dia expressões puderem ler CA, perícias e outros valores, `deriveStats` precisa do grafo completo. Hoje a gramática restringe as variáveis justamente para evitar isso.
- **[Nome de variável em português sem acento (`nivel`)]** → `nível` também é aceito, e a ajuda do campo lista as variáveis.
- **[Armadura pesada sem FOR suficiente e a desvantagem em Furtividade não são aplicadas]** → Ficam fora do escopo. O jogador anota na descrição.

## Migration Plan

- Formato 3 → 4 ao abrir (E1), e o próximo salvamento grava no formato 4. Não há mudança no banco.
- **Rollback**: a versão anterior recusaria fichas do formato 4, como nas mudanças anteriores de formato.
