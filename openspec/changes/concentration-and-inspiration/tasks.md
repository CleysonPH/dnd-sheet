# Tasks

## 1. Formato e regras

- [ ] 1.1 Acrescentar `heroicInspiration` ao documento, no formato 7, com `migrateV6ToV7` (I1). Testes: ficha nova sem inspiração, migração do formato 6 com `false` e um documento do formato 1 chegando ao 7 válido. Atualizar o README (formato 7). Verificar que `npm test` passa
- [ ] 1.2 Criar `src/engine/stats/concentration.ts` com `concentratingSpell`, `endConcentration`, `concentrationSaveDc` e `enforceSingleConcentration` (I2). Testes:
  - Escudo da Fé em efeito;
  - magia sem concentração ignorada;
  - duas concentrações na ordem da ficha;
  - encerrar tira as duas de efeito e a CA volta;
  - CD 10 para 14 de dano, 23 para 46 e 30 para 100;
  - trocar de Escudo da Fé para Bênção;
  - "Armadura Arcana" sem efeito na regra.

  Verificar que `npm test` passa
- [ ] 1.3 Fazer `applyDamage` encerrar a concentração quando o PV atual chega a 0 (I3). Testes:
  - Elara com 12 PV sofre 20 e a magia sai de efeito;
  - com 30 PV sofre 20 e a magia continua.

  Acrescentar a `src/server/sheets/service.int.test.ts` o caso de salvar uma ficha com inspiração heroica. Verificar que `npm test` e `npm run test:int` passam

## 2. Ficha na tela

- [ ] 2.1 Acrescentar ao cartão de PV o botão "Inspiração heroica" e a linha "Concentrando em …" com "Encerrar" (I5). Aplicar `enforceSingleConcentration` no `patchSource` (I6). Verificar no navegador:
  - a inspiração liga e desliga, em Jogar e em Editar, e continua depois de um descanso longo;
  - "Escudo da Fé" em efeito mostra a concentração e +2 na CA;
  - "Encerrar" tira a magia de efeito e a CA volta;
  - pôr "Bênção" em efeito encerra "Escudo da Fé";
  - "Armadura Arcana" não interfere
- [ ] 2.2 Acrescentar ao cartão de PV o aviso do teste depois do dano, com "Manteve" e "Perdeu", e o aviso de concentração encerrada a 0 PV (I4). Verificar no navegador:
  - 14 de dano mostra "CD 10 (+2)";
  - 46 de dano mostra CD 23;
  - 8 de dano absorvidos pelo PV temporário ainda mostram o teste;
  - "Manteve" mantém a magia, e "Perdeu" a encerra e a CA volta;
  - cair a 0 PV encerra a concentração com o aviso;
  - sem concentração, nenhum aviso.

  Conferir a 375 px e nos dois temas
- [ ] 2.3 Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check` e verificar que todos passam
