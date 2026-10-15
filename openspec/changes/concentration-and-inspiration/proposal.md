# Proposal

## Why

Na mesa, dois estados do personagem ficam hoje fora da ficha: a inspiração heroica e a concentração numa magia. A concentração pesa mais. Quem está concentrado e sofre dano precisa fazer uma salvaguarda de Constituição para não perder a magia, e esse teste costuma ser esquecido. Ao perder a concentração, os efeitos da magia também precisam sair da ficha. Hoje, por exemplo, um +2 de CA de Escudo da Fé continuaria valendo.

## What Changes

- **Inspiração heroica**: um botão que liga e desliga, gravado na ficha. Funciona em Jogar e em Editar e não muda com os descansos.
- **Concentração vinda das magias**: o personagem está concentrado na magia de concentração que está em efeito, e a ficha mostra "Concentrando em …" com a opção de encerrar. Encerrar tira a magia de efeito, e os efeitos dela saem junto.
- **Uma concentração por vez**: pôr em efeito uma magia de concentração tira de efeito a anterior.
- **Teste de concentração ao sofrer dano**: depois do dano, a ficha avisa o teste de resistência de Constituição, com a CD (metade do dano, no mínimo 10 e no máximo 30) e o bônus da salvaguarda. As opções são "Manteve" e "Perdeu", e "Perdeu" encerra a concentração.
- **0 PV encerra a concentração**: se o dano leva o PV atual a 0, a concentração termina sem teste.
- **Formato 7 da ficha**: guarda a inspiração heroica. A concentração não ganha campo, porque é calculada pelas magias.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `sheet-core-stats`:
  - **Modos Jogar e Editar**: a inspiração heroica e o encerramento da concentração passam a ser alteráveis em Jogar.
  - **Valores iniciais dos números da ficha**: as fichas começam sem inspiração heroica.
  - Novos requisitos: inspiração heroica, concentração, teste de concentração ao sofrer dano e concentração encerrada com 0 PV.
- `sheet-sources`: novo requisito "Uma concentração por vez".

## Impact

- **Motor**:
  - `src/engine/sheet/`: formato 7, com o campo `heroicInspiration` e a migração 6 → 7;
  - um módulo novo com a magia em concentração, a CD do teste, o encerramento e a regra de uma concentração por vez;
  - `applyDamage` passa a encerrar a concentração quando o PV chega a 0.
- **Interface**:
  - cartão de PV: o botão de inspiração, a linha de concentração e o aviso do teste;
  - aba Magias: pôr em efeito uma magia de concentração aplica a regra de uma por vez.
- **Dados**: as fichas existentes são migradas ao abrir. O banco não precisa de migração.
