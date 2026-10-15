# Proposal

## Why

A ficha já calcula os números do personagem, mas não guarda nada do que ele *tem* ou *sabe*: talentos, traços de classe e espécie, itens e magias. Hoje o jogador precisa de papel ao lado para isso. Essas "fontes" são também a base do motor de efeitos (D4 de `dnd-sheet-architecture`). A `sheet-effects` vai pendurar efeitos nelas, e a ativação "se equipado" dos itens precisa existir antes. Esta change entrega as fontes como conteúdo editável dentro da ficha, sem compêndio, digitado pelo jogador, como decidido no roadmap.

## What Changes

- **Quatro tipos de fonte** dentro da ficha, todos com nome e descrição:
  - **Talento**: categoria (origem, geral, estilo de luta, dádiva épica).
  - **Traço**: origem (classe, subclasse, espécie, antecedente, outro) e de onde vem (texto livre, por exemplo "Bárbaro").
  - **Item**:
    - categoria (arma, armadura, escudo, equipamento, consumível, outro);
    - quantidade, peso em kg e preço (texto livre);
    - equipado, requer sintonização e sintonizado.
  - **Magia**:
    - círculo (truque a 9), escola e classe que a conhece;
    - tempo de conjuração, alcance, componentes (V, S, M e o texto do material) e duração;
    - concentração, ritual e preparada.
- **Ativação dos itens**: um item é ativo quando está equipado e, se exigir sintonização, também sintonizado. A ficha mostra quais itens estão ativos, e os efeitos da `sheet-effects` só valerão para itens ativos.
- **Limite de sintonização**: a ficha avisa quando há mais de 3 itens sintonizados, sem impedir.
- **Carga**: o Inventário mostra a carga total carregada (peso × quantidade).
- **Descrição em Markdown básico**: parágrafos, quebras de linha, **negrito**, *itálico* e listas. É exibida formatada e de forma segura, sem HTML.
- **Abas Características | Inventário | Magias** abaixo dos atributos. Talentos e traços ficam juntos em Características, e as magias são agrupadas por círculo.
- **Modos**:
  - Em **Editar**: criar, alterar e excluir fontes (a exclusão pede confirmação).
  - Em **Jogar**: equipar, sintonizar, preparar magias e mudar a quantidade de itens, que são ações de mesa.
- **Formato da ficha**: passa ao formato 3, com uma lista de fontes. As fichas do formato 2 são migradas com a lista vazia.

Fora do escopo:

- **Efeitos das fontes** (bônus, CA, proficiências) ficam em `sheet-effects`. **Usos limitados e espaços de magia** ficam em `sheet-resources`.
- **Itens fora do tipo "fonte"**: compêndio, importar conteúdo do SRD e moedas como item próprio.
- **Regras de carga**: capacidade e regras de sobrecarga.
- **Organização das fontes**: busca e filtros dentro das abas, e reordenar fontes manualmente.
- **Atributos em coluna lateral**: continuam em grade. A reorganização fica para quando as abas tiverem uso real.

## Capabilities

### New Capabilities

- `sheet-sources`: as fontes da ficha (talentos, traços, itens e magias). Cobre os campos de cada tipo, criar, editar e excluir, ativação de itens e sintonização, carga, descrição em Markdown básico e a organização em abas.

### Modified Capabilities

- `sheet-core-stats`: o requisito "Modos Jogar e Editar" passa a incluir as ações de mesa sobre as fontes, que funcionam em Jogar, e a edição das fontes, que é só em Editar.

## Impact

- **`src/engine/sheet/document.ts` e `migrate.ts`**: formato 3, com `sources` como união discriminada por tipo, e a migração do formato 2 para o 3.
- **Novo `src/engine/sources/`**: regras puras (item ativo, contagem de sintonizados, carga total, ordenação de magias), com testes.
- **Novo parser de Markdown básico**, puro e testado, mais um componente que o exibe como elementos React. Nenhuma dependência nova.
- **`src/components/sheet/`**: abas, listas por tipo, cartão de fonte (leitura e edição) e formulário de cada tipo.
- **Tamanho da ficha**: continua limitado a 256 KB. Descrições longas em muitas fontes podem se aproximar do limite (ver o design).
- **O que não muda**: o servidor, o banco e as rotas.
