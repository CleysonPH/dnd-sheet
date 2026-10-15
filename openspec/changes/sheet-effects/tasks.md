# Tasks

## 1. Expressões e formato

- [x] 1.1 Implementar `parseExpression`, `evaluate` e `referencedAbilities` em `src/engine/effects/expression.ts` (E4), com testes de precedência, unário, `min`/`max`, divisão para baixo, divisão por zero, `nivel`/`nível`, `for.mod` e as mensagens de erro (incompleta, variável desconhecida, símbolo inesperado, parênteses); verificar que `npm test` passa e que `npm run lint` não acusa importações proibidas em `src/engine/`
- [x] 1.2 Criar `src/engine/effects/targets.ts` (alvos e `OPERATIONS_BY_TARGET`) e o schema de efeito, e levar o documento ao formato 4 (`effects` nas fontes, `armorType`/`armorBase`/`shieldBonus` nos itens, `active` nas magias, `armorClass` e `speed` em `DERIVED_KEYS`) com a migração 3 → 4 (E1, E2); atualizar os testes de schema (operação incompatível, expressão inválida, ids repetidos, 21 efeitos, limites de armadura e escudo) e de migração; verificar que `npm test` passa
- [x] 1.3 Acrescentar a `src/server/sheets/service.int.test.ts` os casos de salvar uma ficha com efeitos e de recusar efeito com operação incompatível ou expressão inválida; verificar que `npm run test:int` passa

## 2. Motor de efeitos

- [x] 2.1 Fazer `deriveStats` coletar os efeitos ativos (fonte ativa, magia em efeito, condições sem armadura/sem escudo) e aplicar os efeitos em atributos com ordem topológica e detecção de ciclos, registrando `issues` e `abilityScores` (E3, E5); testes de Manoplas (16 → 19, 20 → 20), ciclo FOR/DES, autorreferência e efeito com divisão por zero; verificar que `npm test` passa
- [x] 2.2 Aplicar somar e proficiência em salvaguardas, perícias, iniciativa, passiva, PV máximo e deslocamento (com definir), com as contribuições (E3, E5); testes de Alerta (+5), Robusto (65), Anel em todas as salvaguardas, deslocamento 12, Pau para Toda Obra e expertise de Elara (+7), e que os testes anteriores de `derive.test.ts` continuam passando; verificar que `npm test` passa
- [x] 2.3 Calcular a CA (bases, armadura leve/média/pesada, base alternativa com condições, escudo, somar, contribuições e não usados) (E3, E5); testes dos cenários de CA da spec (12, Bárbaro 15 e 17 com escudo, Cota de Malha 16, Couro Batido 14, Cota de Escamas 16, Monge 15 com e sem escudo, Armadura Arcana 13 → 16, composição da CA 18 e override 20 sobre 18); verificar que `npm test` passa

## 3. Ficha na tela

- [x] 3.1 Mostrar a CA e o deslocamento como valores calculados na faixa de topo, o valor final dos atributos (com "efetivo" em Editar) e o painel de contribuições: `OverridePanel` em Editar e `OriginPanel` só leitura em Jogar (E5, E6); verificar no navegador a CA 12 de uma ficha sem armadura, o painel de origem em Jogar sem campo de valor manual e o override 20 sobre a CA em Editar
- [x] 3.2 Acrescentar ao formulário de item o tipo e a CA base de armadura e o bônus de escudo, e às magias a ação de mesa "Em efeito" nos dois modos, com os resumos no cartão (E7); verificar no navegador a "Cota de Malha" pesada 16, o escudo começando em +2 e "Armadura Arcana" marcada como em efeito em Jogar
- [x] 3.3 Implementar o editor de efeitos no `SourceForm` (alvo agrupado, operação filtrada, expressão com pré-visualização e erro, proficiência, condições, remover, limite de 20) e as etiquetas de resumo e de problema no cartão (E7); verificar no navegador "+1 CA" no Anel de Proteção, a pré-visualização "= 15", `10 + des.mod +` e `10 + força` recusadas, PV máximo oferecendo só somar e o ciclo FOR/DES sinalizado
- [x] 3.4 Verificar no navegador os personagens de referência de ponta a ponta: Thorin com Defesa sem Armadura (15), escudo (17), Anel (18, com a composição no painel), Cota de Malha (16) e desequipar o anel; Kai, o Monge, com e sem escudo (15); Elara com Armadura Arcana em efeito (16); e o layout a 375 px e 1280 px nos dois temas

## 4. Verificação final

- [x] 4.1 Atualizar o README (formato 4, `src/engine/effects/` e a gramática das expressões) e rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check`; verificar que todos passam
