# Tasks

## 1. Formato e regras

- [ ] 1.1 Criar o schema de tracker e de espaços em `src/engine/resources/schema.ts` e levar o documento ao formato 5 (`trackers` nas fontes, `spellSlots` com 9 círculos e `pactSlots`) com a migração 4 → 5 (R1); testes de máximo inválido, ids repetidos, 11 trackers, limites dos espaços e da migração; verificar que `npm test` passa e que `npm run lint` não acusa importações proibidas em `src/engine/`
- [ ] 1.2 Implementar `resolveTrackers`, `spend` e `recover` em `src/engine/resources/trackers.ts` (R2), com testes de Inspiração 3 (CAR 16), 1 (CAR 8), 3 de 4 ao subir o CAR, máximo negativo, divisão por zero e os limites; verificar que `npm test` passa
- [ ] 1.3 Implementar `shortRest` e `longRest` em `src/engine/resources/rest.ts` (R2), com testes de Kai (Pontos de Foco recarregam, espaços normais não), pacto no descanso curto, Thorin no descanso longo (55/55, temporário 0, 5/5 dados, Fúria 3/3, testes contra a morte zerados) e tracker sem recarga mantido; verificar que `npm test` passa
- [ ] 1.4 Acrescentar a `src/server/sheets/service.int.test.ts` os casos de salvar uma ficha com trackers e espaços e de recusar tracker com máximo inválido; verificar que `npm run test:int` passa

## 2. Ficha na tela

- [ ] 2.1 Extrair o `ExpressionField` do editor de efeitos para um componente comum e criar o editor de trackers no `SourceForm`, com as etiquetas de tracker no cartão da fonte (R4); verificar no navegador o tracker "Inspiração" com máximo `max(1, car.mod)` mostrando 3, `max(1, carisma)` recusado e o limite de 10
- [ ] 2.2 Criar o cartão Recursos entre a faixa de topo e os atributos, com trackers (gastar e recuperar), espaços de magia e de pacto (máximo editável só em Editar, círculos vazios escondidos em Jogar) (R3); verificar no navegador Ária 3 → 2 de 3 e 3 de 4 ao subir o CAR, Zane com 4 e 2 espaços gastando um do 1º círculo, e o pacto de um bruxo
- [ ] 2.3 Acrescentar os botões de descanso curto e longo com confirmação embutida (R3); verificar no navegador o descanso curto de Kai (Foco 3/3, espaços de 1º mantidos), o pacto recarregando, o descanso longo de Thorin (55/55, temporário 0, 5/5 dados, Fúria 3/3), o tracker sem recarga mantido e o cancelamento sem mudanças
- [ ] 2.4 Verificar no navegador que em Jogar os recursos e os descansos funcionam e o máximo dos espaços não é editável, e o layout a 375 px e a 1280 px nos dois temas

## 3. Verificação final

- [ ] 3.1 Atualizar o README (formato 5, `src/engine/resources/` e os descansos) e rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check`; verificar que todos passam

## 4. Recarga por tipo de descanso

- [ ] 4.1 Trocar `recharge` por `shortRest` e `longRest` (`mode` none/all/amount e `amount` por expressão) no schema do tracker, e fazer `shortRest`/`longRest` aplicarem a regra de cada descanso com `rechargeUsed` (R1, R2); testes da Inspiração (curto: 0/3 → 1/3; longo: 3/3), quantidade limitada ao máximo, Pontos de Foco no curto, Fúria de Thorin no longo, tracker que não recarrega e quantidade inválida recusada; verificar que `npm test` e `npm run test:int` passam
- [ ] 4.2 Trocar no editor de trackers o `<select>` de recarga pelas duas regras (curto e longo) com o campo de quantidade, e mostrar as regras no cartão Recursos (R4); converter a ficha de teste Ária do banco de dev; verificar no navegador a Inspiração "curto: 1, longo: tudo" com 0/3 → 1/3 no descanso curto e 3/3 no longo, e "Cargas" sem recarga mantida
- [ ] 4.3 Atualizar o README e rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check`; verificar que todos passam

## 5. Recursos ao lado dos atributos

- [ ] 5.1 A partir de `lg`, colocar os atributos em 2 colunas e 3 linhas à esquerda e o cartão Recursos à direita, mantendo a ordem do DOM (faixa de topo, Recursos, atributos) para o celular (R3); verificar no navegador a 1280 px (Recursos à direita dos atributos 2x3) e a 375 px (Recursos entre a faixa de topo e os atributos, sem rolagem horizontal), nos dois temas, e rodar `npm run lint`, `npm run typecheck`, `npm test` e `npm run format:check`
