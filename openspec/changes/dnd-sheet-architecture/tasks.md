# Tasks

Esta change é um registro de decisões. As tarefas abaixo não implementam código: cada uma abre uma change própria (via `/opsx:propose`), com specs, design e tarefas de implementação seguindo as decisões de design.md. A ordem segue as dependências entre capacidades.

## 1. Fundação

- [x] 1.1 Abrir a change `project-setup` (scaffold Next.js com TypeScript, Postgres via Docker Compose, `output: 'standalone'`, lint e testes configurados, conforme D1); verificar que `openspec validate project-setup` passa
- [x] 1.2 Abrir a change da capacidade `account-management` (login, papéis, criação/ativação/desativação pelo admin, senha provisória, seed do primeiro admin, conforme D8), escolhendo a biblioteca de autenticação; verificar que `openspec validate` passa e que há cenários para conta desativada e troca de senha obrigatória

## 2. Ficha: persistência e núcleo

- [x] 2.1 Abrir a change da capacidade `character-sheets` (lista, criar, abrir, excluir, isolamento por dono, documento JSON com `schemaVersion`, autosave e conflito de versão, conforme D2 e D9); verificar que `openspec validate` passa e que há cenários para acesso a ficha de outro usuário e para conflito de versão
- [x] 2.2 Abrir a change da capacidade `sheet-core-stats` (atributos, modificadores, PB, perícias com proficiência/expertise, salvaguardas, PV, dados de vida, override manual, conforme D3 e D6), definindo o layout da ficha; verificar que `openspec validate` passa e que os cenários incluem exemplos numéricos de personagens reais

## 3. Ficha: automação

- [x] 3.1 Abrir a change da capacidade `sheet-sources` (fontes feat/item/magia/traço com descrição e ativação sempre/equipado, conforme D4); verificar que `openspec validate` passa
- [ ] 3.2 Abrir a change da capacidade `sheet-effects` (operações somar/base alternativa/definir/proficiência, alvos, gramática das expressões, condições de armadura/escudo, ordem de cálculo e ciclos, CA, conforme D4 e D5); verificar que `openspec validate` passa e que há cenários para Defesa sem Armadura do Bárbaro e do Monge, armadura equipada e dependência circular
- [ ] 3.3 Abrir a change da capacidade `sheet-resources` (trackers com máximo por expressão, espaços de magia, descanso curto/longo, conforme D7); verificar que `openspec validate` passa e que há cenários para Inspiração de Bardo e para o que cada descanso recupera

## 4. Operação

- [ ] 4.1 Abrir a change `deployment` (proxy reverso com HTTPS, containers na VPS, backup agendado do Postgres para fora da VPS, procedimento de restauração, conforme D1); verificar que `openspec validate deployment` passa e que o plano inclui um teste de restauração de backup

## 5. Fechamento

- [ ] 5.1 Revisar design.md contra as decisões tomadas nas changes acima e registrar divergências (ex.: biblioteca de autenticação escolhida, gramática das expressões); verificar que nenhuma decisão de D1 a D10 ficou contradita sem registro
