# Design

## Context

- **Magias**: a magia (`kind: "spell"`) já tem `concentration` (a marcação C) e `active` ("em efeito"). Os efeitos de uma magia só valem enquanto ela está em efeito, porque `deriveStats` ignora fontes inativas.
- **Edição das fontes**: na aba Magias, toda alteração de uma fonte passa por `patchSource` (`sources-panel.tsx`), que aplica um patch com `update((current) => …)`. O botão "Em efeito" do cartão e a caixa "Concentração" do formulário usam esse caminho.
- **Dano**: o cartão de PV (`hit-points-card.tsx`) aplica o dano com `applyDamage` (`src/engine/stats/hit-points.ts`), uma função pura. Não há nenhum gancho depois do dano.
- **Salvaguarda**: a de Constituição já é calculada por `deriveStats` na chave `save.con`, com valor manual se houver.
- **Formato**: o documento está no formato 6.

Motivação: proposal.md. Comportamento: `specs/sheet-core-stats` e `specs/sheet-sources`.

## Goals / Non-Goals

**Goals:**
- Concentração sem estado próprio: tudo sai de `concentration` e `active` das magias.
- Regras puras e testáveis no motor. A interface só chama as regras e mostra o resultado.

**Non-Goals:**
- Rolar o teste de resistência. A ficha mostra a CD e o bônus, e o jogador rola na mesa.
- Concentração em magia que não está na ficha (descartado na exploração).
- Inspiração heroica automática no descanso longo para humanos.
- Guardar o aviso do teste entre recarregamentos da página.

## Decisions

### I1. Formato 7 com `heroicInspiration`

- `heroicInspiration: z.boolean()` no documento. `createSheetDocument` usa `false`, e `migrateV6ToV7` acrescenta `false`, escrito na própria migração, como nas anteriores.
- Os descansos não tocam no campo.

### I2. Regras de concentração em `src/engine/stats/concentration.ts`

Funções puras:
- `concentratingSpell(sources)`: a primeira magia, na ordem da ficha, com `concentration` e `active`, ou `null`. Numa ficha antiga com duas, mostra a primeira (spec).
- `endConcentration(document)`: tira de efeito todas as magias com `concentration`.
- `concentrationSaveDc(damage)`: `Math.min(30, Math.max(10, Math.floor(damage / 2)))`.
- `enforceSingleConcentration(sources, changedId)`: se a fonte alterada é uma magia com `concentration` e `active`, tira de efeito as outras magias com `concentration`. Nos outros casos, devolve a lista igual.

- **Por quê no motor de stats**: a concentração afeta o dano (I3) e os valores derivados, e o motor já concentra as regras puras da ficha.
- **Alternativa**: guardar a magia em concentração num campo do documento. Seria um estado duplicado, que pode discordar das magias.

### I3. `applyDamage` encerra a concentração ao chegar a 0 PV

- Depois de aplicar o dano, se o PV atual calculado é 0, `applyDamage` devolve o documento já passado por `endConcentration`.
- **Por quê**: qualquer caminho que aplique dano segue a regra, e não só o cartão de PV. Os testes de `hit-points.ts` cobrem o caso.

### I4. Aviso do teste no cartão de PV, como estado local

- Antes de aplicar o dano, o cartão lê `concentratingSpell` do documento atual.
  - Se havia concentração e, depois do dano, o PV atual é maior que 0, guarda o aviso `{ kind: "save", spell, dc, bonus }`. A CD vem de `concentrationSaveDc(quantidade)`, com a quantidade inteira, contando o que o PV temporário absorveu. O bônus vem de `stats.values["save.con"]`.
  - Se o PV chegou a 0, guarda `{ kind: "ended", spell }`.
- O aviso é um bloco `role="alert"` no próprio cartão.
  - Teste: "Manteve" fecha o aviso; "Perdeu" chama `update(endConcentration)` e fecha.
  - Encerrada: só "Ok".
  - Um dano novo substitui o aviso anterior.
- **Por quê local**: o aviso só serve no momento do dano. Gravar no documento criaria versões novas da ficha e sincronização entre abas sem nenhum ganho.
- **Alternativa**: um aviso no topo da ficha. Fica longe do botão de dano no celular, onde o cartão de PV já está no topo.

### I5. Interface do cartão de PV

- **Botão "Inspiração heroica"**: com `aria-pressed`, no estilo dos botões de alternar da ficha. Funciona em Jogar e em Editar.
- **Indicador de concentração**: aparece no cabeçalho do cartão, ao lado da inspiração, só quando há concentração. É um destaque preenchido na cor de acento, com um ponto pulsante, "Concentrando em <magia>" e o botão "Encerrar", que chama `update(endConcentration)`. *(Ajustado a pedido do usuário depois da primeira implementação: antes era uma linha no rodapé do cartão, discreta demais para a mesa.)*

### I6. Uma concentração por vez no `patchSource`

- `patchSource` passa a aplicar `enforceSingleConcentration(sources, id)` depois do patch. Isso cobre ligar o "em efeito" em Jogar e marcar "Concentração" no formulário de uma magia já em efeito em Editar.
- **Por quê não no schema**: recusar duas concentrações em efeito quebraria fichas antigas que já estão assim (spec "Ficha antiga com duas concentrações"). A regra vale nas ações, não no formato.

## Risks / Trade-offs

- **[A outra aba da ficha não vê o aviso]** → O aviso é de quem aplicou o dano. Os dados, como a magia que saiu de efeito, sincronizam normalmente pelo salvamento.
- **[O dano é aplicado de uma vez, mas no jogo cada fonte de dano pede um teste separado]** → A ficha recebe uma quantidade por vez. Quem sofre dano de duas fontes aplica duas vezes, e cada aplicação gera um aviso.
- **[O valor manual da salvaguarda de CON]** → O aviso usa o valor de `save.con`, que já respeita o valor manual. Ficha e aviso mostram o mesmo número.

## Migration Plan

Não há migração de banco. As fichas passam ao formato 7 ao serem lidas e são gravadas assim no próximo salvamento. Para voltar atrás, é preciso reverter o código antes que alguma ficha seja salva no formato 7.
