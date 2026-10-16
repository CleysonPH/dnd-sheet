# Design

## Context

Projeto novo, sem código. A motivação e o escopo estão em proposal.md. Restrições que moldam o desenho:

- Uso interno, poucos usuários, uma VPS. Simplicidade operacional pesa mais que escala.
- Sem compêndio: todo conteúdo de regras é digitado pelo jogador dentro da ficha.
- Automação parcial: o sistema calcula o que é mecânico e o jogador sempre pode sobrescrever.
- Acesso de múltiplos dispositivos; o servidor é a fonte da verdade.

Este documento registra decisões de nível de arquitetura. Os detalhes de cada capacidade (formato exato das expressões, layout da ficha, telas) serão decididos nas changes de cada uma.

## Goals / Non-Goals

**Goals:**
- Fixar a arquitetura e o modelo de dados da ficha para que as changes futuras sejam incrementais e consistentes.
- Fixar o modelo de efeitos (fonte -> efeito -> valor derivado), que é o núcleo do produto.
- Definir o recorte da v1.

**Non-Goals:**
- Compêndio, catálogo compartilhado ou SRD pré-carregado.
- Mesas/campanhas e visão do mestre (por enquanto só o dono vê a ficha).
- Cadastro público de contas.
- Automação completa de regras (rolagem de dados, condições de combate, níveis de classe automáticos).
- Edição colaborativa em tempo real.

## Decisions

### D1. Stack: Next.js (TypeScript) + Postgres, na Vercel com o Neon

Monolito Next.js em funções serverless da Vercel (região `gru1`), com o Postgres gerenciado pelo Neon, em São Paulo. HTTPS e deploy a cada push na `main` vêm da Vercel.

```
  Vercel (gru1)                         Neon (aws-sa-east-1)
  +---------------------------+         +-----------------------------+
  |  HTTPS --> funções Next.js| ------> |  Postgres (pooler)          |
  |  build: migrações + build |         |  histórico de 6 h (restore) |
  +---------------------------+         +-----------------------------+
```

- **Revisão** (change `deployment`): o plano original era Docker numa VPS, com proxy reverso (Caddy ou nginx), Postgres em container e `pg_dump` agendado para fora da VPS. Ele foi trocado por Vercel + Neon, sem servidor para manter.
- **Divergência no backup**: não há `pg_dump` agendado. A recuperação depende do histórico do Neon (6 horas no plano free), com o procedimento e um ensaio no README. Foi decisão do usuário. Um `pg_dump` manual continua possível.
- **Por quê**: uma linguagem só (TypeScript) para UI, servidor e motor de cálculo; deploy de um único app; Postgres cobre tanto os dados relacionais (usuários) quanto os documentos (fichas, em JSONB).
- **Alternativas**: SPA + API separada (dois deploys, sem ganho real nesse porte); SQLite (mais simples, mas o Postgres com JSONB deixa espaço para consultas futuras e backup padronizado); um banco de documentos (desnecessário, já que JSONB cobre o caso).

### D2. Ficha como documento JSON autocontido

Cada ficha é um documento JSON salvo numa coluna JSONB. Feats, itens, magias, trackers e overrides vivem dentro dela. Não há entidades compartilhadas entre fichas.

```
  users(id, email, password_hash, role, active, must_change_password, ...)
  sheets(id, owner_id -> users.id, name, version, data JSONB,
         created_at, updated_at)
```

- **Por quê**: o usuário decidiu que não haverá reaproveitamento entre fichas. Um documento evita dezenas de tabelas para um conteúdo cujo formato vai evoluir muito, e torna exportar/importar trivial no futuro.
- **Alternativas**: modelo relacional normalizado (fontes, efeitos e trackers como tabelas). Rejeitado: custo alto de migração a cada mudança no formato e nenhum benefício, já que não há consultas entre fichas.
- **Regras do documento**:
  - Possui `schemaVersion` desde a primeira versão; documentos antigos são migrados ao carregar.
  - Guarda apenas **entradas** (valores base, fontes, efeitos, trackers, overrides). Valores derivados nunca são persistidos; são recalculados.
  - `name` (e outros campos usados na listagem) ficam duplicados em coluna, para listar fichas sem ler o JSON.

### D3. Motor de cálculo como módulo TypeScript puro, executado no cliente

```
  +-------------------+          +---------------------------+
  |  Navegador        |  salva   |  Servidor                 |
  |  ficha (JSON) ----+--------->|  auth + contas + admin    |
  |       |           |  carrega |  fichas: 1 doc por ficha  |
  |       v           |<---------+  (dono, versão, JSON)     |
  |  motor de cálculo |          |  não calcula nada         |
  |       v           |          +---------------------------+
  |  valores na tela  |
  +-------------------+
```

- O motor é uma função pura: `ficha (entradas) -> valores derivados`. Não depende de React nem do banco, e mora num módulo isolado (ex.: `src/engine/`).
- **Por quê**: feedback instantâneo na edição e testes unitários simples com personagens reais ("Bárbaro nível 5, DES 14, CON 16, sem armadura -> CA 15").
- **Alternativa**: calcular no servidor. Rejeitado: o servidor não precisa dos valores derivados para nada, e cada edição exigiria uma ida e volta.
- Se no futuro o servidor precisar de valores derivados (ex.: visão do mestre), o mesmo módulo roda no Node sem mudanças.

### D4. Modelo de fonte, efeito e tracker

Feats, itens, magias e traços de classe/espécie têm a mesma forma: uma **fonte**.

```
  +---------------------------------------------------------+
  |  FONTE (feat | item | magia | traço)                    |
  +---------------------------------------------------------+
  |  nome, descrição (texto livre)                          |
  |  ativação: sempre (feat, traço) | se equipado (item)    |
  |  efeitos[]  --> alvo + operação + valor (expressão)     |
  |                 + condição opcional                     |
  |  trackers[] --> nome, máximo (expressão), atual,        |
  |                 recarga: curto | longo | nenhuma        |
  +---------------------------------------------------------+
```

- Um efeito só vale quando a fonte está ativa. Equipar ou desequipar um item liga ou desliga os efeitos dele.
- **Operações** (conjunto inicial):

  ```
  +--------------+------------------------------+---------------------------+
  | operação     | exemplo                      | como combina              |
  +--------------+------------------------------+---------------------------+
  | somar        | +1 CA (Anel de Proteção)     | soma todos                |
  | base alt.    | Defesa sem Armadura          | maior entre as bases      |
  | definir      | Manoplas de Força: FOR = 19  | maior entre base e valor  |
  | proficiência | Expertise em Furtividade     | define o multiplicador PB |
  +--------------+------------------------------+---------------------------+
  ```

- **Alvos** são uma lista fechada e estruturada (atributo, perícia, salvaguarda, CA, iniciativa, deslocamento, PV máximo...), escolhida numa lista e não digitada.
- **Valores** são expressões pequenas que podem referenciar valores da ficha (ex.: `10 + des.mod + con.mod`, `max(1, car.mod)`).
- **Condições** (inicial): "sem armadura equipada" e "sem escudo equipado", o suficiente para Defesa sem Armadura do Bárbaro e do Monge.
- **Por quê do modelo híbrido**: um catálogo fixo de efeitos sem expressões não cobre nem a Inspiração de Bardo; fórmulas totalmente livres (alvo também em texto) são difíceis de validar, ordenar e editar por quem não programa.
- **A gramática exata das expressões e a UI de montagem ficam para a change `sheet-effects`.**

### D5. Ordem de cálculo e CA

O motor resolve os valores em ordem de dependência (atributos -> modificadores -> PB -> perícias/salvaguardas -> CA -> trackers), e detecta e reporta dependências circulares em vez de travar.

CA é o caso que justifica a operação "base alternativa":

```
  bases candidatas:  10 + DES                     (padrão, sem armadura)
                     fórmula da armadura equipada
                     bases alternativas ativas    (ex.: 10 + DES + CON)
  CA = MAX(bases válidas) + escudo + soma dos bônus "somar"
```

### D6. Override manual

Qualquer valor derivado pode ser sobrescrito pelo jogador. O override é guardado na ficha, substitui o valor calculado e é sinalizado visualmente, com uma forma de removê-lo e voltar ao cálculo.

- **Por quê**: cobre regras da casa e qualquer lacuna do motor sem exigir que ele seja completo.

### D7. Recursos e descanso

- Trackers têm máximo por expressão (ex.: Inspiração de Bardo = `max(1, car.mod)`) e um valor atual.
- Espaços de magia são trackers agrupados por círculo, com visualização própria.
- **Descanso curto**: recarrega trackers com recarga "curto".
- **Descanso longo**: recarrega trackers com recarga "curto" ou "longo", restaura PV ao máximo e recupera dados de vida.
- Recarga parcial (ex.: recuperar só 1 uso no descanso curto) fica fora da v1, mas o modelo deve aceitar um campo "quanto recupera" no futuro sem migração disruptiva.

### D8. Contas e autenticação

- Login por e-mail e senha. Não há cadastro público.
- O admin cria a conta com uma senha provisória; o usuário é obrigado a trocá-la no primeiro login.
- O admin ativa e desativa contas. Uma conta desativada não consegue logar, e as sessões existentes dela são invalidadas.
- O primeiro admin é criado por um script de seed a partir de variáveis de ambiente.
- Autorização: um usuário só lê e escreve as próprias fichas. O admin **não** acessa fichas de outros usuários (só gerencia contas).
- A biblioteca de autenticação será escolhida na change `account-management`.

### D9. Persistência, autosave e conflito de versão

- A ficha é salva automaticamente alguns segundos após a última edição (debounce).
- Cada salvamento envia a versão em que a edição se baseou. Se o servidor já tem uma versão mais nova (outro dispositivo salvou), o salvamento é recusado e o usuário é avisado para recarregar.

```
  Celular                 Servidor                  PC (aba antiga)
     |  salva v3 -> v4       |                           |
     |---------------------->|  ok, agora v4             |
     |                       |      salva v3 -> v4       |
     |                       |<--------------------------|
     |                       |  CONFLITO                 |
     |                       |-------------------------->|  "Ficha alterada em
     |                       |                           |   outro lugar. Recarregar?"
```

- **Alternativa**: last-write-wins. Rejeitado porque perde dados silenciosamente no cenário mais comum de uso (celular na mesa + PC em casa).

### D10. Recorte da v1

```
  v1                                    depois
  * login, admin de contas              - link de compartilhamento (só leitura)
  * lista de fichas, criar/excluir      - exportar/importar JSON
  * atributos, mods, PB, perícias,      - recarga parcial de tracker
    salvaguardas, PV, dados de vida     - mesas/campanhas, visão do mestre
  * fontes com efeitos e trackers       - condições mais ricas nos efeitos
  * CA com fórmulas alternativas
  * espaços de magia
  * override manual
  * descanso curto/longo
  * autosave + conflito de versão
```

## Risks / Trade-offs

- [O motor de efeitos cresce até virar um interpretador de regras completo] -> Manter alvos e operações em listas fechadas, e usar o override manual como válvula de escape em vez de automatizar casos raros.
- [Expressões difíceis de montar para quem não programa] -> Montagem guiada na UI (escolher variáveis numa lista) e pré-visualização do resultado; a decisão fica na change `sheet-effects`.
- [O formato do JSON evolui e quebra fichas antigas] -> `schemaVersion` desde o início e migrações executadas ao carregar, cobertas por testes.
- [JSON sem validação no servidor aceita dados corrompidos] -> Validar o documento com um schema (ex.: Zod) no servidor antes de salvar e limitar o tamanho.
- [Perda de dados na VPS] -> Backup agendado do Postgres para fora da VPS, com uma restauração testada.
- [Conflito de versão irrita o usuário se for frequente] -> Autosave curto reduz a janela de conflito; se for um problema real, evoluir para merge por campo numa change futura.
- [Admin sem acesso às fichas dificulta suporte] -> Aceito conscientemente; reavaliar junto com o conceito de mesas.

## Migration Plan

Não se aplica: projeto novo, sem dados existentes. O deploy inicial e o seed do primeiro admin serão descritos na change que entregar a infraestrutura.

## Open Questions

- Gramática das expressões (operadores, funções, nomes das variáveis): decidir na change `sheet-effects`.
- Biblioteca de autenticação e de acesso ao banco: decidir na change `account-management`.
- Lista final de alvos de efeito além do conjunto inicial: decidir na change `sheet-effects`.
- Layout da ficha no celular vs. desktop: decidir na change `sheet-core-stats`.
