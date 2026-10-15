# Design

## Context

O que já existe (changes `project-setup` e `account-management`, arquivadas):

- Next.js 16.4 com `cacheComponents`: páginas protegidas leem a sessão num componente assíncrono dentro de `<Suspense>` e chamam `getPageSession()` (`src/server/auth/page.ts`).
- Guards `requireUser`/`requireAdmin` em `src/server/auth/guards.ts`, que recebem os headers explicitamente e lançam `AuthError`. As server actions traduzem o erro com o padrão `withAuth` de `src/app/(app)/admin/contas/actions.ts`.
- Drizzle + Postgres, migrações em `drizzle/`, schema reexportado por `src/server/db/schema.ts`.
- Testes de integração (`*.int.test.ts`) contra `dnd_sheet_test`, com helpers `resetDatabase`, `createTestUser` e `signIn`.
- `src/engine/` é TypeScript puro; o ESLint barra React, Next, APIs do Node e as outras camadas.
- A página inicial `src/app/(app)/page.tsx` é provisória e anuncia que vira a lista de fichas.

Decisões de produto: D2 (documento JSON) e D9 (autosave e conflito) de `dnd-sheet-architecture`. Comportamento: `specs/character-sheets`.

## Goals / Non-Goals

**Goals:**
- Um modelo de persistência que as próximas capacidades da ficha usem sem mudar a tabela: elas só acrescentam campos ao documento.
- Formato do documento definido num lugar só, usado pelo cliente (formulário) e pelo servidor (validação).
- Autosave previsível, testável fora do navegador, que nunca sobrescreve silenciosamente o que outro dispositivo salvou.

**Non-Goals:**
- Merge automático de conflitos ou edição colaborativa em tempo real.
- Funcionar offline (salvar localmente e sincronizar depois). Uma falha de rede só mantém os dados na tela e tenta de novo.
- Layout definitivo da ficha: a página tem só o cabeçalho, num formulário simples. O layout real é decidido em `sheet-core-stats`.

## Decisions

### C1. Tabela `sheet`, com o documento em JSONB

```
  sheet
    id          text  PK  (crypto.randomUUID)
    owner_id    text  FK -> user.id  (on delete cascade), indexado
    name        text      cópia de identity.name, para listar e ordenar
    version     int       começa em 1, +1 a cada salvamento
    data        jsonb     o documento da ficha (C2)
    created_at  timestamptz
    updated_at  timestamptz  ordena a lista
```

- A lista lê `name`, `updated_at` e só o trecho `data->'identity'` do documento, então não traz o documento inteiro mesmo quando ele crescer (magias, itens).
- **Por quê só `name` como coluna**: D2 pede duplicar em coluna os campos de listagem. O nome é o único usado para ordenar ou buscar; os demais vêm do `data->'identity'`, sem custo de manter várias cópias sincronizadas.
- **Alternativa**: colunas para espécie, classe e nível. Rejeitado: mais pontos de dessincronização, para ganho nenhum com poucos registros por usuário.
- `on delete cascade` não tem efeito prático hoje (contas não são excluídas), mas evita fichas órfãs se isso mudar.

### C2. Formato do documento em `src/engine/sheet/`

```ts
// formato 1
{
  schemaVersion: 1,
  identity: {
    name: string        // 1..100, sem espaços nas pontas
    species: string     // 0..100
    class: string       // 0..100
    level: number       // inteiro 1..20
    background: string  // 0..100
  }
}
```

- Schema Zod **estrito** (rejeita campos desconhecidos), valores iniciais `createSheetDocument(name)` e o tipo `SheetDocument`, todos em `src/engine/sheet/document.ts`. Zod é TypeScript puro, então cabe na regra do `engine`.
- O mesmo schema valida os campos no formulário (C5) e o documento no servidor (C4), de modo que o cliente nunca envia algo que o servidor vai recusar, exceto em adulteração.
- O campo de classe se chama `class` no documento (é só uma chave JSON); no TypeScript ele é acessado como `identity.class`, o que é válido.

### C3. Migração de formato ao carregar

```
  documento do banco --> migrateSheetDocument(raw)
                           |  lê raw.schemaVersion (ausente = erro)
                           |  aplica migrations[v] para v = versão .. ATUAL-1
                           v
                         valida com o schema atual --> SheetDocument
```

- `migrations` é uma lista de funções puras `(doc da versão v) -> doc da versão v+1`. Hoje está vazia (formato 1 é o primeiro). A função de migração recebe a lista como parâmetro, para que os testes exercitem o mecanismo com migrações sintéticas antes de existir uma real.
- A migração acontece ao **ler** (no servidor, antes de entregar a ficha à página). O banco só é atualizado no próximo salvamento, que já grava no formato atual (spec "Fichas de versões anteriores continuam abrindo").
- Documento com versão maior que a atual (aplicação antiga lendo dado novo) ou sem `schemaVersion` gera erro explícito, e a página mostra uma mensagem de erro em vez de dados inventados.

### C4. Operações de ficha no servidor e concorrência otimista

`src/server/sheets/service.ts`, no mesmo estilo de `src/server/accounts/service.ts` (headers explícitos, `requireUser`, resultados tipados):

| Função                                      | Resultado                                              |
| ------------------------------------------- | ------------------------------------------------------ |
| `listSheets(headers)`                       | resumos do dono, por `updated_at` desc                 |
| `createSheet(headers, { name })`            | `{ ok, id }` ou erro de validação                      |
| `getSheet(headers, id)`                     | `{ id, version, document }` migrado, ou `null`         |
| `saveSheet(headers, id, { baseVersion, document })` | `saved(version)`, `conflict`, `not_found` ou `invalid` |
| `deleteSheet(headers, id, { confirmName })` | `deleted`, `not_found` ou `confirmation_mismatch`      |

- **Dono em toda consulta**: toda leitura e escrita filtra por `id` **e** `owner_id = sessão`. Ficha de outro usuário e ficha inexistente dão o mesmo resultado (`null`/`not_found`), sem revelar que existe (spec "Fichas restritas ao dono"). Não há exceção para admin.
- **Salvamento atômico**:
  ```sql
  update sheet set data = $doc, name = $name, version = version + 1, updated_at = now()
  where id = $id and owner_id = $owner and version = $baseVersion
  returning version
  ```
  Nenhuma linha afetada: uma segunda consulta (`id` + dono) distingue `conflict` (a ficha existe com outra versão) de `not_found`. Não há janela entre ler e gravar.
- **Validação antes de gravar**: o tamanho (`TextEncoder` sobre o JSON, limite de 256 KB) e o schema estrito do formato atual. Falhou, `invalid`, sem tocar o banco.
- **Alternativa**: `updated_at` como token de versão. Rejeitado: timestamps colidem e são menos legíveis em testes que um inteiro.
- A confirmação de exclusão também é checada no servidor (`confirmName` igual ao nome guardado), não só no formulário.

### C5. Autosave no cliente: máquina de estados pura + hook

```
              edição                     pausa de 1,5 s
   [salvo] ----------> [pendente] ---------------------> [salvando]
      ^                    ^  edição durante o envio:        |
      |                    +--- volta a pendente ao fim -----+
      |    saved(v)                                          |
      +------------------------------------------------------+
      |                                                      |
      |        erro de rede/servidor                         |
      |   [não salvo] <--------------------------------------+
      |      | nova tentativa em 2s, 4s, 8s ... até 30s      |
      |      +---------------------> [salvando]              |
      |                                                      |
      |        conflict                       not_found      |
      |   [conflito] <---------------------------------------+---> [excluída]
      |      edição bloqueada, botão "Recarregar"                 edição bloqueada
```

- A lógica de estados é uma função pura (`reducer`) em `src/components/sheet/autosave.ts`, testada com Vitest, sem React. O hook `useSheetAutosave` só liga o reducer a timers e à server action.
- **Um salvamento por vez**: edições feitas durante um envio são acumuladas e enviadas logo depois, com a versão devolvida pelo envio anterior. Assim nunca há dois envios concorrentes da mesma aba, que gerariam um conflito consigo mesma.
- **Pausa de 1,5 s** de debounce, com um teto: se a pessoa não parar de digitar, envia de qualquer jeito a cada 5 s, cumprindo a spec ("em até 5 segundos").
- **Campos inválidos não entram no documento**: o formulário guarda o texto digitado, valida o campo com o schema de C2 e só atualiza o documento quando o valor é válido. O erro aparece no campo (spec "Editar o cabeçalho").
- **Aviso ao sair**: um listener `beforeunload` fica ativo enquanto o estado for pendente, salvando ou não salvo.
- **Recarregar** após conflito usa `router.refresh()`, que busca a versão nova no servidor e reinicia o estado.

### C6. Rotas e telas

```
  /              "Minhas fichas": lista (C1) + formulário "Nova ficha" (nome)
  /fichas/[id]   cabeçalho editável, indicador de salvamento, "Excluir ficha"
```

- Criar é uma server action que valida o nome, cria e redireciona para `/fichas/[id]`.
- A página da ficha carrega `getSheet` num componente dentro de `<Suspense>` e passa `{ id, version, document }` ao formulário cliente. `null` vira `notFound()`.
- "Excluir ficha" abre um painel na própria página (sem `window.confirm`) com um campo para digitar o nome e o botão de confirmar, que só fica ativo quando o texto confere. Depois de excluir, volta para `/`.
- Fichas de outros usuários respondem 404 pela própria página, já que a consulta filtra pelo dono. Não precisa de regra no `proxy.ts`. *(Se o `notFound()` dentro de `<Suspense>` chegar com status 200, como aconteceu em `/admin/contas`, a resposta de "não encontrado" continua sem dados da ficha, que é o que a spec exige. Ver Riscos.)*

### C7. Testes

- **Unitários**: schema do documento (limites de cada campo, campos desconhecidos), `createSheetDocument`, `migrateSheetDocument` com migrações sintéticas (v1 -> v2 -> v3, versão futura, sem versão) e o reducer de autosave (debounce, teto de 5 s, edição durante envio, backoff, conflito, excluída).
- **Integração** (`src/server/sheets/service.int.test.ts`): cada cenário de servidor da spec, incluindo o acesso de outro usuário e de um admin, o conflito com a versão antiga, salvar depois de excluir, conteúdo inválido, documento de 300 KB e ordenação da lista.
- **Navegador**: criar, editar e ver "Salvo"; abrir a mesma ficha em duas abas para provocar o conflito; excluir com confirmação certa e errada; abrir ficha de outro usuário. O aviso de `beforeunload` é conferido checando que o listener está registrado, sem disparar o diálogo, que bloquearia a automação.

## Risks / Trade-offs

- [Perda das últimas alterações num conflito] -> Por decisão do usuário, só existe "Recarregar". A janela é pequena (o autosave envia em até 5 s), e o aviso explica o que aconteceu.
- [Aba esquecida aberta gera conflito ao voltar a editar] -> É o comportamento desejado: a aba antiga não pode sobrescrever o que foi feito depois.
- [`notFound()` dentro de `<Suspense>` responder com status 200] -> A página continua sem dados da ficha. Se for preciso o status 404, aplicar a mesma solução de `/admin/contas` (checagem antes do streaming), ao custo de uma consulta a mais.
- [Documento cresce com as próximas capacidades e encosta nos 256 KB] -> 256 KB é muito para texto de ficha; o limite fica numa constante e pode subir junto com `serverActions.bodySizeLimit` (padrão 1 MB).
- [Esquecer de escrever a migração ao mudar o formato] -> Toda change que alterar o schema do documento precisa incrementar `schemaVersion` e acrescentar uma migração com teste. Isso fica num comentário junto da constante da versão.
- [Datas da lista são formatadas no servidor com o fuso do processo; o container de produção roda em UTC e mostraria a hora 3 horas adiantada] -> *(Encontrado na implementação.)* Em desenvolvimento o fuso é o da máquina e está certo. Resolver na change `deployment` (definir `TZ` no container) ou formatando com um `timeZone` fixo.
- [Erro permanente (ex.: `invalid` por bug) virar retentativa infinita] -> `invalid` não é retentado: a ficha mostra "Não salvo: dados inválidos" e para de tentar, já que repetir não resolve.

## Migration Plan

- Nova migração Drizzle cria a tabela `sheet`. Não há dados a converter.
- Rollback: voltar o código; a tabela nova pode ficar ou ser removida sem afetar contas.

## Open Questions

- Nenhuma que bloqueie. O layout definitivo da página da ficha será decidido em `sheet-core-stats`.
