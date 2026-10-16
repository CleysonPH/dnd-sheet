# Tasks

## 1. Formato e motor

- [x] 1.1 Criar `src/engine/traits/keys.ts` com `DAMAGE_TYPES`, `CONDITIONS`, `ACTIVE_CONDITIONS`, `ARMOR_PROFICIENCIES` e `WEAPON_CATEGORIES`. Acrescentar à ficha `proficiencies`, `defenses`, `conditions` e `exhaustion`, e `value` aos efeitos, no formato 9, com `migrateV8ToV9` (T2). Testes:
  - ficha nova com tudo vazio e Exaustão 0;
  - migração do formato 8 com uma fonte com efeitos, que ganham `value: ""`;
  - um documento do formato 1 chegando ao 9;
  - etiqueta repetida com maiúsculas diferentes, a 31ª etiqueta, etiqueta de 51 caracteres e tipo de dano repetido recusados pelo schema.

  Atualizar o README (formato 9). Verificar que `npm test` passa
- [x] 1.2 Criar a operação `grant` e os alvos de proficiência, idioma e defesa, com a validação do `value` (T1). Testes:
  - `operationsFor` dá só `grant` para os alvos novos, e os numéricos não aceitam `grant`;
  - `grant` em `proficiency.armor` com `heavy` é válido, e com `pesada` não;
  - `grant` em `language` com texto vazio é recusado;
  - um efeito `add` com `value` qualquer continua válido.

  Verificar que `npm test` passa
- [x] 1.3 Criar `deriveTraits` e `untrainedArmor` em `src/engine/traits/` (T3, T5). Testes:
  - Thorin com Leve e Média e o talento que concede Pesada: as três, com Pesada vinda do talento;
  - o anel de resistência a fogo desequipado some da lista, e a resistência marcada na ficha fica;
  - "Anão" na ficha e "anão" num traço viram um item com duas origens;
  - Elara com uma "Cota de Malha" pesada equipada, sem treinamento, gera o aviso, e com Pesada concedida não gera;
  - um escudo ativo sem `shield` gera o aviso.

  Verificar que `npm test` passa
- [x] 1.4 Aplicar a Exaustão no `deriveStats` e no `spellcastingFor` (T4). Testes:
  - Thorin com DES 14 e Exaustão 1: Furtividade +0, com a parcela "Exaustão 1" −2;
  - Percepção +4 com Exaustão 1: Percepção +2 e passiva 14;
  - Percepção com valor manual: a passiva usa o manual;
  - Elara, INT 16, nível 3, com Exaustão 2: ataque +1 e CD 13, e uma magia com atributo próprio também perde 4 no ataque;
  - deslocamento 9 com Exaustão 2: 6, e deslocamento 3 com Exaustão 3: 0, com a parcela −3;
  - iniciativa e salvaguardas com a parcela;
  - com Exaustão 0, nenhuma parcela.

  Verificar que `npm test` passa
- [x] 1.5 Reduzir a Exaustão em 1 no `longRest`, sem mexer nas condições (T8). Testes: Exaustão 2 e envenenado: Exaustão 1 e envenenado, e Exaustão 0 continua 0. Acrescentar a `src/server/sheets/service.int.test.ts` o caso de salvar uma ficha do formato 9 com proficiências, defesas, condições, Exaustão e um efeito `grant`. Verificar que `npm test` e `npm run test:int` passam

## 2. Ficha na tela

- [x] 2.1 Criar a faixa de condições entre a faixa de topo e a grade (T6, T7):
  - "+ Condição" com as condições que faltam, chips com "×" e o resumo da regra;
  - Exaustão com `−` e `+`;
  - o aviso de Exaustão 6.

  Verificar no navegador:
  - marcar envenenado e subir a Exaustão em Jogar salva e não muda os números (exceto pela Exaustão);
  - Furtividade, iniciativa e deslocamento mostram a parcela na origem;
  - a Exaustão 6 mostra o aviso;
  - o descanso longo reduz a Exaustão em 1
- [x] 2.2 Criar os cartões Proficiências e Defesas abaixo de Recursos (T3, T7, T9):
  - caixas, etiquetas com `<datalist>` de sugestões, as listas de dano e de condições;
  - os itens concedidos com a origem e sem remover;
  - o estado leitura com listas vazias ocultas.

  Verificar no navegador:
  - em Editar, marcar Leve e acrescentar "Élfico" salva;
  - "élfico" repetido é recusado;
  - em Jogar, um cartão sem nada não aparece;
  - em 375 px, a ordem é topo, condições, Recursos, Defesas, Proficiências e atributos, sem rolagem horizontal;
  - em 1280 px, a coluna da direita empilha os três cartões
- [x] 2.3 Acrescentar ao editor de efeitos os alvos novos (grupos "Proficiências" e "Defesas"):
  - o campo de valor (seleção nas listas fechadas, texto com sugestões nas livres) e o resumo ("Idioma: Élfico", "Resistência a fogo", "Proficiência: armadura pesada");
  - o aviso de armadura sem treinamento junto da CA (T1, T5).

  Verificar no navegador:
  - o talento "Treinamento com Armadura Pesada", com conceder Pesada, marca a caixa de Pesada desabilitada, com a origem;
  - Elara com "Cota de Malha" equipada mostra o aviso, e a CA continua a mesma;
  - desequipar a cota tira o aviso
- [x] 2.4 Na ficha compartilhada, mostrar os cartões e a faixa só para leitura (T7). Verificar numa aba anônima: com idioma e resistência, os cartões aparecem sem controles; sem condições e com Exaustão 0, a faixa não aparece; com envenenado, aparece só o chip, sem "×" e sem "+"

## 3. Fechamento

- [x] 3.1 Atualizar o README (proficiências, defesas, condições, Exaustão e a operação "conceder"). Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check` e verificar que todos passam
