# Tasks

## 1. Formato e motor

- [x] 1.1 Criar `src/engine/attacks/schema.ts` com `actionsSchema`, `MAX_ACTIONS_PER_SOURCE` e `createAction(source)` (G1, G8). Acrescentar `actions` ao `base` das fontes e `weaponCategory` ao item (G2), e ajustar `createSource`. Testes:
  - uma ação de ataque com duas partes é válida;
  - a 7ª ação, uma ação sem partes e a 5ª parte são recusadas;
  - `count` 41, `upcast` 21 e `dcAdjust` 11 são recusados;
  - um bônus "2 * nivel +" é recusado, inclusive numa ação de salvaguarda, onde o campo não é usado;
  - ids repetidos de ação e de parte são recusados;
  - `ability: "attack"` numa ação automática é válido.

  Verificar que `npm test` passa
- [x] 1.2 Criar o formato 10: `SOURCE_MIGRATIONS[9]`, `migrateV9ToV10` e `SHEET_SCHEMA_VERSION = 10` (G9). Testes:
  - uma ficha do formato 9 com um item e uma magia fica com `actions: []` e com o item `weaponCategory: "simple"`;
  - um documento do formato 1 chega ao 10;
  - `migrateSource` de uma fonte do formato 9 devolve a fonte no 10;
  - os valores calculados de uma ficha migrada são iguais aos de antes.

  Acrescentar a `src/server/compendium/service.int.test.ts` o caso de uma entrada gravada no formato 9 lida no 10. Atualizar o README (formato 10 e o primeiro uso de `SOURCE_MIGRATIONS`). Verificar que `npm test` e `npm run test:int` passam
- [x] 1.3 Criar `src/engine/attacks/derive.ts` com `actionContext`, `isProficient`, `deriveSourceActions` e o cálculo do acerto, da CD e das partes (G3–G6). Testes com os cenários da spec:
  - Machado de Batalha de Thorin: +6 com 1d8+3 e 1d10+3, e +4 com Exaustão 1, com a parcela;
  - Espada Longa +1: +7 e 1d8+4;
  - Rapieira de Ária: +2 sem proficiência, +5 com "rapieira" na ficha e +5 com um talento ativo que concede marciais;
  - "nunca proficiente" sem PB;
  - acuidade escolhendo DES (Ária) e FOR (Thorin);
  - Raio de Fogo de Elara: +5, +8 com o valor manual do ataque mágico, +6 com uma varinha que soma 1, e Exaustão contada uma vez só;
  - magia com atributo próprio INT 12: +4;
  - Zombaria Viciosa: SAB CD 15 e 2d6;
  - Bola de Fogo: DES CD 14, metade no sucesso e upcast 1;
  - Sopro de Kriv por expressão: CD 14 e 3d10;
  - Rajada Mística: 2 ataques no nível 5 e 1 no nível 1;
  - Clava: 1d4-1;
  - Ataque Desarmado: 4, sem dados;
  - Palavra Curativa: 2d4+4 cura;
  - `upcast` ignorado em truques e em talentos.

  Verificar que `npm test` passa
- [x] 1.4 Criar `deriveAttackList(document, stats)` com a regra de quem entra na lista e a ordem (G7). Testes:
  - item desequipado fora e item equipado sem sintonização dentro;
  - magia de 1º círculo não preparada fora, sempre preparada dentro e truque sempre dentro;
  - a ordem Rapieira, Inspiração de Bardo, Zombaria Viciosa e Palavra Curativa;
  - fonte sem ações não gera linha.

  Acrescentar a `src/server/sheets/service.int.test.ts` o caso de salvar uma ficha do formato 10 com ações de ataque, salvaguarda e automática. Verificar que `npm test` e `npm run test:int` passam

## 2. Ficha na tela

- [x] 2.1 Criar o editor de ações (`actions-editor.tsx`) no formulário da fonte, e a categoria de arma no formulário do item (G2, G8):
  - criar, mover, excluir e recolher ações;
  - campos por modo de resolução;
  - de 1 a 4 partes;
  - "por círculo" só em magias de círculo 1 ou acima;
  - expressões com pré-visualização.

  Verificar no navegador:
  - criar no Machado de Batalha as ações "Uma mão" e "Duas mãos" salva e recarrega igual;
  - um bônus inválido mostra o erro e não salva;
  - mudar a magia para truque esconde "por círculo";
  - a 7ª ação não pode ser criada;
  - em 375 px, o formulário não tem rolagem horizontal;
  - o editor funciona também na página `/admin/compendio`
- [x] 2.2 Criar o cartão Ataques no topo da coluna da direita (G8), com a origem do acerto e da CD pelo `PanelShell` e o `Contributions` exportados de `derived-value.tsx`. Verificar no navegador:
  - Thorin mostra "+6 · 1d8+3 cortante" e "+6 · 1d10+3 cortante";
  - tocar no acerto abre a origem com as parcelas;
  - desequipar o machado em Jogar tira as linhas;
  - em Jogar, sem ações, o cartão não aparece, e em Editar ele mostra a dica;
  - a ficha compartilhada mostra o cartão só para leitura;
  - em 375 px, o cartão vem logo depois da faixa de condições, sem rolagem horizontal;
  - em 1280 px, os cartões aparecem na ordem Ataques, Recursos, Defesas e Proficiências
- [x] 2.3 Mostrar o resumo das ações no cartão da fonte e no `EntrySummary` do compêndio, este com o contexto de uma ficha nova (G8). Verificar no navegador:
  - a Bola de Fogo não preparada mostra "DES CD 14 · 8d6 fogo (+1d6/círculo)" no cartão;
  - um resultado do compêndio com ações mostra o resumo;
  - "Adicionar" do compêndio copia as ações para a ficha.

## 3. Fechamento

- [x] 3.1 Rever a frase sobre rolagem de dados nos não-objetivos de `openspec/changes/dnd-sheet-architecture/design.md`, para registrar que os ataques são mostrados e não rolados. Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build`, `npm run format:check` e `openspec validate --all` e verificar que todos passam
