# Proposal

## Why

Hoje só o dono abre uma ficha: nem o Mestre consegue ver o personagem de um jogador sem pedir um print. Um link de leitura resolve isso. O jogador gera o link e manda no grupo da mesa, e quem tiver o endereço vê a ficha atual, sem conta e sem poder alterar nada.

## What Changes

- **Link de compartilhamento**: o dono pode gerar um link por ficha, copiá-lo, desativá-lo e gerar um novo, que invalida o anterior. As fichas começam sem link.
- **Página pública da ficha**: `/compartilhada/<token>` abre sem sessão.
  - Mostra a versão salva mais recente da ficha, ao vivo, só para leitura, com a origem dos valores.
  - Não mostra nenhum dado do jogador e pede aos buscadores que não a indexem.
- **Link que não vale mais**: um link desativado, trocado, de ficha excluída ou de dono com a conta desativada responde "não encontrado".
- **Banco**: a tabela `sheet` ganha a coluna `share_token`, nula e única, com uma migração do Drizzle.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `character-sheets`:
  - **Fichas restritas ao dono**: passa a ter a exceção da leitura pelo link ativo.
  - Novos requisitos: link de compartilhamento, ficha compartilhada e link que não vale mais.
- `authentication`:
  - **Páginas protegidas exigem sessão**: a página da ficha compartilhada também abre sem sessão.

## Impact

- **Banco**: `src/server/db/sheet-schema.ts` com a coluna `share_token`, e uma migração nova em `drizzle/`.
- **Servidor**: em `src/server/sheets/`, as ações do dono para gerar, trocar e desativar o link, e a leitura pública pelo token. `getSheet` passa a devolver o token ao dono.
- **Proxy**: libera `/compartilhada/` sem sessão.
- **Interface**:
  - o corpo da ficha sai do `SheetEditor` e é reaproveitado pela página pública;
  - novo modo de leitura, que esconde os controles que alteram a ficha;
  - seção "Compartilhar" na ficha do dono.
- **Rota nova**: `src/app/compartilhada/[token]/page.tsx`, fora do grupo `(app)`, porque não exige sessão.
