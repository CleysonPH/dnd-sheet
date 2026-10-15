# Tasks

## 1. Formato e regras

- [ ] 1.1 Trocar `prepared` por `preparation` no `spellSchema` com `SPELL_PREPARATIONS`, ajustar a regra de truque, o `createSource` e o `preparedCount`, e criar o `alwaysPreparedCount` (M1, M2, M4). Testes unitários:
  - truque com `"always"` recusado;
  - contagem de Elara com 1 preparada e 2 sempre preparadas;
  - magia nova com `"none"`.

  Verificar que `npm test` passa
- [ ] 1.2 Subir `SHEET_SCHEMA_VERSION` para 6 e criar a `migrateV5ToV6` (M3). Testes:
  - preparada vira `"prepared"`;
  - não preparada vira `"none"`;
  - o campo `prepared` some;
  - itens e talentos ficam iguais;
  - um documento do formato 1 chega ao 6 válido.

  Acrescentar a `src/server/sheets/service.int.test.ts` o caso de salvar uma ficha com uma magia sempre preparada. Atualizar o README (formato 6). Verificar que `npm test` e `npm run test:int` passam

## 2. Ficha na tela

- [ ] 2.1 Trocar no formulário de magia a caixa "Preparada" pelo seletor "Preparação" e o rótulo "Classe" por "Origem". No cartão, mostrar a etiqueta "Sempre preparada" no lugar da caixa e as linhas "Origem" e "Preparação" nos detalhes. Na aba Magias, mostrar as duas contagens (M5). Verificar no navegador:
  - "Passo Nebuloso", 2º círculo, origem "Tocado pelas Fadas", sempre preparada, mostra a etiqueta sem a caixa em Jogar;
  - "Sono" continua alternando entre preparada e não preparada;
  - a aba mostra "Preparadas: 1 · Sempre preparadas: 1";
  - mudar a sempre preparada para truque esconde a preparação;
  - uma ficha antiga com magia preparada abre como "Preparada".

  Conferir a 375 px e nos dois temas
- [ ] 2.2 Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check` e verificar que todos passam
