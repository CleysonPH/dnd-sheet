# Design

## Context

- **Fontes** (`src/engine/sources/`):
  - `sourceSchema` valida talento, traço, item e magia, com `effects` e `trackers`;
  - `createSource(kind, name, id)` cria uma fonte nova;
  - os ids de efeitos e trackers só precisam ser únicos dentro da fonte, e o id da fonte, dentro da ficha.
- **Estado de mesa dentro da fonte**:
  - `trackers[].used`;
  - `equipped` e `attuned` nos itens;
  - `active` nas magias.

  `quantity` e `preparation` são configuração do jogador e ficam como estão.
- **Migrações** (`src/engine/sheet/migrate.ts`): trabalham sobre a ficha inteira. Várias delas mexem só nas fontes (3→4, 4→5, 5→6, 7→8, 8→9).
- **Editor de fonte**: o `SourceForm` recebe `source`, `variables` e `onChange` e não depende da ficha. As `variables` servem só para a pré-visualização das expressões.
- **Servidor**:
  - os serviços em `src/server/<área>/service.ts` usam `requireUser` ou `requireAdmin` e devolvem resultados tipados;
  - as actions traduzem `AuthError` em navegação;
  - a área de contas responde "não encontrado" a quem não é admin.
- **Banco**: Drizzle, migrações SQL geradas em `drizzle/` (a última é a 0003) e aplicadas no deploy pelo `vercel-build`.

Motivação: proposal.md. Comportamento: `specs/compendium`.

## Goals / Non-Goals

**Goals:**
- Reaproveitar o formato, a validação e o editor das fontes, sem um segundo modelo de dados.
- A ficha continua autocontida: a cópia não guarda referência e o formato da ficha não muda.
- Um caminho único para levar fontes de formatos antigos ao atual, na ficha e no compêndio.

**Non-Goals:**
- Avisar sobre versões novas de uma entrada já copiada, ou atualizar a cópia.
- Importar conteúdo pronto (SRD) ou deixar jogadores sugerirem entradas.
- Edição simultânea por dois admins com detecção de conflito. Vale a última gravação (ver Riscos).
- Busca no texto da descrição. Só o nome.

## Decisions

### B1. Tabela `compendium_entry`

```
compendium_entry(
  id             text primary key (uuid),
  kind           text not null,          -- feat | trait | item | spell
  name           text not null,          -- cópia de data.name, para listar
  search_name    text not null,          -- nome normalizado (B4)
  schema_version integer not null,       -- formato em que data foi gravado (B2)
  data           jsonb not null,         -- a fonte inteira, sem estado de mesa
  created_by     text references user(id) on delete set null,
  created_at, updated_at timestamptz
)
index (search_name)
```

- **Por quê** uma linha por entrada com a fonte em JSONB: é o mesmo padrão da ficha (C1/D2). O formato da fonte evolui sem migração de banco, e `name`/`kind` ficam em colunas só para listar e filtrar.
- **Limite**: 2000 entradas, conferido no serviço antes de inserir.
- **Alternativa**: tabelas por tipo de fonte. Rejeitada pelo mesmo motivo da D2.

### B2. Migrações por fonte

- Um `SOURCE_MIGRATIONS` em `src/engine/sources/migrate.ts`, indexado pela versão de origem, com funções `(source) => source`.
- A partir de agora, uma mudança de formato que mexe nas fontes:
  - define o passo ali;
  - a migração da ficha daquela versão aplica o passo a cada fonte.
- `migrateSource(data, version)` aplica os passos de `version` até a atual e valida com `sourceSchema`. O serviço do compêndio usa a função ao ler cada entrada e regrava a entrada no formato atual quando ela é salva.
- **Por quê** não refatorar as migrações antigas: as entradas só existem a partir do formato 9, então os passos de 3→4 a 8→9 nunca vão ser aplicados a elas. Basta o mecanismo daqui para frente.
- **Teste**: um passo sintético (como os de `migrate.test.ts`) mostra que uma entrada da versão anterior é lida já migrada.
- **Alternativas**:
  - embrulhar a entrada numa ficha falsa e rodar a migração da ficha (improviso, depende de campos de ficha);
  - migrar as entradas no banco a cada deploy (fácil de esquecer).

### B3. Cópia sem estado de mesa

- **Função**: `withoutTableState(source)` em `src/engine/sources/rules.ts` zera:
  - `trackers[].used`;
  - `equipped` e `attuned` dos itens;
  - `active` das magias.

  `quantity` e `preparation` são mantidos.
- **Usos**:
  - `copyToSheet(entry, id)` aplica a função e troca o id;
  - "Enviar ao compêndio" aplica a função antes de gravar a entrada.
- **Na ficha**: a adição passa pelo `update` do editor, como criar uma fonte, então salva pelo autosave. Com `MAX_SOURCES` atingido, a interface recusa antes e mostra o aviso.

### B4. Busca

- **Normalização**: `searchKey(text)`, em `src/engine/sources/search.ts`, faz `normalize("NFD")`, remove os diacríticos, passa a minúsculas e apara os espaços. A coluna `search_name` guarda `searchKey(name)`.
- **Consulta**: `search_name LIKE '%' || searchKey(q) || '%'`, com `%`, `_` e `\` escapados, filtro opcional por `kind`, `ORDER BY name` e `LIMIT 50`.
- **Por quê** normalizar no JS: evita a extensão `unaccent` no Postgres local e no Neon, e o mesmo `searchKey` serve para a etiqueta "já na ficha", no cliente.
- **Resultado**: cada resultado traz a entrada inteira (já migrada). Isso dá o resumo e a cópia sem uma segunda ida ao servidor. São 50 resultados de poucos KB cada.

### B5. Serviço e actions

`src/server/compendium/service.ts`:

| Função | Guarda | Resultado |
|---|---|---|
| `searchEntries(h, { query, kinds })` | `requireUser` | entradas |
| `createEntry(h, { kind, name })` | `requireAdmin` | `{ ok, id }` ou erro de nome ou de limite |
| `saveEntry(h, id, source)` | `requireAdmin` | `saved`, `not_found` ou `invalid` (schema ou tipo trocado) |
| `deleteEntry(h, id)` | `requireAdmin` | `deleted` ou `not_found` |
| `sendToCompendium(h, source)` | `requireAdmin` | `{ ok, id }` ou `invalid` ou limite |

- O dado recebido do cliente é sempre validado com `sourceSchema` e passa por `withoutTableState` antes de gravar.
- As actions ficam num arquivo só, `src/app/(app)/compendium-actions.ts`, usado pela página do admin e pela ficha. *(Ajustado na implementação: o plano era separá-las entre `admin/compendio/actions.ts` e as actions da ficha, mas a busca é a mesma nos dois lugares.)*

### B6. Página do admin

- **Rota**: `/admin/compendio`, com `notFound()` para quem não é admin, como em `/admin/contas`. O menu ganha "Compêndio" ao lado de "Contas", só para admins. *(Ajustado na implementação: com o link novo, o menu do admin passava de 375 px. No celular, os links ficaram mais estreitos e "Minha conta" virou "Conta".)*
- **Conteúdo**:
  - a busca e o filtro por tipo;
  - a lista de resultados com o resumo;
  - "Nova entrada" (tipo + nome).
- **Edição**: abrir uma entrada mostra o `SourceForm` com o estado local e os botões "Salvar" e "Excluir" (com confirmação na própria linha). Não há autosave: são poucas edições e explícitas.
- **Variáveis**: `deriveStats(createSheetDocument("Exemplo")).variables`, a ficha nova pedida pela spec.

### B7. Painel na ficha e "Enviar ao compêndio"

- **Botão "Compêndio"**: no cabeçalho do painel de fontes, só em Editar. Ele abre o painel de busca:
  - no desktop, ao lado da lista da aba;
  - no celular, acima dela.
- **Filtro inicial** pela aba: Características filtra talento e traço, Inventário filtra item, Magias filtra magia.
- **Busca**: digitar dispara uma action com atraso de 300 ms. Uma busca vazia lista as primeiras 50 entradas do filtro.
- **Arrastar**: os resultados são `draggable`, com o id da entrada no `dataTransfer`, e a lista da aba aceita soltar. O dado vem dos resultados já carregados. O botão "Adicionar" é o caminho acessível e o único no celular.
- **Admin na ficha**:
  - a página da ficha passa `isAdmin` ao editor, num contexto como o do modo;
  - o cartão da fonte mostra "Enviar ao compêndio" em Editar, com o retorno "Enviada ao compêndio" ou o erro.

### B8. Roadmap

- **D2** em `dnd-sheet-architecture/design.md`: ganha o registro de que existe um compêndio de *modelos*, copiados para a ficha sem ligação. A ficha continua autocontida.
- **Proposta** do roadmap: a frase "Não existe compêndio nem reaproveitamento de conteúdo entre fichas" passa a refletir isso.

## Risks / Trade-offs

- **[Dois admins editando a mesma entrada: vale a última gravação]** → Com um ou dois admins por mesa, o risco é baixo. Se virar problema, a entrada ganha `version` como a ficha.
- **[Arrastar não é acessível por teclado nem funciona no celular]** → O botão "Adicionar" faz o mesmo e é o caminho principal.
- **[Uma mudança futura no formato das fontes sem o passo em `SOURCE_MIGRATIONS` quebra a leitura das entradas]** → O README registra a regra, junto da regra de incrementar `SHEET_SCHEMA_VERSION`. Se o passo faltar, a leitura falha alto (`sourceSchema` recusa a entrada), e não em silêncio, e o teste de integração do compêndio, com uma entrada salva, quebra.
- **[Entradas grandes nos resultados]** → No máximo 50, e a descrição tem no máximo 5000 caracteres.

## Migration Plan

1. Migração 0004 (`compendium_entry`), gerada pelo `drizzle-kit` e aplicada no deploy pelo `vercel-build`, como as anteriores.
2. **Rollback**: um deploy anterior ignora a tabela nova. Ela pode ficar no banco sem efeito.
