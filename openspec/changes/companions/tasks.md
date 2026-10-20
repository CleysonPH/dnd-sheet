# Tasks

## 1. Motor

- [x] 1.1 Acrescentar o escopo às expressões (H2):
  - `parseExpression(text, scope)` com as variáveis `dono.*` e `circulo` no escopo `companion`, e `owner` e `spellLevel` em `ExpressionVariables`;
  - `conj.mod` do companheiro resolvido pelo dono;
  - cache por escopo e texto;
  - as fábricas `expressionSchema(scope)`, `trackersSchemaFor(scope)` e `actionsSchemaFor(scope)`;
  - o `ExpressionField` aceitando o escopo.

  Testes:
  - "dono.con.mod" e "circulo" são recusados no escopo `sheet` e nos schemas de efeitos, trackers e ações das fontes;
  - "12 + dono.con.mod", "dono.pb", "dono.for" e "5 + 10 * circulo" são aceitos no escopo `companion`;
  - `dono.*` sem `owner` lança `EvaluationError`;
  - `conj.mod` do companheiro devolve o modificador de conjuração do dono, ou 0 sem atributo.

  Verificar que `npm test` passa
- [x] 1.2 Criar `src/engine/companions/schema.ts` com `companionsSchema`, `MAX_COMPANIONS` e `createCompanion(id)` (H1). Criar o formato 11, com `migrateV10ToV11` e `SHEET_SCHEMA_VERSION = 11` (H8). Testes:
  - o companheiro novo tem os valores iniciais da spec;
  - o 5º companheiro, um nome vazio, traços com 2.001 caracteres, o PB 11 e o círculo 10 são recusados;
  - `summon.level` abaixo de `minLevel` é aceito;
  - a 7ª ação, o 11º uso e ids repetidos são recusados;
  - uma ação com bônus "dono.con.mod" é aceita;
  - uma ficha do formato 10 fica com `companions: []` e os mesmos valores calculados;
  - um documento do formato 1 chega ao 11.

  Atualizar o README (formato 11). Verificar que `npm test` passa
- [x] 1.3 Criar `src/engine/companions/derive.ts` com `deriveCompanion(companion, ownerStats)` (H3). Testes com os cenários da spec:
  - Hound de Brann: CA 15, PV 30, 5d8, PB +3 do dono e +2 → +3 ao subir do nível 4 para o 5;
  - Pack Bond: salvaguarda de FOR +5, de INT −1 e Atletismo +5; sem a marcação, FOR +2;
  - Coruja: PB próprio +2 com o dono no nível 9, salvaguarda de DES +1, Percepção +5 e passiva 15;
  - Steed: CA 12, PV 25 e 2d10 no círculo 2, e CA 14, PV 45 e 4d10 no 4;
  - o círculo abaixo do mínimo usa o mínimo;
  - `circulo` sem invocação vale 0;
  - a divisão por zero vale 0 e traz o erro;
  - um resultado negativo vale 0;
  - a especialista com Pack Bond mantém o dobro.

  Verificar que `npm test` passa
- [x] 1.4 Generalizar o cálculo das ações (H4):
  - o `ActionContext` com os valores resolvidos;
  - `deriveActionLine(action, host, context)`, `sourceHost` e `companionHost`;
  - `companionActionContext`.

  Testes:
  - todos os testes de `attacks/derive.test.ts` passam sem mudar as expectativas;
  - Mordida do Hound com +6 e "2d4+5 perfurante";
  - "Derrubar" com FOR CD 14;
  - Otherworldly Slam de Elara no círculo 4 com +5, a parcela "Ataque mágico do dono" e "1d8+4 radiante";
  - a proficiência automática do companheiro é sempre proficiente;
  - o `upcast` é ignorado;
  - a escala por nível usa o nível do dono;
  - a Exaustão do dono não entra no acerto do companheiro.

  Verificar que `npm test` passa
- [x] 1.5 Criar `src/engine/companions/table.ts` com dano, cura, PV temporário, dados de vida e condições (H5), extraindo a regra de dano e cura que `applyDamage` e `applyHealing` passam a usar. Estender `shortRest` e `longRest` aos companheiros (H6). Testes:
  - 30/30 com 5 temporários e 12 de dano dá 23/30 e 0 temporários;
  - 40 de dano com 23 PV dá 0/30, caído, sem mexer nos testes contra a morte do dono;
  - a cura com o máximo menor que o dano conta a partir de 0;
  - trocar o círculo de 4 para 2 com 10 de dano dá 15/25;
  - gastar e recuperar um dado de vida não passa de 0 nem do máximo;
  - o descanso curto recarrega "Defletir" e não "Reparar", sem mexer no PV;
  - o descanso longo leva o Hound a 30/30, 0 temporários e 5/5, e mantém amedrontado;
  - os testes de `rest.test.ts` e de `hit-points.test.ts` continuam passando.

  Acrescentar a `src/server/sheets/service.int.test.ts` o caso de salvar uma ficha do formato 11 com um companheiro com ações e usos, e de recusar um companheiro com "dono.con.mod +". Verificar que `npm test` e `npm run test:int` passam

## 2. Ficha na tela

- [x] 2.1 Adaptar o `ActionsEditor` e o `TrackersEditor` para receber a lista, o `onChange`, os valores iniciais, o escopo e as variáveis da pré-visualização, em vez da `Source`, e ajustar o formulário de fonte (H7). Verificar no navegador:
  - criar, editar e mover ações e trackers numa fonte continua salvando e recarregando igual;
  - o campo de círculo continua só em magias de círculo 1 ou acima;
  - "dono.con.mod" num efeito, num tracker ou numa ação de fonte mostra o erro e não salva
- [x] 2.2 Criar a seção Companheiros, o cartão e o formulário (H7):
  - adicionar, mover e excluir com confirmação;
  - os campos do bloco, o PB, a invocação e as expressões com pré-visualização;
  - as ações e os usos.

  Verificar no navegador:
  - criar o Hound com as expressões da spec mostra CA 15, PV 30/30, 5/5 d8 e a Mordida "+6 · 2d4+5 perfurante";
  - a CA "12 + dono.con.mod +" mostra o erro e não salva;
  - o 5º companheiro não pode ser criado;
  - tudo salva e recarrega igual;
  - em 375 px, o formulário não tem rolagem horizontal
- [x] 2.3 Ligar o estado de mesa no cartão:
  - dano e cura;
  - PV temporário;
  - dados de vida;
  - círculo com − e +;
  - usos;
  - condições com o resumo;
  - "Caído" com 0 PV;
  - "Ver bloco" com o bloco completo.

  Verificar no navegador:
  - o Steed vai de CA 12 / PV 25 para CA 14 / PV 45 ao trocar o círculo de 2 para 4 em Jogar, e não desce abaixo de 2;
  - 12 de dano com 5 temporários dá 23/30;
  - marcar amedrontado no Hound não muda a faixa do dono;
  - o descanso longo restaura o Hound e mantém a condição;
  - a ficha compartilhada mostra os companheiros sem controles;
  - sem companheiros, a seção some em Jogar e aparece em Editar;
  - em 1280 px, a seção fica entre os atributos e o painel de fontes;
  - em 375 px, o cartão não tem rolagem horizontal

## 3. Descrição da ação e "Sem atributo"

- [x] 3.1 Acrescentar `description` às ações (H9), com `migrateSourceV10ToV11` em `SOURCE_MIGRATIONS[10]` e a aplicação em `migrateV10ToV11`. Levar a descrição na `ActionLine`. Testes:
  - uma descrição com 501 caracteres é recusada;
  - uma ficha do formato 10 com ações fica com `description: ""` e os mesmos valores;
  - `migrateSource` de uma fonte do formato 10 com ações devolve a fonte no 11;
  - a linha da ação leva a descrição.

  Acrescentar a `src/server/compendium/service.int.test.ts` o caso de uma entrada do formato 10 com ações lida no 11. Atualizar o README (passo 10 das fontes). Verificar que `npm test` e `npm run test:int` passam
- [x] 3.2 Mostrar a descrição no cartão Ataques, no cartão do companheiro, no resumo do cartão da fonte e no `EntrySummary`, e editá-la no `ActionsEditor`. Renomear "Nenhum" para "Sem atributo" e pôr a opção no topo da lista. Verificar no navegador:
  - a Mordida do Hound montada com "Sem atributo" mostra +6;
  - a descrição aparece abaixo da linha e salva e recarrega igual;
  - 501 caracteres mostram o erro e não salvam;
  - em 375 px, o cartão com a descrição não tem rolagem horizontal

## 4. Fechamento

- [x] 4.1 Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build`, `npm run format:check` e `openspec validate --all` e verificar que todos passam
