# Proposal

## Why

A ficha funciona, mas é um formulário: toda informação é uma caixa de texto, as 18 perícias ficam numa coluna separada dos atributos, e aplicar dano exige fazer a conta e digitar o PV novo. Na mesa, o que se quer é ler os números rapidamente e mexer só no que muda durante o jogo. A referência visual escolhida pelo usuário (`ref/hero-dairy.png`) mostra esse caminho: números grandes, perícias agrupadas sob o atributo, uma faixa de topo com o que se consulta toda rodada e um widget de PV com cura e dano. A app também não tem identidade visual (tons de cinza, sem cor de destaque) e nem usa a fonte que carrega. Esta é a hora de mudar, antes que `sheet-sources`, `sheet-effects` e `sheet-resources` acrescentem conteúdo sobre o layout atual.

## What Changes

- **Modos Jogar e Editar** na ficha, com uma chave global:
  - **Jogar** mostra os valores para leitura. Só funcionam os controles de mesa: dano, cura, PV temporário, dados de vida e testes contra a morte.
  - **Editar** mostra os campos e os valores manuais (override), como hoje.
  - A ficha abre em Jogar quando algum atributo já foi preenchido, e em Editar quando ainda está com os valores iniciais.
- **Dano e cura**: aplicar uma quantidade de dano, que gasta primeiro o PV temporário, ou de cura, que vai até o PV máximo.
- **Testes contra a morte só com 0 PV**: eles aparecem apenas quando o PV atual chega a 0, e são zerados sempre que o PV atual volta a ser maior que 0, pela regra do 5.5e. **BREAKING** para quem esperava ver as marcações com PV acima de 0.
- **Novo layout da ficha**:
  - **Faixa de topo**: CA (com o lugar reservado até `sheet-effects`), iniciativa, deslocamento, percepção passiva e bônus de proficiência; o bloco de PV com cura e dano; e dados de vida mais testes contra a morte.
  - **Atributos**: blocos com o valor, o modificador, a salvaguarda e as perícias daquele atributo. Ficam numa grade de 3 colunas no desktop e empilhados no celular.
- **Tema**: escuro por padrão, com destaque roxo, e uma chave no cabeçalho para o tema claro. A preferência fica guardada no aparelho e a página já abre no tema escolhido, sem piscar.
- **Visual coerente em toda a app**: login, troca de senha, lista de fichas, minha conta, admin de contas e "não encontrado" passam a usar o mesmo sistema de cores, cartões e tipografia da ficha. A fonte Geist passa a ser usada de fato, sem o `Arial` que a sobrescreve.

Fora do escopo:

- **Itens que dependem de outras changes**: inspiração, condições, proficiências em texto (armas, armaduras, idiomas), notas de sessão, e as abas de ações, inventário e traços. Estas últimas chegam com `sheet-sources` e `sheet-resources`.
- **Preferência de tema por conta**: ela é guardada por aparelho, não sincronizada.
- **Mudanças no formato do documento da ficha**.

## Capabilities

### New Capabilities

- `appearance`: tema visual da aplicação. Cobre o tema escuro padrão, a chave para o claro, a preferência guardada por aparelho e a ausência de troca visível de tema ao carregar a página.

### Modified Capabilities

- `sheet-core-stats`: os testes contra a morte passam a aparecer só com 0 PV e são zerados ao sair de 0; a organização da ficha na tela muda para o novo layout; e entram dois requisitos novos: os modos Jogar e Editar, e a aplicação de dano e cura.

## Impact

- **`src/components/sheet/`**:
  - as seções viram componentes de leitura e de edição;
  - novo bloco de atributo com as perícias;
  - nova faixa de topo e widget de PV;
  - a chave de modo fica no `SheetEditor`.
- **Novas funções puras de dano, cura e normalização dos testes contra a morte**, com testes unitários. Elas ficam em `src/engine/stats/` porque dependem do PV máximo calculado.
- **`src/app/globals.css`**: variáveis de cor para os dois temas e remoção do `font-family: Arial`.
- **`src/app/layout.tsx`**: script inline no `<head>` que aplica o tema salvo antes da primeira pintura.
- **Todas as páginas e `src/components/form.tsx`**: as classes `dark:` (cerca de 35 ocorrências) são trocadas pelas variáveis de tema, e os layouts de login, lista, conta, admin e "não encontrado" são refeitos.
- **Ícones**: poucos, em SVG inline, num componente único. Nenhuma dependência nova.
- **O que não muda**:
  - o formato do documento (continua o formato 2), sem migração;
  - o servidor, o banco e as rotas.
