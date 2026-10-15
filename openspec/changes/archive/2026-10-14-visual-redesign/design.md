# Design

## Context

O estado atual relevante:

- **Cores**: espalhadas como pares de classes Tailwind (`border-zinc-200 dark:border-zinc-800`), com cerca de 35 `dark:` em 15 arquivos. O tema escuro segue `prefers-color-scheme` por um `@media` em `src/app/globals.css`. Não há cor de destaque.
- **Fonte**: `globals.css` define `body { font-family: Arial }`, que sobrescreve a Geist carregada em `src/app/layout.tsx`.
- **Ficha** (`src/components/sheet/`): o `SheetEditor` monta quatro seções (`identity`, `combat`, `abilities`, `skills`) numa grade CSS (`.sheet-grid`).
  - Todos os valores são campos (`NumberField`) ou botões de override (`DerivedValue`, com `OverrideProvider`).
  - O PV é guardado como dano (`hitPoints.damage`), e o PV atual é calculado em `deriveStats`.
- **Componentes base**: `src/components/form.tsx` tem `AuthCard`, `TextField`, `Button` e `FormMessage`. Login, troca de senha, lista, conta e admin usam esses componentes com layouts simples.
- **Next 16 com `cacheComponents`**: ler cookies no layout raiz tornaria todas as páginas dinâmicas.

Referência visual: `ref/hero-dairy.png`. As decisões de produto foram tomadas na exploração e estão no proposal. O comportamento está em `specs/sheet-core-stats` e `specs/appearance`.

## Goals / Non-Goals

**Goals:**
- **Cores num lugar só**: um único conjunto de variáveis de cor, que todas as telas usam, para que trocar de tema (ou ajustar a paleta) seja mexer num arquivo.
- **Ficha legível na mesa** (modo Jogar), sem perder a edição completa que já existe (modo Editar).
- **Regras de PV puras e testadas**: dano, cura e zerar os testes contra a morte ficam fora dos componentes.
- **Um layout que receba as abas** de `sheet-sources` e `sheet-resources` sem ser refeito de novo.

**Non-Goals:**
- Biblioteca de componentes ou de ícones.
- Animações elaboradas.
- Mais de dois temas.
- Testes visuais automatizados (screenshot diff). A conferência visual é feita no navegador.
- Mudar o formato do documento ou o servidor.

## Decisions

### V1. Variáveis de cor e tema por atributo `data-theme`

`globals.css` passa a ter os tokens. O escuro é o padrão em `:root`, e o claro sobrescreve os mesmos tokens:

```css
:root {                         /* escuro (padrão) */
  color-scheme: dark;
  --bg: ...; --surface: ...; --surface-2: ...; --line: ...;
  --text: ...; --muted: ...;
  --accent: ...; --accent-text: ...;   /* roxo */
  --danger: ...; --success: ...;
}
:root[data-theme="light"] { color-scheme: light; --bg: ...; ... }

@theme inline {
  --color-bg: var(--bg); --color-surface: var(--surface); ...
}
```

- **Utilitários**: o Tailwind gera `bg-surface`, `border-line`, `text-muted`, `bg-accent` e afins. Os componentes usam só esses utilitários, e o `@media (prefers-color-scheme)` e todos os `dark:` são removidos.
- **Controles nativos**: o `color-scheme` faz `select`, checkbox e barra de rolagem seguirem o tema.
- **Fonte**: o `body` passa a usar `var(--font-geist-sans)`, e o `Arial` sai.
- **Alternativa**: `dark:` com `@custom-variant dark` apontando para `[data-theme=dark]`. Rejeitado: mantém dois valores de cor por classe em todos os componentes, que é justamente o que dificulta a manutenção hoje.

### V2. Preferência no `localStorage`, aplicada por script no `<head>`

- **Script**: `src/app/layout.tsx` ganha um `<script>` inline (`dangerouslySetInnerHTML`) no `<head>`. Ele lê `localStorage["dnd-sheet:theme"]` e, se for `"light"`, aplica `data-theme="light"` no `<html>`. Roda antes da primeira pintura, então a página não pisca. Fica dentro de `try/catch`, porque o `localStorage` pode não estar disponível.
- **Hidratação**: o `<html>` recebe `suppressHydrationWarning`, porque o atributo é alterado antes de o React hidratar.
- **`ThemeToggle`**: componente cliente que alterna o atributo e grava a escolha. Ele renderiza os dois ícones (sol e lua), e o CSS mostra o certo conforme `data-theme`. O HTML do servidor é igual nos dois temas, então não há divergência na hidratação.
- **Onde aparece**: no cabeçalho de `(app)` e no `AuthCard` (login e troca de senha).
- **Alternativa**: cookie lido no servidor. Rejeitado: `cookies()` no layout raiz desliga o prerender de todas as rotas.

### V3. Regras de PV puras em `src/engine/stats/hit-points.ts`

```ts
applyDamage(document, amount): SheetDocument
applyHealing(document, amount): SheetDocument
normalizeDeathSaves(document): SheetDocument
```

- **Dano**: `absorbed = min(temp, amount)`. O restante vai para `damage = min(hpMax, damage + resto)`. O limite em `hpMax` impede que o PV atual "fique devendo" abaixo de 0.
- **Cura**: `damage = max(0, min(damage, hpMax) - amount)`. Cortar o dano em `hpMax` antes de subtrair faz a cura de quem tem 0 PV contar a partir de 0, mesmo quando o máximo caiu abaixo do dano guardado.
- **`hpMax`**: em todos os casos é o efetivo, com override, obtido de `deriveStats`.
- **Testes contra a morte**: se o PV atual calculado for maior que 0 e houver sucessos ou falhas, `normalizeDeathSaves` os zera.
  - O `SheetEditor` aplica essa função a **toda** edição antes de entregá-la ao autosave: cura, PV atual, nível, CON, dado de vida e override do PV máximo.
  - Assim, a regra da spec ("sempre que o PV atual passar a ser maior que 0") vale sem que cada controle precise lembrar dela.
- **Alternativa**: zerar só nos botões de cura e no campo de PV atual. Rejeitado: subir de nível ou mudar a CON com 0 PV deixaria marcações escondidas.

### V4. Modos Jogar e Editar

- **Estado**: `mode` é um estado do `SheetEditor` e não é gravado. O valor inicial vem de `initialSheetMode(document)`, uma função pura em `src/components/sheet/mode.ts`: `"play"` se algum atributo for diferente de 10, `"edit"` caso contrário. Como o editor remonta depois de um "Recarregar" (a `key` usa a versão), o modo volta a ser calculado. Isso é aceitável.
- **Contexto**: um `SheetModeContext` leva o modo aos componentes. Cada componente tem as duas formas e escolhe pelo modo:

  ```
  componente            Jogar                         Editar
  --------------------------------------------------------------------------
  cabeçalho             nome + "Anão . Bárbaro 5 .    formulário de identificação
                        Soldado"
  DerivedValue          texto (sem botão)             botão que abre o override
  bloco de atributo     valor e modificador           campo do valor
  salvaguarda/perícia   marcador de proficiência      checkbox / botão que alterna
                        (só leitura)
  PV                    atual/máx, temp (campo),      campo do PV atual, temp,
                        dano/cura                     dado de vida, dano/cura
  dados de vida         Gastar / Recuperar            Gastar / Recuperar
  deslocamento          texto "9 m"                   campo
  excluir ficha         escondido                     painel no fim da página
  ```

- **Chave**: `[Jogar | Editar]`, segmentada, no cabeçalho da ficha, ao lado do indicador de salvamento. Trocar de modo só muda o estado local e não passa pelo `edit` do autosave, então nada é salvo (spec).
- **Ficha bloqueada**: em conflito ou excluída, o `fieldset disabled` atual continua cobrindo os dois modos.
- **Alternativa**: duas árvores de componentes separadas, uma de leitura e outra de edição. Rejeitado: duplicaria o layout, e cada ajuste visual teria de ser feito duas vezes.

### V5. Layout da ficha

```
 DESKTOP (>= 1024 px)
 +----------------------------------------------------------------------------+
 | Thorin                                [Jogar|Editar]               Salvo   |
 | Anão . Bárbaro 5 . Soldado                                                 |
 +------------------------+---------------------------+-----------------------+
 | CA   INIC  DESL        |  PV  40 / 55   temp [5]   | DADOS DE VIDA 3/5 d12 |
 | --   +2    9 m         |  [  7  ] [Dano] [Cura]    | [Gastar] [Recuperar]  |
 | PASSIVA 14   PB +3     |                           | (morte, só com 0 PV)  |
 +------------------------+---------------------------+-----------------------+
 | +------+ o +6 Salvag.  | +------+ o +2 Salvag.     | +------+ * +6 Salvag. |
 | |  16  | * +6 Atletismo| |  14  | o +2 Acrobacia   | |  16  |              |
 | |  +3  |               | |  +2  | o +2 Furtividade | |  +3  |              |
 | | FOR  |               | | DES  | o +2 Prestidig.  | | CON  |              |
 | +------+               | +------+                  | +------+              |
 |  INT ...               |  SAB ...                  |  CAR ...              |
 +----------------------------------------------------------------------------+

 CELULAR: cabeçalho -> PV -> CA/Inic/Desl/Passiva/PB -> dados de vida (+ morte)
          -> 6 blocos de atributo empilhados (em `sm`, 2 colunas)
```

- **Ordem do DOM**: PV, valores de combate e depois dados de vida, que é a ordem do celular. No desktop, `grid-template-areas` põe os valores de combate à esquerda e o PV no centro, como na referência, sem mudar a ordem do DOM.
- **Bloco de atributo** (`AbilityBlock`), à esquerda: um "emblema" com o valor pequeno em cima, o modificador grande e o nome embaixo, com borda dupla e cantos arredondados, sem `clip-path`, para não complicar o foco e o toque. À direita, a lista de salvaguarda e perícias, cada linha com o marcador de proficiência (○ ● ◉) e o bônus. As perícias vêm de `SKILL_ABILITY`, então a ordem é a da lista de `keys.ts` filtrada pelo atributo.
- **Seções que deixam de existir**: `skills-section.tsx` e o antigo `combat-section.tsx` viram `top-band.tsx` (valores de combate), `hit-points-card.tsx` e `hit-dice-card.tsx`. A `.sheet-grid` antiga dá lugar às áreas novas.
- **Abas futuras**: a grade de atributos ocupa a largura toda. Quando `sheet-sources` chegar, ela pode virar uma coluna lateral, com as abas no centro. É uma mudança de `grid-template-areas`, não de componentes.
- **Dano e cura**: um `NumberField` de "Quantidade" (`parseInteger` com um schema de 1 a 999) e dois botões. Os botões leem o último valor válido digitado e, depois de aplicar, o campo é limpo. Quantidade inválida mostra o erro no campo e os botões não fazem nada.

### V6. Linguagem visual comum e as outras páginas

- **Componentes base** (`form.tsx`): passam a usar os tokens.
  - `Button`: `primary` (roxo), `secondary` (contorno) e um novo `danger`, que substitui as classes vermelhas avulsas do painel de exclusão.
  - `TextField` e `FormMessage`.
  - Novos `Card` (superfície, borda e raio padrão, título opcional em caixa alta pequena) e `Badge` (chips como "Admin", "Desativada", "nível 5").
- **Cabeçalho do app**: barra com a marca (ícone de d20 e "Ficha D&D"), os links, o nome do usuário, a chave de tema e "Sair", em `bg-surface`.
- **Login e troca de senha**: o `AuthCard` vira um cartão centralizado com a marca no topo e a chave de tema no canto.
- **Minhas fichas**: a lista vira uma grade de cartões (2 colunas a partir de `sm`, 3 a partir de `lg`). Cada cartão tem nome, espécie e classe, um badge de nível e a data de alteração. O formulário "Nova ficha" fica num `Card` no topo.
- **Minha conta**: um `Card` com o formulário de troca de senha.
- **Admin de contas**: o formulário de nova conta num `Card` e a tabela dentro de outro `Card`. Papel e estado viram `Badge`.
- **"Não encontrado"**: um `Card` centralizado.
- **Larguras**: o layout `(app)` continua com `max-w-6xl` e as páginas de texto com `max-w-4xl`, como na change `sheet-core-stats`. Agora a lista de fichas usa a largura toda, porque virou grade.

### V7. Ícones

`src/components/icons.tsx` exporta poucos ícones em SVG inline, com `currentColor` e `aria-hidden`: `D20` (marca), `Sun`, `Moon`, `Shield` (CA), `Heart` (PV), `Dice` (dados de vida), `Bolt` (iniciativa) e `Boot` (deslocamento). Os traços são desenhados à mão, em estilo simples. **Alternativa**: `lucide-react`. Rejeitado por ora, porque uma dependência para oito ícones não compensa. A troca é fácil se o número de ícones crescer.

### V8. Testes

- **Unitários**:
  - `hit-points.ts`, com todos os cenários numéricos da spec: temporário absorvendo, dano acima do atual, cura limitada, cura a partir de 0 com máximo abaixo do dano, override do máximo e `normalizeDeathSaves` (subir de nível com 0 PV, cura, PV ainda 0);
  - `initialSheetMode`;
  - o schema da quantidade de dano e cura.
- **Navegador**:
  - modos, dano e cura, e testes contra a morte aparecendo e sumindo;
  - layout a 375 px (iframe, como na change anterior) e a 1280 px;
  - tema: alternar, recarregar sem piscar (o `data-theme` já presente no primeiro HTML pintado, conferido por um script de teste antes da hidratação) e a preferência mantida no login depois de sair;
  - todas as outras páginas nos dois temas.

## Risks / Trade-offs

- **[Script inline no `<head>` e uma futura Content Security Policy]** → Hoje não há CSP. Se ela vier com a change `deployment`, o script precisa de um hash ou nonce. Fica registrado aqui para essa change.
- **[Contraste insuficiente em algum par de cores]** → Escolher os tokens com contraste AA (4,5:1 para texto) nos dois temas e conferir `text-muted` sobre `surface` no navegador.
- **[A refatoração toca quase todos os componentes visuais de uma vez]** → As tarefas seguem uma ordem: primeiro tokens e componentes base, com a app ainda funcionando; depois as páginas simples; por último a ficha. Cada grupo é conferido no navegador antes do próximo.
- **[Mudança de comportamento dos testes contra a morte surpreende]** → É a regra do 5.5e e foi decisão do usuário. Os testes só ficam escondidos quando estão zerados, porque a normalização garante isso.
- **[O modo Jogar esconde a edição de quem não acha a chave]** → A chave fica sempre visível no cabeçalho da ficha, e a ficha nova abre em Editar.
- **[Em dev, o loader `@tailwindcss/turbopack` não relê o `globals.css` editado]** → Ele atualiza as classes vindas dos `.tsx`, mas mantém o conteúdo antigo do próprio `globals.css`, seja qual for o jeito de editar o arquivo. *(Confirmado na implementação.)* Depois de mexer no `globals.css`, reiniciar o `npm run dev` e conferir a regra nova no CSS servido antes de avaliar o visual.

## Migration Plan

- Sem migração de dados. O formato do documento não muda.
- Os aparelhos sem preferência guardada passam a abrir no tema escuro, mesmo que o sistema esteja no claro. É o comportamento pedido.
- **Rollback**: voltar o código. A chave `dnd-sheet:theme` esquecida no `localStorage` não tem efeito na versão anterior.
