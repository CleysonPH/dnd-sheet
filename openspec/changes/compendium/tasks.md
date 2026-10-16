# Tasks

## 1. Motor

- [ ] 1.1 Criar `withoutTableState` e `copyToSheet` em `src/engine/sources/rules.ts` (B3). Testes:
  - um item equipado e sintonizado, com tracker 2/3 usado, volta desequipado, dessintonizado e com o tracker sem uso, mantendo a quantidade;
  - uma magia em efeito e preparada sai de efeito e continua preparada;
  - `copyToSheet` troca só o id da fonte.

  Verificar que `npm test` passa
- [ ] 1.2 Criar `searchKey` em `src/engine/sources/search.ts` e `SOURCE_MIGRATIONS` e `migrateSource` em `src/engine/sources/migrate.ts` (B2, B4). Testes:
  - "Bola de Fogo" e "  BOLA de fôgo " dão a mesma chave;
  - "Élfico" contém "elf";
  - uma fonte da versão atual passa sem mudanças;
  - com um passo sintético, uma fonte da versão anterior chega migrada;
  - uma fonte inválida lança erro.

  Registrar no README a regra das migrações por fonte. Verificar que `npm test` passa

## 2. Banco e servidor

- [ ] 2.1 Criar a tabela `compendium_entry` em `src/server/db/` e a migração 0004 com `npm run db:generate`, e limpar a tabela em `resetDatabase` (B1). Verificar que `npm run db:migrate` aplica a migração no banco de dev
- [ ] 2.2 Criar `src/server/compendium/service.ts` com `searchEntries`, `createEntry`, `saveEntry`, `deleteEntry` e `sendToCompendium` (B5). Testes de integração:
  - usuário comum busca, mas não cria, salva, exclui nem envia (`FORBIDDEN`), e nada muda;
  - admin cria "Robusto", salva com um efeito e o encontra buscando "robu";
  - a busca ignora acentos, filtra por tipo, ordena por nome e para em 50;
  - salvar com expressão inválida ou com o tipo trocado é `invalid`;
  - excluir uma entrada inexistente é `not_found`;
  - `sendToCompendium` de uma magia em efeito grava a entrada fora de efeito, e enviar duas vezes cria duas entradas;
  - a 2001ª entrada é recusada.

  Verificar que `npm run test:int` passa

## 3. Interface

- [ ] 3.1 Criar a página `/admin/compendio` e o link "Compêndio" no menu do admin, com busca, filtro, "Nova entrada", edição pelo `SourceForm` com "Salvar" e exclusão com confirmação (B6). Verificar no navegador:
  - como admin, criar "Robusto" com o efeito somar `nivel * 2` no PV máximo, salvar e ver o resumo na lista;
  - excluir com confirmação;
  - como usuário comum, `/admin/compendio` dá "não encontrado" e o menu não mostra o link
- [ ] 3.2 Criar o painel "Compêndio" no painel de fontes (B7):
  - o botão só em Editar, o filtro inicial pela aba e a busca com atraso;
  - os resultados com o resumo e a etiqueta "já na ficha";
  - "Adicionar", o arrastar até a lista e o aviso no limite de fontes.

  Verificar no navegador, numa ficha de teste:
  - "bola" na aba Magias mostra "Bola de Fogo" e nada de outras abas;
  - "Adicionar" põe a magia fora de efeito na aba Magias e salva;
  - adicionar de novo cria uma segunda cópia e mostra "já na ficha";
  - arrastar em 1280 px adiciona;
  - em Jogar, o botão não aparece;
  - em 375 px, o painel fica acima da lista, sem rolagem horizontal
- [ ] 3.3 Acrescentar "Enviar ao compêndio" ao cartão da fonte para admins em Editar, com `isAdmin` vindo da página (B7). Verificar no navegador:
  - o admin envia "Bola de Fogo" em efeito, e a entrada aparece em `/admin/compendio` fora de efeito;
  - a ficha não muda;
  - um usuário comum não vê a ação
- [ ] 3.4 Verificar a cópia independente no navegador: mudar a descrição da entrada em `/admin/compendio` não muda a cópia já adicionada, e renomear a cópia na ficha não muda a entrada

## 4. Fechamento

- [ ] 4.1 Rever a D2 em `openspec/changes/dnd-sheet-architecture/design.md` e a frase da proposta sobre o compêndio (B8). Verificar que `openspec validate dnd-sheet-architecture` passa
- [ ] 4.2 Atualizar o README (compêndio, tabela nova e migrações por fonte). Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check` e verificar que todos passam
