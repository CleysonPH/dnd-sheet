# D&D Sheet

Ficha online de personagem para D&D 5.5e (regras de 2024), de uso interno nas mesas do grupo.

As decisões de produto e de arquitetura estão em `openspec/changes/dnd-sheet-architecture/`.

## Stack

- Next.js 16.4 (App Router, TypeScript, Tailwind)
- Postgres 18 com Drizzle ORM
- Better Auth (login por e-mail e senha, sessões no banco)
- Vitest, ESLint e Prettier
- Docker (imagem `standalone` para produção)

## Pré-requisitos

- Node.js 24 (mínimo 20.9)
- npm
- Docker com Compose

## Desenvolvimento

```bash
cp .env.example .env      # ajuste BETTER_AUTH_SECRET e as variáveis SEED_ADMIN_*
npm install
docker compose up -d db   # sobe o Postgres em localhost:5432
npm run db:migrate        # cria as tabelas
npm run db:seed           # cria o primeiro admin
npm run dev               # http://localhost:3000
```

Entre com o e-mail e a senha de `SEED_ADMIN_*`. No primeiro login o admin precisa trocar a senha. Não existe cadastro público: as outras contas são criadas pelo admin em **Contas**.

### Variáveis de ambiente

| Variável                                                     | Uso                                                                              |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `DATABASE_URL`                                               | Conexão da aplicação com o Postgres                                              |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`          | Credenciais do Postgres do Compose                                               |
| `BETTER_AUTH_SECRET`                                         | Assina os cookies de sessão; no mínimo 32 caracteres (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL`                                            | URL pública da aplicação                                                         |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Usadas só por `npm run db:seed`; podem ser removidas depois                      |

| Comando                 | O que faz                                    |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento                  |
| `npm run build`         | Build de produção                            |
| `npm run lint`          | ESLint                                       |
| `npm run typecheck`     | Gera os tipos do Next e roda `tsc`           |
| `npm test`              | Testes unitários (Vitest)                    |
| `npm run test:watch`    | Testes em modo watch                         |
| `npm run test:int`      | Testes de integração (precisa do banco)      |
| `npm run db:migrate`    | Aplica as migrações pendentes                |
| `npm run db:generate`   | Gera uma migração a partir do schema         |
| `npm run db:seed`       | Cria o primeiro admin (`SEED_ADMIN_*`)       |
| `npm run auth:generate` | Regenera o schema das tabelas do Better Auth |
| `npm run format`        | Formata o código com Prettier                |
| `npm run format:check`  | Verifica a formatação sem alterar arquivo    |

Os testes de integração usam um banco separado, `dnd_sheet_test`, no mesmo Postgres. Ele é criado e migrado automaticamente; basta o `db` estar rodando.

Para parar o banco: `docker compose down`. Os dados ficam no volume `db-data`; `docker compose down -v` apaga esse volume.

## Estrutura

```
src/
  app/          rotas do Next (UI e route handlers)
  components/   componentes React reutilizáveis
    sheet/      a ficha na tela: modos Jogar/Editar, blocos, override e autosave
  engine/       motor de cálculo da ficha: TypeScript puro
    sheet/      formato do documento da ficha (schema, versão, migrações)
    stats/      regras do 5.5e, valores derivados (com override), dano e cura
    sources/    fontes da ficha: talentos, traços, itens e magias (schema e regras)
    effects/    efeitos das fontes: alvos, operações, expressões e efeitos ativos
    resources/  trackers, espaços de magia e descansos curto e longo
  server/       código só de servidor
    auth/       configuração do Better Auth, guards e troca de senha
    accounts/   administração de contas e seed do primeiro admin
    sheets/     fichas: listar, criar, abrir, salvar (com versão) e excluir
    db/         cliente Drizzle e schema
  lib/          utilitários compartilhados (ex.: env.ts)
  proxy.ts      redirecionamentos de login e troca de senha
drizzle/        migrações SQL geradas (versionadas)
scripts/        comandos de operação (seed, config da CLI do Better Auth)
```

Rotas principais: `/` (Minhas fichas), `/fichas/[id]` (ficha com salvamento automático), `/conta`, `/admin/contas` (só admins), `/login` e `/trocar-senha`.

A ficha é um documento JSON versionado (`schemaVersion`, hoje no formato 5). O documento guarda só entradas: atributos, proficiências, dado de vida, dano sofrido, deslocamento, valores manuais (`overrides`) e as fontes (`sources`: talentos, traços, itens e magias, cada uma com id próprio, seus efeitos e trackers) e os espaços de magia e de pacto. Modificadores, perícias, PV máximo e os demais valores derivados são recalculados no navegador por `deriveStats` (`src/engine/stats/derive.ts`) e nunca são gravados. Ao mudar o formato em `src/engine/sheet/document.ts`, incremente `SHEET_SCHEMA_VERSION` e acrescente a migração correspondente em `src/engine/sheet/migrate.ts`, com teste.

A ficha tem dois modos. Jogar mostra os números para leitura e só deixa mexer no que muda na mesa (dano e cura, PV temporário, dados de vida e testes contra a morte). Editar mostra todos os campos e os valores manuais. Dano, cura e a regra que zera os testes contra a morte ao sair de 0 PV ficam em `src/engine/stats/hit-points.ts`.

Cada fonte pode ter efeitos (`src/engine/effects/`): um alvo da lista fechada, uma operação (somar, base alternativa de CA, definir, proficiência), um valor e as condições "só sem armadura" e "só sem escudo". Os efeitos valem enquanto a fonte está ativa: talentos e traços sempre, itens quando ativos e magias quando marcadas como em efeito. O valor é uma expressão com inteiros, `+ - * /` (divisão para baixo), parênteses, `min(...)`, `max(...)` e as variáveis `for`…`car`, `for.mod`…`car.mod`, `nivel` e `pb`, interpretada por um parser próprio em `src/engine/effects/expression.ts`. `deriveStats` aplica os efeitos antes do valor manual, calcula a CA (maior base válida + escudo + bônus), ignora e sinaliza efeitos de atributos em ciclo e devolve as contribuições de cada valor, mostradas no painel de origem.

Os recursos (`src/engine/resources/`) guardam o "usado", como o PV guarda o dano: o atual é o máximo menos o usado. O máximo de cada tracker é uma expressão com a mesma gramática dos efeitos. Cada tracker tem uma regra para o descanso curto e outra para o longo: não recupera, recupera tudo ou recupera uma quantidade (expressão), como a Inspiração de Bardo, que recupera 1 no curto e tudo no longo. O cartão Recursos, abaixo da faixa de topo, gasta e recupera trackers e espaços de magia e faz os descansos: o curto aplica a regra de descanso curto de cada tracker e recupera a Magia de Pacto; o longo aplica a regra de descanso longo, recupera todos os espaços, leva o PV ao máximo, zera o PV temporário, recupera os dados de vida e zera os testes contra a morte.

As descrições das fontes aceitam um Markdown básico (parágrafos, quebras de linha, `**negrito**`, `*itálico*` e listas com `- ` ou `1. `), interpretado por `src/lib/markdown.ts` e exibido por `src/components/markdown.tsx` como elementos React, sem HTML.

O tema é escuro por padrão, com uma chave para o claro guardada no `localStorage` (`dnd-sheet:theme`) e aplicada por um script no `<head>` antes da primeira pintura. As cores são tokens em `src/app/globals.css` (`bg-surface`, `border-line`, `text-muted`, `bg-accent`...); não use cores avulsas nem `dark:`. Em dev, o loader do Tailwind não relê o `globals.css` editado: reinicie o `npm run dev` depois de mexer nele.

O `src/engine/` não pode importar React, Next, APIs do Node, `src/server/`, `src/app/` nem `src/components/`. O ESLint barra esses imports.

## Imagem de produção

Para testar localmente a mesma imagem que vai para a VPS:

```bash
docker compose --profile prod up --build   # http://localhost:3000
```

Os serviços `migrate` e `app` só sobem com o profile `prod`. O `migrate` aplica as migrações e, se `SEED_ADMIN_EMAIL` estiver definida, roda o seed; o `app` só inicia depois que ele termina com sucesso.
