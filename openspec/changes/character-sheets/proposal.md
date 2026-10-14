# Proposal

## Why

Com contas e login prontos (specs `authentication` e `account-management`), falta o objeto central da aplicação: a ficha. Antes de qualquer cálculo de D&D, cada usuário precisa ter as próprias fichas guardadas no servidor, acessíveis de qualquer dispositivo, salvas sem botão "Salvar" e protegidas contra um dispositivo sobrescrever o que o outro fez. Esta change implementa as decisões D2 e D9 de `dnd-sheet-architecture` e dá a base sobre a qual `sheet-core-stats`, `sheet-sources`, `sheet-effects` e `sheet-resources` vão construir.

## What Changes

- A página inicial vira a lista "Minhas fichas", com as fichas do usuário logado, ordenadas pela última alteração.
- Criar uma ficha informando o nome do personagem; ela abre em seguida.
- Página da ficha com o cabeçalho de identificação: nome, espécie, classe, nível (1 a 20) e antecedente.
- Salvamento automático alguns segundos depois da última edição, com indicador de estado ("Salvando…", "Salvo", "Não salvo").
- Detecção de conflito entre dispositivos: se a ficha foi salva em outro lugar desde que foi aberta, o salvamento é recusado, a edição é bloqueada e o usuário recarrega a versão mais nova.
- Exclusão definitiva de uma ficha, com confirmação digitando o nome do personagem.
- Cada usuário só vê e altera as próprias fichas; isso vale também para admins.
- Formato da ficha versionado (`schemaVersion`), com migração de fichas antigas ao abrir, e validação do documento no servidor antes de salvar.

Fora do escopo: atributos, perícias e qualquer cálculo (`sheet-core-stats`), feats, itens e magias (`sheet-sources`), lixeira, duplicar ficha, exportar/importar JSON, compartilhamento e edição colaborativa em tempo real.

## Capabilities

### New Capabilities

- `character-sheets`: ciclo de vida das fichas de um usuário (listar, criar, abrir, editar o cabeçalho, excluir), isolamento por dono, salvamento automático, conflito de versão entre dispositivos e o formato versionado do documento.

### Modified Capabilities

Nenhuma. A spec `authentication` já exige sessão válida e sem troca de senha pendente em todas as páginas e operações, o que passa a valer para as fichas sem mudar requisitos.

## Impact

- Nova tabela `sheet` no Postgres (dono, nome, versão, documento JSONB, datas), com migração Drizzle.
- Novo módulo `src/engine/sheet/` com o formato do documento (schema Zod, valores iniciais e migrações de versão), sem dependências de React ou Next.
- Novo `src/server/sheets/` com as operações de ficha, sempre filtradas pelo dono da sessão.
- Novas rotas: `/` (lista, substitui a página provisória) e `/fichas/[id]`.
- Nenhuma dependência nova.
