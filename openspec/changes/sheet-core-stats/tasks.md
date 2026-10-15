# Tasks

## 1. Regras e formato do documento

- [ ] 1.1 Criar `src/engine/stats/keys.ts` com as chaves dos atributos, das 18 perícias (com o atributo de cada uma), a tabela do bônus de proficiência, os dados de vida válidos e a lista fechada `DERIVED_KEYS` (S2), com um teste unitário que confere as 18 perícias e seus atributos contra a spec; verificar que `npm test` passa e que `npm run lint` não acusa importações proibidas em `src/engine/`
- [ ] 1.2 Levar `src/engine/sheet/document.ts` ao formato 2 (S1): `SHEET_SCHEMA_VERSION = 2`, campos `abilities`, `savingThrows`, `skills`, `hitPoints`, `deathSaves`, `speed` e `overrides` (gerado de `DERIVED_KEYS`), e `createSheetDocument` com os valores iniciais da spec; atualizar os testes com os limites de cada campo novo, chave faltando ou sobrando, override com chave desconhecida ou não inteiro e deslocamento com duas casas decimais; verificar que `npm test` passa
- [ ] 1.3 Acrescentar a migração real `v1ToV2` em `src/engine/sheet/migrate.ts`, com os valores iniciais escritos literalmente (S5), e testes que migram um documento do formato 1 mantendo a identificação; verificar que `npm test` passa, inclusive o teste de que as migrações cobrem todas as versões
- [ ] 1.4 Ajustar os testes de integração de `src/server/sheets/service.int.test.ts` ao formato 2 e acrescentar os casos de salvar com overrides e de recusar override com chave desconhecida (S9); verificar que `npm run test:int` passa

## 2. Motor de cálculo

- [ ] 2.1 Implementar `deriveStats` em `src/engine/stats/derive.ts` para modificadores, bônus de proficiência, salvaguardas, perícias, iniciativa e percepção passiva, com `resolve(chave, calculado)` aplicando overrides por nó (S4), e testes unitários com Thorin e Elara, a tabela do PB por nível e os extremos de modificador da spec; verificar que `npm test` passa
- [ ] 2.2 Acrescentar a `deriveStats` o PV máximo (mínimo 1 por nível), o PV atual a partir do dano (S3), o total e os disponíveis de dados de vida, com testes para Thorin (55), Elara (24), CON 1 (2), CON 16 -> 18 (60), subir de nível ferido (40/55 -> 50/65), máximo abaixo do dano (0) e ficha migrada do nível 5 (28); verificar que `npm test` passa
- [ ] 2.3 Testar a propagação de overrides: modificador manual de DES afetando Acrobacia e Iniciativa, Percepção manual afetando a passiva, PV máximo manual afetando o PV atual (46/61) e override que permanece quando o calculado muda (Furtividade +9, calculado +7 -> +8); verificar que `npm test` passa

## 3. Componentes de edição

- [ ] 3.1 Criar os parsers puros (inteiro em intervalo, decimal com uma casa aceitando vírgula ou ponto, inteiro com sinal) e o componente `NumberField` com rascunho em foco e `onCommit` só para valores válidos (S6), com testes unitários dos parsers; verificar que `npm test`, `npm run typecheck` e `npm run lint` passam
- [ ] 3.2 Criar o componente `DerivedValue` com o painel embutido de override (valor calculado, "Valor manual", "Aplicar", "Usar calculado"), destaque visual e `aria-label` para valores manuais, um painel aberto por vez (S7); verificar que `npm run typecheck` e `npm run lint` passam
- [ ] 3.3 Criar `src/components/sheet/labels.ts` com os rótulos em português dos atributos, perícias e valores derivados; verificar que o tipo exige um rótulo para cada chave de `keys.ts` (`npm run typecheck`)

## 4. Ficha na tela

- [ ] 4.1 Reorganizar `SheetEditor` em seções (S8): `identity-section` com o cabeçalho atual usando `NumberField` no nível, e o cálculo de `deriveStats` com `useMemo` passado às seções; verificar no navegador que o cabeçalho continua editável, que nível 21 e nome vazio mostram erro sem salvar, e que o autosave chega a "Salvo"
- [ ] 4.2 Criar `abilities-section` (6 atributos com modificador e salvaguardas com checkbox de proficiência) e `skills-section` (18 perícias com o botão de nível de proficiência e o bônus); verificar no navegador os números de Thorin da spec (modificadores, salvaguardas FOR +6/CON +6, Atletismo +6, Percepção +4) e a expertise de Elara (Furtividade +7)
- [ ] 4.3 Criar `combat-section` com PV atual/máximo/temporário, seletor de dado de vida, dados de vida com "Gastar"/"Recuperar", testes contra a morte com "Limpar", PB, iniciativa, deslocamento e percepção passiva; verificar no navegador Thorin com 55 PV, dano para 40, subir ao nível 6 (50/65), PV atual 60 recusado, dados de vida 3/5 d12 e testes contra a morte mantidos após reabrir
- [ ] 4.4 Aplicar o layout responsivo (S8): ordem do DOM combate, atributos, perícias; `grid-template-areas` em três colunas a partir de `lg`; layout `(app)` em `max-w-6xl` com as páginas de lista, conta e admin envolvidas em `max-w-4xl`; verificar no navegador a ficha a 375 px (uma coluna, sem rolagem horizontal) e a 1280 px (três colunas), e que lista, conta e admin mantêm a aparência
- [ ] 4.5 Verificar no navegador o override de ponta a ponta: PV máximo manual 61 em Thorin (sinalizado, calculado 55 visível, mantido após reabrir), remoção voltando a 55, modificador manual de DES mudando Iniciativa e Acrobacia, e "abc" recusado no valor manual
- [ ] 4.6 Verificar no navegador que as fichas antigas do banco de dev (Grog e Elara, no formato 1) abrem com a identificação mantida e os valores iniciais, e que o próximo salvamento as grava no formato 2

## 5. Verificação final

- [ ] 5.1 Atualizar o README (estrutura de `src/engine/stats` e formato 2 do documento) e rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check`; verificar que todos passam
