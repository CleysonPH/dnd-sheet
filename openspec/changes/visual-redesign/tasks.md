# Tasks

## 1. Tema e componentes base

- [ ] 1.1 Definir em `src/app/globals.css` os tokens de cor do tema escuro (padrão) e do claro (`[data-theme="light"]`), com `color-scheme`, o mapeamento em `@theme inline` e a fonte Geist no `body` no lugar do `Arial`, removendo o `@media (prefers-color-scheme)` (V1); verificar no CSS servido que os tokens existem e, no navegador, que a página aparece escura com o sistema no claro
- [ ] 1.2 Acrescentar o script inline no `<head>` de `src/app/layout.tsx`, com `suppressHydrationWarning` no `<html>`, e o componente `ThemeToggle` com os ícones sol/lua trocados por CSS (V2), além de `src/components/icons.tsx` (V7); verificar no navegador que a chave alterna o tema na hora, que a escolha sobrevive a recarregar sem piscar e que não há aviso de hidratação vindo do app
- [ ] 1.3 Reescrever `src/components/form.tsx` com os tokens (`Button` com `primary`, `secondary` e `danger`; `TextField`; `FormMessage`) e criar `Card` e `Badge` (V6), removendo os `dark:` desses componentes; verificar que `npm run typecheck` e `npm run lint` passam e que o login continua funcionando no navegador

## 2. Páginas fora da ficha

- [ ] 2.1 Refazer o cabeçalho do layout `(app)`, com marca, links, usuário, chave de tema e "Sair", e o `AuthCard` das telas de login e troca de senha, com a chave de tema (V6); verificar no navegador as duas telas e o cabeçalho nos dois temas, e que a preferência escolhida no login vale depois de entrar
- [ ] 2.2 Refazer "Minhas fichas" como grade de cartões com badge de nível e o formulário "Nova ficha" num `Card` (V6); verificar no navegador, nos dois temas, a lista com fichas, a lista vazia e a criação de uma ficha
- [ ] 2.3 Refazer "Minha conta", "Contas" (admin, com `Badge` de papel e estado) e "não encontrado" com `Card`, trocando todos os `dark:` restantes fora da ficha pelos tokens (V6); verificar no navegador as três páginas nos dois temas e que `grep -r "dark:" src/app` não encontra nada

## 3. Regras de PV e modo inicial

- [ ] 3.1 Implementar `applyDamage`, `applyHealing` e `normalizeDeathSaves` em `src/engine/stats/hit-points.ts` (V3), com testes unitários para cada cenário numérico da spec: temporário absorvendo 7 (40/55 temp 5 -> 38/55 temp 0), dano 100 (-> 0/55), cura 20 limitada (38 -> 55, temp mantido), dano com máximo manual (61 -> 51), cura a partir de 0 com máximo abaixo do dano, e zerar os testes ao curar e ao subir de nível com 0 PV (0/55 -> 10/65); verificar que `npm test` passa
- [ ] 3.2 Implementar `initialSheetMode` em `src/components/sheet/mode.ts` e o schema da quantidade de dano e cura (1 a 999), com testes unitários (todos os atributos 10 -> editar; algum diferente -> jogar; quantidade 0, -5, "abc" e 1000 recusadas); verificar que `npm test` passa

## 4. Ficha

- [ ] 4.1 Acrescentar ao `SheetEditor` o estado de modo, o `SheetModeContext`, a chave `[Jogar | Editar]` no cabeçalho da ficha e a normalização dos testes contra a morte em toda edição (V3, V4); fazer o `DerivedValue` virar texto em Jogar e o painel de exclusão aparecer só em Editar; verificar no navegador que Thorin abre em Jogar, uma ficha nova abre em Editar e trocar de modo não altera o indicador "Salvo"
- [ ] 4.2 Criar `AbilityBlock` com emblema, salvaguarda e perícias do atributo, nas formas de leitura e edição, e a grade de atributos (1, 2 e 3 colunas) no lugar de `abilities-section` e `skills-section` (V5); verificar no navegador, nos dois modos, o bloco de Destreza de Thorin (14, +2, salvaguarda +2, Acrobacia, Furtividade e Prestidigitação +2) e que em Editar o valor, a salvaguarda e as perícias continuam alteráveis
- [ ] 4.3 Criar a faixa de topo com os valores de combate (CA "—", iniciativa, deslocamento, percepção passiva, PB), o cartão de PV com quantidade, "Dano" e "Cura", e o cartão de dados de vida com os testes contra a morte só com 0 PV, no lugar de `combat-section` (V5); verificar no navegador os cenários da spec: 40/55 temp 5 com 7 de dano -> 38/55 temp 0; 100 de dano -> 0/55 com os testes aparecendo; marcar 2 sucessos e 1 falha e curar 4 -> 4/55 com os testes sumindo e voltando zerados; quantidade "abc" recusada
- [ ] 4.4 Aplicar o layout com `grid-template-areas` (V5) e remover a `.sheet-grid` antiga e os `dark:` restantes da ficha; verificar no navegador a ficha a 375 px (PV visível sem rolar, sem rolagem horizontal) e a 1280 px (faixa de topo numa linha, atributos em 3x2), nos dois temas e nos dois modos, e que `grep -r "dark:" src` não encontra nada

## 5. Verificação final

- [ ] 5.1 Atualizar o README (tema, modos da ficha e `src/engine/stats/hit-points.ts`) e rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check`; verificar que todos passam
