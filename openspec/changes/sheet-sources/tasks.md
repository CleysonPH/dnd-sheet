# Tasks

## 1. Formato e regras

- [ ] 1.1 Criar `src/engine/sources/kinds.ts` com as listas fechadas (categorias de talento, origens de traço, categorias de item, escolas de magia) e levar `src/engine/sheet/document.ts` ao formato 3 com `sources` (união discriminada, limites de cada campo, ids únicos, no máximo 300, sintonizado só com requisito, truque nunca preparado) (F1); atualizar os testes do schema com esses casos; verificar que `npm test` passa e que `npm run lint` não acusa importações proibidas em `src/engine/`
- [ ] 1.2 Acrescentar `migrateV2ToV3` em `src/engine/sheet/migrate.ts` e `sources: []` em `createSheetDocument` (F2), com teste da migração e o teste de cobertura esperando 2 migrações; verificar que `npm test` passa
- [ ] 1.3 Implementar `src/engine/sources/rules.ts` (`isItemActive`, `attunedCount`, `totalWeight`, `spellsByLevel`, `preparedCount`, `createSource`, `ATTUNEMENT_LIMIT`) (F3), com testes dos cenários da spec (carga 7,5 kg e 3,5 kg com quantidade 0, anel equipado sem sintonia, 4 sintonizados, grupos e ordem das magias, 1 preparada); verificar que `npm test` passa
- [ ] 1.4 Acrescentar a `src/server/sheets/service.int.test.ts` os casos de salvar uma ficha com uma fonte de cada tipo e de recusar item sintonizado sem requisito (F7); verificar que `npm run test:int` passa

## 2. Markdown básico

- [ ] 2.1 Implementar `parseMarkdown` em `src/lib/markdown.ts` (F4), com testes de parágrafos, quebras de linha, listas `- ` e `1. `, negrito, itálico, ênfase dentro de negrito, marcadores sem par e HTML mantido como texto; verificar que `npm test` passa
- [ ] 2.2 Criar o componente `Markdown` em `src/components/markdown.tsx` que exibe os blocos como elementos React, sem `dangerouslySetInnerHTML` (F4); verificar que `npm run typecheck` e `npm run lint` passam e que `grep -r dangerouslySetInnerHTML src/components` não encontra nada

## 3. Fontes na ficha

- [ ] 3.1 Criar `SourcesPanel` com as abas Características, Inventário e Magias (contagem, estado vazio, teclado) e `SourceCard` com cabeçalho expansível e descrição em Markdown, abaixo da grade de atributos (F5); verificar no navegador as abas vazias de uma ficha antiga e a contagem depois de criar fontes
- [ ] 3.2 Implementar a criação (formulário curto no topo da aba) e o `SourceForm` de talento e traço, com edição ao vivo, "Concluir" e exclusão com confirmação, só em Editar (F5); verificar no navegador os cenários "Novo traço", "Talento com categoria", "Traço de espécie", nome em branco recusado, descrição acima de 5.000 caracteres recusada, excluir com confirmação e desistir
- [ ] 3.3 Implementar o `SourceForm` de item e as ações de mesa do Inventário (equipado, sintonizado, quantidade −/+, badge Ativo, carga total, aviso acima de 3 sintonizados) (F5, F6); verificar no navegador os cenários de item da spec: Azagaia 4 × 1 kg, peso -1 e 0,125 recusados, Machado ativo, Anel equipado só ativo depois de sintonizado, desequipar mantendo a sintonia, quarto sintonizado com aviso, carga 7,5 kg e diminuir para 3 Azagaias em Jogar
- [ ] 3.4 Implementar o `SourceForm` de magia e a aba Magias agrupada por círculo, com contagem de preparadas e checkbox de preparada fora dos truques (F5, F6); verificar no navegador "Mísseis Mágicos" completa, material descrito, o agrupamento de Mãos Mágicas, Enfeitiçar Pessoa e Sono, e a contagem de 1 preparada
- [ ] 3.5 Verificar no navegador os modos e o visual: em Jogar não há criar, editar nem excluir, e as ações de mesa funcionam; a descrição de "Fúria" com negrito e lista, e o `<script>` literal; e as abas a 375 px (sem rolagem horizontal) e a 1280 px, nos dois temas

## 4. Verificação final

- [ ] 4.1 Atualizar o README (formato 3, `src/engine/sources/` e o Markdown básico) e rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check`; verificar que todos passam
