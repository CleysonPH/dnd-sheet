# Tasks

## 1. Formato e cálculo

- [x] 1.1 Acrescentar `spellcastingAbility` à ficha e `castingAbility` às magias, no formato 8, com `migrateV7ToV8` (K1). Testes: ficha nova sem atributo, magia nova com `"sheet"`, migração do formato 7 e um documento do formato 1 chegando ao 8. Atualizar o README (formato 8). Verificar que `npm test` passa
- [x] 1.2 Criar os alvos `spellSaveDc` e `spellAttack`, só com "somar", e a variável `conj.mod`, com a detecção de ciclos (K4). Testes:
  - `conj.mod` vale 3 para CAR 16 com conjuração CAR, e 0 sem atributo;
  - "somar `conj.mod` em INT", com conjuração INT, é detectado como ciclo;
  - `operationsFor` dá só "somar" para os alvos novos.

  Verificar que `npm test` passa
- [x] 1.3 Calcular `spellSaveDc` e `spellAttack` no `deriveStats` e criar `spellcastingFor` (K2, K3). Testes:
  - Ária com CAR 16 e nível 5: CD 14 e +6;
  - com o Bastão do Pacto sintonizado: 15 e +7, com a origem listando 8, CAR, proficiência e o bastão;
  - com o modificador de CAR manual +4: CD 15;
  - com o valor manual 16 na CD: 16, com o calculado 14;
  - "Passo Nebuloso" com INT 12: CD 12 e +4, e com o bastão, 13 e +5.

  Acrescentar a `src/server/sheets/service.int.test.ts` o caso de salvar uma ficha com atributo de conjuração e uma magia com atributo próprio. Verificar que `npm test` e `npm run test:int` passam

## 2. Ficha na tela

- [x] 2.1 Acrescentar o seletor "Atributo de conjuração" e o resumo no topo da aba Magias, e os quadros "CD de magia" e "Ataque mágico" no cartão Combate, com origem e valor manual (K5). Verificar no navegador:
  - Ária com Carisma mostra CD 14 e +6 nos dois lugares;
  - "Ver origem" lista as partes;
  - o valor manual 16 aparece sinalizado;
  - sem atributo, os quadros e o resumo somem
- [x] 2.2 Acrescentar o "Atributo" ao formulário da magia, a etiqueta "INT · CD 12 · +4" ao cartão, os alvos novos ao editor de efeitos e `conj.mod` à ajuda das expressões (K4, K5). Verificar no navegador:
  - "Passo Nebuloso" com Inteligência mostra a etiqueta, e as outras magias não;
  - o "Bastão do Pacto" sintonizado, com os dois efeitos, sobe a ficha para 15 e +7 e a magia para 13 e +5;
  - um tracker com `max(1, conj.mod)` mostra 3.

  Conferir a 375 px e nos dois temas
- [x] 2.3 Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check` e verificar que todos passam
