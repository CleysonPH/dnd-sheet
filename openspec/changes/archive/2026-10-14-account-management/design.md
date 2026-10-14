# Design

## Context

O projeto tem a base da change `project-setup` (arquivada): Next.js 16.4 com App Router, `src/server/` marcado com `server-only`, `src/lib/env.ts` validando `DATABASE_URL` com Zod, Vitest em ambiente `node`, Postgres 18 via Compose e imagem `standalone`. Ainda não há biblioteca de banco, migrações nem telas além da página padrão.

Motivação e escopo: proposal.md. Comportamento: `specs/authentication` e `specs/account-management`.

## Goals / Non-Goals

**Goals:**
- Escolher e configurar a biblioteca de autenticação e a camada de banco que as próximas capacidades vão reutilizar.
- Concentrar as regras de conta (quem pode fazer o quê) em funções de servidor testáveis, sem depender da UI.
- Garantir a autorização no servidor; redirecionamentos na borda são só conveniência.

**Non-Goals:**
- Visual caprichado: as telas são funcionais e simples (Tailwind), e o visual da aplicação será definido nas changes da ficha.
- Testes E2E em navegador. A cobertura é por testes de integração das funções de servidor contra um Postgres real, mais um roteiro manual (ver tarefas). Playwright pode entrar quando houver a ficha.
- Deploy na VPS (change `deployment`). Esta change só deixa os comandos de migração e seed prontos para ela.

## Decisions

### A1. Better Auth com os plugins `admin` e `nextCookies`

- **Por quê**: cobre exatamente o que as specs pedem. E-mail e senha com hash seguro (scrypt), sessões no banco, cadastro desligável (`disableSignUp`), campo extra no usuário (`additionalFields`) e um plugin `admin` que cria usuários, bane e desbane (banir encerra as sessões e bloqueia o login), troca papéis e define senhas. Está na lista de bibliotecas recomendadas pela documentação do Next e tem integração documentada com o `proxy.ts` do Next 16.
- **Alternativas**:
  - Auth.js: o provider de credenciais é desencorajado pelo próprio projeto e não usa sessões no banco, o que complica encerrar as sessões ao desativar uma conta.
  - Implementação própria (`jose`/`iron-session` + hash): mais código sensível de segurança para manter, sem ganho.
- **Mapeamento**: "desativada" = `banned` do plugin admin; "admin" = `role: "admin"`; "troca pendente" = campo extra `mustChangePassword` (boolean, `input: false`, ou seja, o cliente não consegue definir).
- **Instância preguiçosa**: a configuração fica numa fábrica `createAuth()` (`src/server/auth/config.ts`, sem `server-only`), e a aplicação usa `getAuth()`, que cria a instância na primeira chamada. Assim o build continua funcionando sem `.env`, e a CLI do Better Auth carrega a mesma configuração por `scripts/auth-cli.ts` para gerar o schema (`npm run auth:generate`).

### A2. Drizzle ORM + `pg` + drizzle-kit

- O schema das tabelas do Better Auth é gerado pela CLI dele (`npx auth@latest generate`) num arquivo Drizzle em `src/server/db/`, e as migrações SQL são geradas pelo `drizzle-kit` numa pasta `drizzle/` versionada.
- **Por quê**: TypeScript de ponta a ponta, SQL previsível, sem engine binária, adaptador oficial do Better Auth e suporte a JSONB para as fichas (D2).
- **Alternativa**: Prisma. Mais pesado no build e no container (engine e geração de client), sem vantagem para este porte.
- Conexão por um `Pool` do `pg` único, criado de forma preguiçosa a partir de `getEnv().DATABASE_URL`.

### A3. Endpoints HTTP do admin desligados; ações de admin passam por funções nossas

```
  navegador                         servidor
  ---------                         --------
  login / logout  --- HTTP ------>  /api/auth/[...all]  (Better Auth, com rate limit)

  troca de senha  --- server action -->  src/server/auth/password.ts
  área de contas  --- server action -->  src/server/accounts/service.ts
                                           |  regras: requireAdmin, não agir sobre si,
                                           |  gerar senha provisória, marcar troca pendente
                                           v
                                         auth.api.* (chamada interna, sem HTTP)

  disabledPaths: /sign-up/email e todos os /admin/* (inclui impersonate e remove-user)
```

- `disabledPaths` responde 404 só para requisições HTTP; as chamadas `auth.api.*` feitas no servidor continuam funcionando.
- **Por quê**: as regras das specs (não agir sobre si, senha provisória exibida uma vez, troca pendente) ficam num lugar só e não podem ser contornadas chamando o endpoint do plugin direto. Desligar `impersonate-user` é essencial: ele deixaria um admin entrar como outro usuário e ver as fichas dele, o que a D8 proíbe. Desligar `remove-user` garante "contas não são excluídas".
- **Login e logout continuam por HTTP**, pelo client do Better Auth no formulário, porque o rate limit do Better Auth é aplicado às requisições HTTP.

### A4. Autorização em camadas: `proxy.ts` para UX, `requireUser`/`requireAdmin` como garantia

- `src/proxy.ts` (o "middleware" do Next 16) valida a sessão e redireciona: sem sessão vai para `/login`; com troca pendente vai para `/trocar-senha`; logado abrindo `/login` vai para `/`.
- O proxy também reescreve `/admin/*` para uma rota inexistente quando quem acessa não é admin, o que devolve 404 de verdade. *(Ajuste feito na implementação: o `notFound()` chamado dentro de um `<Suspense>` acontece depois do início do streaming, então a página de "não encontrado" chegava com status 200.)* Uma página `not-found.tsx` em português atende os dois casos.
- Toda página e toda server action protegida chama `requireUser()` (sessão válida e sem troca pendente) ou `requireAdmin()` (idem, e com papel admin) em `src/server/auth/guards.ts`. Para não-admin, `requireAdmin` resulta em `notFound()` nas páginas e em erro nas actions.
- **Por quê**: a documentação do Next recomenda não depender só da borda para autorização, porque server actions podem ser chamadas diretamente. Os guards são a garantia; o proxy só evita telas quebradas.
- `cookieCache` do Better Auth fica **desligado**, para que desativação, redefinição de senha e mudança de papel valham na próxima ação (specs "Desativar conta" e "Alterar papel").

### A5. Rotas e telas

```
  /login                 público; formulário de e-mail e senha
  /trocar-senha          troca obrigatória (única página com pendência)
  /conta                 troca voluntária de senha
  /                      página inicial provisória (vira a lista de fichas)
  /admin/contas          lista, criar, desativar/reativar, redefinir, papel
  /api/auth/[...all]     handler do Better Auth
```

- Um cabeçalho comum nas páginas logadas mostra o nome, o link "Contas" (só para admin), "Minha conta" e "Sair".
- A senha provisória aparece numa caixa de resultado devolvida pela action logo após criar ou redefinir, com botão de copiar. Ela não é guardada em lugar nenhum além do hash.
- Textos da interface em português. Os códigos de erro do Better Auth (credencial inválida, conta banida, rate limit) são traduzidos para as mensagens das specs.

### A6. Senha provisória

- 16 caracteres gerados com `crypto.getRandomValues` sobre um alfabeto sem caracteres ambíguos (sem `0/O`, `1/l/I`), fácil de ditar na mesa. Atende ao mínimo de 12 da spec com folga.
- Função pura em `src/server/accounts/temp-password.ts`, com teste unitário.

### A7. Sessões e rate limit

- Sessão: `expiresIn` de 30 dias e `updateAge` de 1 dia (o uso renova a validade), conforme a spec "Expiração de sessão".
- Rate limit: `enabled: true` também em desenvolvimento, para ser testável, com a regra `"/sign-in/email": { window: 60, max: 5 }`. Armazenamento em memória: zera ao reiniciar o container, o que é aceitável para uma instância única.
- Atrás do proxy reverso, o IP vem de `x-forwarded-for`. A configuração (`advanced.ipAddress`) é registrada aqui e aplicada na change `deployment`.

### A8. Troca de senha

- Server action: valida com Zod (8 a 128 caracteres, nova diferente da atual), chama `auth.api.changePassword` com `revokeOtherSessions: true` (o Better Auth verifica a senha atual) e depois zera `mustChangePassword`.
- Se a troca no Better Auth falhar, o campo não é alterado. Se a atualização do campo falhar depois da troca, o usuário continua com a pendência e só precisa trocar de novo: o erro é seguro.

### A9. Seed do primeiro admin e migrações como comandos de operação

- `npm run db:migrate` (drizzle-kit migrate) e `npm run db:seed` (script TypeScript rodado com `tsx`).
- O seed lê `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`, validados com Zod só no script (não fazem parte do env da aplicação). Se o e-mail já existir, não faz nada. Se não, cria via `auth.api.createUser` com `role: "admin"` e `mustChangePassword: true`.
- Scripts fora do Next rodam com `--conditions=react-server`, para que `import "server-only"` resolva para o módulo vazio em vez de lançar erro.
- No Vitest, o projeto de integração usa um **alias** de `server-only` para o `empty.js` do próprio pacote, em vez da condição `react-server`. *(Ajuste feito na implementação: acrescentar condições ao resolvedor do Vite quebrava outros pacotes; o `pg` recebia o build ESM num `require`, e o OpenTelemetry era carregado num build ESM que o Node não suporta.)* O alias tem o mesmo efeito e só toca esse pacote.
- Para a VPS: um serviço `migrate` no `compose.yaml` (profile `prod`), construído a partir do estágio `builder` do Dockerfile (que tem as dependências completas), roda as migrações e, **só se `SEED_ADMIN_EMAIL` estiver definida**, o seed. O `app` espera o `migrate` terminar com sucesso. A imagem `standalone` continua enxuta. *(Ajuste feito na implementação: sem a condição, remover as variáveis do seed depois da instalação, como recomendado nos riscos, faria o `migrate` falhar e impediria o app de subir. O comando `db:seed` continua falhando quando faltam variáveis, como a spec pede.)*
- O `package.json` declara `"type": "module"`. *(Ajuste feito na implementação: a configuração do Vitest e os scripts são ESM, e sem a declaração o Node emitia avisos de "ESM em arquivo CommonJS". O Next, o ESLint e o build continuam funcionando.)*

### A10. Novas variáveis de ambiente

| Variável                                  | Onde        | Uso                                                 |
| ----------------------------------------- | ----------- | --------------------------------------------------- |
| `BETTER_AUTH_SECRET`                      | app         | assina os cookies; no mínimo 32 caracteres          |
| `BETTER_AUTH_URL`                         | app         | URL base pública (ex.: `http://localhost:3000`)     |
| `SEED_ADMIN_NAME/EMAIL/PASSWORD`          | só no seed  | dados do primeiro admin                             |

`src/lib/env.ts` passa a validar `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL`, ainda de forma preguiçosa, mantendo o build sem `.env`.

### A11. Testes

- **Unitários**: geração de senha provisória e validações (Zod) dos formulários.
- **Integração** contra um banco `dnd_sheet_test` no mesmo Postgres do Compose: um `globalSetup` do Vitest cria o banco se ele não existir e aplica as migrações, e cada teste limpa as tabelas. As funções de `src/server/accounts/service.ts` e `src/server/auth/password.ts` recebem os headers da sessão explicitamente, então os testes obtêm uma sessão real via `auth.api.signInEmail` e exercitam os cenários das specs (criar, e-mail duplicado, desativar encerra sessões, login de desativada, redefinir, papel, não agir sobre si, troca de senha, seed idempotente, endpoints desligados).
- **Roteiro manual** no navegador para o que depende de redirecionamento e da UI (proxy, área de contas invisível para não-admin, senha exibida uma vez).

## Risks / Trade-offs

- [Mudança de API entre versões do Better Auth] -> Fixar a versão no `package.json` e conferir a documentação da versão instalada ao implementar (os nomes `banUser`, `setRole`, `setUserPassword` e `disabledPaths` foram conferidos na documentação atual).
- [Alguma operação nova do plugin admin ficar exposta por HTTP numa atualização] -> Um teste de integração faz requisições HTTP para todos os caminhos bloqueados e espera 404. Ele também compara a lista de bloqueio com os endpoints `/admin/*` que o plugin registra na versão instalada, e falha se aparecer um caminho novo fora da lista.
- [Proxy consulta o banco a cada navegação] -> Aceitável para poucos usuários. Se pesar, usar só a checagem de cookie na borda e manter os guards como garantia.
- [Rate limit em memória zera ao reiniciar e não é compartilhado entre instâncias] -> Há uma instância só. Se isso mudar, migrar para armazenamento no banco.
- [Seed com senha em variável de ambiente] -> O admin é obrigado a trocá-la no primeiro login; documentar que as variáveis do seed podem ser removidas depois.
- [Senha provisória perdida se o admin fechar a caixa sem copiar] -> Basta redefinir a senha de novo. É o custo de nunca guardar a senha.
- [Formulários de senha são esvaziados quando o servidor devolve erro (comportamento padrão das form actions do React 19)] -> Aceito por ora, já que são campos de senha. Se incomodar, devolver os valores no estado da action e usar `defaultValue`.
- [Testes de integração dependem do Postgres do Compose] -> O `globalSetup` falha com uma mensagem clara ("rode `docker compose up -d db`") se o banco não responder.

## Migration Plan

Primeiro deploy com banco:

1. Definir `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` e as variáveis do seed no `.env`.
2. `npm run db:migrate` (ou o serviço `migrate` do Compose em produção).
3. `npm run db:seed`.
4. Entrar com o admin, trocar a senha e, opcionalmente, remover as variáveis do seed.

Rollback: as migrações só criam tabelas novas. Voltar o código para a versão anterior não exige mexer no banco.

## Open Questions

- Nenhuma que bloqueie. O visual das telas será revisto quando a ficha definir a identidade visual.
