# Proposal

## Why

Cada jogador monta à mão os talentos, traços, itens e magias da própria ficha, com efeitos, trackers e expressões. É um trabalho repetido entre fichas da mesma mesa e fácil de errar. Um compêndio mantido pelo admin, com as fontes já configuradas, deixa o jogador buscar e adicionar uma "Bola de Fogo" ou um "Treinamento com Armadura Pesada" prontos. Depois de adicionar, ele continua livre para ajustar a cópia.

## What Changes

- **Compêndio**: uma lista de entradas, cada uma uma fonte completa (talento, traço, item ou magia, com descrição, efeitos e trackers), guardada no servidor e validada pelas mesmas regras das fontes da ficha.
- **Gestão pelo admin**: a página `/admin/compendio` para buscar, criar, editar e excluir entradas, com o mesmo editor de fonte da ficha.
- **"Enviar ao compêndio"**: em Editar, cada fonte da ficha de um admin ganha essa ação, que cria uma entrada nova a partir da fonte. Não substitui uma entrada existente.
- **Busca e adição pelo jogador**: em Editar, um painel "Compêndio" junto das fontes busca por nome (sem diferenciar maiúsculas nem acentos) e filtra por tipo. "Adicionar" (ou arrastar, no desktop) copia a entrada para a ficha, com um id novo e sem estado de mesa (trackers cheios, item desequipado, magia fora de efeito).
- **Cópia solta**: a ficha não guarda referência à entrada. Editar ou excluir uma entrada não muda as fichas, e editar a cópia não muda a entrada. O formato da ficha não muda.
- **Formato das entradas**: cada entrada guarda a versão do formato em que foi gravada e é levada ao formato atual ao ser lida.
- **Roadmap**: a decisão D2 e a proposta de `dnd-sheet-architecture`, que dizem que não há compêndio, são revistas.

## Capabilities

### New Capabilities

- `compendium`: as entradas do compêndio, a gestão pelo admin, o envio a partir da ficha, a busca e a adição à ficha como cópia independente.

### Modified Capabilities

Nenhuma. A criação de fontes na ficha, as regras das fontes e os modos não mudam: a entrada copiada vira uma fonte comum.

## Impact

- **Banco**: a tabela `compendium_entry` (migração 0004).
- **Servidor**: um serviço `src/server/compendium/`, com "só admin escreve, todo usuário logado lê", e as actions.
- **Motor**:
  - a função que copia uma fonte para a ficha, zerando o estado de mesa;
  - a normalização do nome para a busca;
  - as migrações por fonte, usadas pela ficha e pelo compêndio.
- **Interface**:
  - a página `/admin/compendio` e o link "Compêndio" no menu do admin;
  - o painel de busca na aba de fontes;
  - a ação "Enviar ao compêndio" no cartão da fonte;
  - o editor de fonte, reaproveitado fora da ficha.
- **Roadmap**: `openspec/changes/dnd-sheet-architecture/` (D2 e proposta).
