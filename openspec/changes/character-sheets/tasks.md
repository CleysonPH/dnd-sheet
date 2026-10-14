# Tasks

## 1. Formato do documento

- [x] 1.1 Criar `src/engine/sheet/document.ts` com `SHEET_SCHEMA_VERSION`, o schema Zod estrito do formato 1, o tipo `SheetDocument` e `createSheetDocument(name)` (C2), com testes unitários para os limites de cada campo, nível não inteiro e fora de 1..20, nome em branco e campo desconhecido; verificar que `npm test` passa e que `npm run lint` não acusa importações proibidas em `src/engine/`
- [x] 1.2 Criar `migrateSheetDocument(raw, migrations?)` em `src/engine/sheet/migrate.ts` (C3), com testes unitários usando migrações sintéticas (v1 -> v3 em cadeia, documento já atual, versão futura, sem `schemaVersion`); verificar que `npm test` passa

## 2. Persistência

- [x] 2.1 Adicionar a tabela `sheet` em `src/server/db/sheet-schema.ts`, reexportá-la em `schema.ts` e gerar a migração com `npm run db:generate` (C1); verificar que `npm run db:migrate` cria a tabela com índice em `owner_id` e que `npm run test:int` continua passando
- [x] 2.2 Implementar `listSheets`, `createSheet` e `getSheet` em `src/server/sheets/service.ts` (C4), com testes de integração para a lista só do dono e ordenada por alteração, a criação no nível 1, o nome em branco e o `getSheet` de outro usuário e de um admin devolvendo `null`; verificar que `npm run test:int` passa
- [x] 2.3 Implementar `saveSheet` com atualização condicionada à versão e validação de tamanho e schema (C4), com testes de integração para salvamento ok (versão +1, nome copiado para a coluna), conflito sem alterar a ficha, ficha de outro usuário, ficha inexistente, nível "vinte", campo desconhecido e documento de 300 KB; verificar que `npm run test:int` passa
- [x] 2.4 Implementar `deleteSheet` com conferência do nome no servidor (C4), com testes de integração para exclusão confirmada, nome errado, ficha de outro usuário e salvar depois de excluir (`not_found`); verificar que `npm run test:int` passa

## 3. Autosave

- [x] 3.1 Implementar o reducer de autosave em `src/components/sheet/autosave.ts` (C5), com testes unitários para debounce de 1,5 s, teto de 5 s em digitação contínua, edição durante envio (reenvio com a versão nova), backoff de 2 s a 30 s, `invalid` sem nova tentativa, conflito e excluída bloqueando a edição; verificar que `npm test` passa
- [x] 3.2 Implementar o hook `useSheetAutosave` ligando o reducer a timers, à server action de salvar e ao listener `beforeunload` (C5); verificar que `npm run typecheck` e `npm run lint` passam

## 4. Telas

- [x] 4.1 Substituir a página provisória de `/` pela lista "Minhas fichas", com o estado vazio e o formulário "Nova ficha" que cria e redireciona (C6); verificar no navegador a lista vazia, a criação de uma ficha e a ordem por última alteração
- [x] 4.2 Criar `/fichas/[id]` com o formulário do cabeçalho, erros por campo, o indicador "Salvando…/Salvo/Não salvo" e os avisos de conflito ("Recarregar") e de ficha excluída (C5, C6); verificar no navegador que uma edição chega a "Salvo" em até 5 s e aparece na lista, que nível 21 e nome vazio mostram erro e não são salvos, e que o listener `beforeunload` está ativo com alteração pendente
- [x] 4.3 Adicionar o painel "Excluir ficha", que só confirma quando o nome digitado confere (C6); verificar no navegador a exclusão com nome certo (volta à lista) e que o nome errado mantém o botão desativado
- [x] 4.4 Verificar no navegador os cenários entre dispositivos: a mesma ficha aberta em duas abas, salvar numa e editar na outra mostra o aviso de conflito, e "Recarregar" traz a versão nova; excluir numa aba e editar na outra mostra o aviso de ficha excluída; e o endereço de uma ficha de outro usuário (inclusive para o admin) mostra "não encontrado" sem dados da ficha

## 5. Verificação final

- [x] 5.1 Atualizar o README (rotas e estrutura de `src/engine/sheet` e `src/server/sheets`) e rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check`; verificar que todos passam
