# Proposal

## Why

Hoje a ficha guarda só o cabeçalho de identificação (spec `character-sheets`), sem nenhum número de jogo. Para usar a aplicação na mesa, o jogador precisa ver os números que consulta a cada rodada: atributos, modificadores, perícias, salvaguardas, PV e dados de vida. E esses números precisam ser calculados para ele, não digitados. Esta change entrega o primeiro bloco do motor de cálculo (decisões D3 e D6 de `dnd-sheet-architecture`) e o layout definitivo da ficha, sobre o qual `sheet-sources`, `sheet-effects` e `sheet-resources` vão acrescentar suas seções.

## What Changes

- **Atributos**: os seis atributos (valores de 1 a 30), cada um com o modificador calculado.
- **Bônus de proficiência**: calculado pelo nível do personagem.
- **Salvaguardas**: proficiência marcável por atributo e bônus calculado.
- **Perícias**: as 18 perícias do 5.5e, cada uma com nível de proficiência (nenhuma, proficiente, expertise) e bônus calculado.
- **Valores derivados de combate**: Iniciativa (modificador de DES), Percepção passiva (10 + Percepção) e Deslocamento (valor base digitado, em metros).
- **Pontos de vida**:
  - O jogador escolhe o dado de vida (d6, d8, d10 ou d12).
  - O PV máximo é calculado pela média fixa do 5.5e.
  - Há PV atual e PV temporário.
- **Dados de vida**: o total é igual ao nível e o jogador marca os dados gastos e recuperados.
- **Testes contra a morte**: 3 sucessos e 3 falhas, marcáveis, com uma forma de limpar.
- **Override manual**: qualquer valor derivado pode ser substituído por um valor digitado. O valor manual fica sinalizado, mostra o valor calculado e pode ser removido para voltar ao cálculo. Os valores que dependem dele passam a usar o valor manual.
- **Layout da ficha**:
  - No celular, as seções ficam empilhadas numa coluna.
  - No desktop, a ficha tem colunas no estilo da ficha oficial: atributos e salvaguardas, perícias, e combate (PV, dados de vida, iniciativa, deslocamento, PB).
- **Formato da ficha**: passa ao formato 2, com migração automática das fichas do formato 1. Os novos campos recebem valores iniciais: atributos 10, sem proficiências, dado de vida d8, sem dano.

Fora do escopo:

- **CA e efeitos de fontes**: os efeitos de feats, itens e magias (ex.: "Pau para Toda Obra", talento Alerta) ficam em `sheet-effects`. A coluna de combate reserva o lugar da CA.
- **Recursos e descanso**: trackers e botões de descanso curto e longo, incluindo a recuperação automática de PV e de dados de vida, ficam em `sheet-resources`.
- **Outros**:
  - multiclasse (um único dado de vida; o override cobre o PV de quem tem mais de uma classe);
  - rolagem de dados;
  - botões de aplicar dano e cura;
  - geração de atributos (compra de pontos, rolagem).

## Capabilities

### New Capabilities

- `sheet-core-stats`: os números centrais da ficha e como cada um é calculado. Cobre atributos e modificadores, bônus de proficiência, salvaguardas, perícias, iniciativa, percepção passiva, deslocamento, PV (máximo, atual e temporário), dados de vida, testes contra a morte, o override manual de valores derivados e a organização da ficha na tela.

### Modified Capabilities

Nenhuma. As regras de `character-sheets` continuam valendo para os novos campos sem mudar requisitos: salvamento automático, conflito de versão, validação no servidor e conversão de fichas de formatos anteriores.

## Impact

- **`src/engine/sheet/document.ts`**: formato 2 do documento. Ganha os campos `abilities`, `savingThrows`, `skills`, `hitPoints`, `deathSaves`, `speed` e `overrides`.
- **`src/engine/sheet/migrate.ts`**: primeira migração real, do formato 1 para o 2.
- **Novo módulo puro de cálculo em `src/engine/`**: transforma o documento nos valores derivados, com override. Reaproveita `abilityModifier`.
- **`src/components/sheet/`**: o editor atual, que é só o formulário do cabeçalho, vira a ficha completa, dividida em seções e com campos numéricos reutilizáveis e o controle de override.
- **O que não muda**:
  - a tabela `sheet`, as operações do servidor e as rotas;
  - nenhuma dependência nova.
