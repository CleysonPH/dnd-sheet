# Design

## Context

- **Tabela `sheet`** (`src/server/db/sheet-schema.ts`): `id`, `owner_id`, `name`, `version`, `data` (o documento) e as datas.
- **Acesso**: toda leitura e escrita passa por `src/server/sheets/service.ts`, que exige sessão (`requireUser`) e filtra pelo dono (`ownedBy`). Uma ficha de outro usuário e uma inexistente dão o mesmo resultado (design C4 de `character-sheets`).
- **Proxy** (`src/proxy.ts`): sem sessão, só passam os caminhos exatos de `PUBLIC_PATHS` (`/login`, `/esqueci-senha` e `/redefinir-senha`). Com sessão, esses caminhos redirecionam para `/`, e a troca de senha pendente leva a `/trocar-senha`.
- **`SheetEditor`** (`src/components/sheet/sheet-editor.tsx`): junta o autosave, o modo (`"play" | "edit"`, num contexto lido por `useSheetMode`), o cálculo (`deriveStats`) e o corpo da ficha (faixa de topo, Recursos, atributos e fontes), mais o aviso de conflito e o "Excluir ficha".
  - Os componentes decidem pelo modo o que mostrar: os campos editáveis com `mode === "edit"`, e os controles de mesa (dano, dados de vida, recursos, descansos e ações das fontes) nos dois modos.
  - Tocar num valor derivado abre o painel de origem, com valor manual em Editar.

Motivação: proposal.md. Comportamento: `specs/character-sheets` e `specs/authentication`.

## Goals / Non-Goals

**Goals:**
- O mesmo corpo de ficha nas duas telas, sem duplicar componentes.
- A leitura pública num caminho de servidor separado, que nunca devolve o dono e não tem escrita.

**Non-Goals:**
- Atualização automática da página pública enquanto ela está aberta. O visitante recarrega.
- Prazo de validade do link, senha no link ou mais de um link por ficha.
- Lista de "fichas compartilhadas comigo" ou contador de acessos.

## Decisions

### L1. Coluna `share_token` e o código do link

- `shareToken: text("share_token").unique()`, nula por padrão, com uma migração gerada por `npm run db:generate`. A restrição de unicidade já cria o índice da busca pelo token.
- **Código**: `randomBytes(18).toString("base64url")`, com 24 caracteres e 144 bits aleatórios. Não deriva do `id` da ficha.
- **Por quê uma coluna**: cada ficha tem no máximo um link (spec), e desativar é só gravar `null`. Uma tabela à parte seria para vários links ou para histórico, que não estão no escopo.

### L2. Serviço

- **Ações do dono** em `src/server/sheets/share.ts`, todas com `requireUser` e `ownedBy`:
  - `enableShare(headers, id)`: devolve o token atual ou cria um;
  - `regenerateShare(headers, id)`: grava um token novo;
  - `disableShare(headers, id)`: grava `null`.

  As três devolvem `{ ok: true, token }` (com `token: null` ao desativar) ou `{ ok: false, error: "NOT_FOUND" }`. Gravar o token não muda `version` nem `updated_at`, porque não é uma edição da ficha.
- **`getSheet`** passa a devolver também `shareToken`, para a seção "Compartilhar".
- **`getSharedSheet(token)`**, sem sessão: faz o `select` de `data`, juntando `user` por `owner_id` e exigindo `share_token = token` e o dono não desativado (`banned` falso ou nulo). Devolve só `{ document }`, já migrado, ou `null`. Antes da consulta, um token fora do formato (24 caracteres base64url) já dá `null`.
- **Por quê funções separadas**: `getSheet` continua exigindo o dono. A leitura pública tem o próprio caminho, sem `id` nem dono na resposta, e por isso não há como vazá-los.

### L3. Proxy e rota

- O proxy ganha `isSharedPath(pathname)`, que é `pathname.startsWith("/compartilhada/")`.
  - Sem sessão, esse caminho passa.
  - Com sessão, também passa, sem o redirecionamento para `/` que os outros caminhos públicos têm.
  - A regra da troca de senha pendente continua valendo antes de tudo para quem está logado. Assim, o requisito "Troca de senha pendente bloqueia o acesso" não muda.
- **Rota** `src/app/compartilhada/[token]/page.tsx`, fora do grupo `(app)`, porque não usa o cabeçalho de quem está logado.
  - Chama `getSharedSheet` dentro de um `Suspense`, como `/fichas/[id]`, e responde `notFound()` quando a leitura dá `null`.
  - `metadata`: `robots: { index: false, follow: false }` e o título "Ficha compartilhada · Ficha D&D".
  - Um cabeçalho simples com a marca e o seletor de tema, sem links da área logada.

### L4. Corpo da ficha compartilhado e o modo `"view"`

- O corpo do `SheetEditor` (a faixa de topo, Recursos, atributos e `SourcesPanel`) passa para um componente `SheetBody` com `{ document, stats, update }`. O `SheetEditor` continua com o autosave, a troca de modo, o aviso de conflito, a exclusão e a seção "Compartilhar".
- O `SheetMode` ganha `"view"`. Um `SheetViewer` (client) calcula `deriveStats` e renderiza o título, o subtítulo e o `SheetBody` com `mode = "view"` e um `update` que não faz nada.
- **Componentes**: um helper `canAct(mode)`, que é `mode !== "view"`, esconde os controles que alteram a ficha. São eles:
  - no cartão de PV: dano, cura, quantidade, temporário editável, "Inspiração heroica" (no modo leitura vira etiqueta, se ligada) e o "Encerrar" da concentração;
  - nos dados de vida: gastar, recuperar e as caixas de testes contra a morte (que viram leitura);
  - em Recursos: os contadores e os descansos;
  - nas fontes: equipar, sintonizar, quantidade, preparar e "Em efeito" (que viram etiquetas do estado).

  O painel de origem abre normalmente, e o valor manual só aparece em Editar, como hoje.
- **Por quê um modo, e não `fieldset disabled`**: desabilitar tudo também travaria "Ver origem", as abas e os cartões expansíveis, que o visitante precisa usar. E botões que parecem clicáveis mas não fazem nada confundem.

### L5. Seção "Compartilhar" na ficha do dono

- Um componente `SharePanel`, abaixo do corpo, nos dois modos e escondido em conflito ou depois da exclusão, como o "Excluir ficha".
  - Sem link: o texto "Gere um link para qualquer pessoa ver esta ficha, sem poder alterar." e o botão "Gerar link".
  - Com link: o endereço completo (`window.location.origin` + `/compartilhada/<token>`) num campo só de leitura, "Copiar" (`navigator.clipboard`, com "Copiado!" por 2 segundos), "Gerar novo link" e "Desativar link".
- As ações são server actions em `src/app/(app)/fichas/[id]/actions.ts`, que chamam o serviço e devolvem o token. O estado do token fica no componente, a partir do `shareToken` inicial.

## Risks / Trade-offs

- **[O link vaza para alguém de fora da mesa]** → Quem tem o link só lê. O dono troca ou desativa o link a qualquer momento, e o código antigo para de funcionar na hora.
- **[O link aparece em buscadores]** → `noindex`/`nofollow` na página, e o link não fica em nenhuma página pública que um buscador encontre sozinho.
- **[Adivinhar códigos]** → 144 bits aleatórios. Também não há listagem nem resposta diferente para código inexistente e código desativado.
- **[Um componente novo esquece de esconder um controle no modo leitura]** → Mesmo que um controle apareça, o `update` do `SheetViewer` não faz nada e não há server action de escrita na página pública. A verificação no navegador percorre cada cartão.

## Migration Plan

- A migração acrescenta a coluna nula e o índice único, e as fichas existentes ficam sem link. Ela roda com `npm run db:migrate` em desenvolvimento e com o serviço `migrate` em produção.
- **Rollback**: reverter o código e, se preciso, remover a coluna com uma migração de volta. Os links simplesmente deixam de existir.
