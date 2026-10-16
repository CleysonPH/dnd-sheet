# Proposal

## Why

As mesas de RPG do grupo precisam de uma ficha online de D&D 5.5e (regras de 2024) que cada jogador acesse de qualquer dispositivo, com cálculos básicos automatizados e espaço para regras da casa. Ferramentas como Roll20 e D&D Beyond giram em torno de compêndios e de conteúdo oficial; aqui o objetivo é uma ficha leve e semi-automática, em que o próprio jogador descreve feats, itens e magias e decide quais efeitos automáticos eles aplicam.

Esta change é um **registro de decisões e roadmap**, não um pacote de implementação. Ela fixa escopo, arquitetura e vocabulário do domínio. Cada funcionalidade será especificada e implementada em uma change própria, com specs próprias (por isso `skip_specs: true`).

## What Changes

- Define a aplicação: uma ficha de personagem D&D 5.5e multiusuário, de uso interno, hospedada numa VPS própria.
- Define dois papéis:
  - **Admin**: gerencia contas (cria, ativa e desativa). Não há cadastro público.
  - **Usuário comum**: cria e gerencia as próprias fichas.
- Define a ficha como **documento autocontido**: tudo o que o personagem tem (feats, itens, magias, trackers) vive dentro da ficha. Um compêndio de modelos, mantido pelo admin, só copia conteúdo para a ficha, sem ligação depois da cópia (change `compendium`).
- Define o modelo de **fonte** (feat, item, magia, traço) com **efeitos** e **trackers**, base de toda a automação.
- Define as automações da v1: modificadores de atributo, bônus de proficiência, perícias, salvaguardas, CA com fórmulas alternativas (ex.: Defesa sem Armadura), máximos de trackers por fórmula, descanso curto/longo e override manual de qualquer valor calculado.
- Define a stack: Next.js (TypeScript) + Postgres, em Docker numa VPS.
- Define o recorte da v1 e o que fica para depois (ver design.md).

## Capabilities

### New Capabilities

Nenhuma nesta change (`skip_specs: true`). As capacidades abaixo são **planejadas** e cada uma terá spec própria numa change futura (ver tasks.md):

- `account-management`: contas, papéis (admin/usuário), ativação/desativação, login, troca de senha no primeiro acesso, seed do primeiro admin.
- `character-sheets`: lista de fichas do usuário, criar/abrir/excluir, persistência no servidor, isolamento por dono, autosave e conflito de versão entre dispositivos.
- `sheet-core-stats`: atributos, modificadores, bônus de proficiência, perícias (proficiência e expertise), salvaguardas, PV e dados de vida.
- `sheet-sources`: fontes (feat, item, magia, traço) com descrição livre e regra de ativação (sempre, equipado).
- `sheet-effects`: efeitos automáticos de fontes (somar, base alternativa, definir, proficiência), expressões, ordem de cálculo, override manual.
- `sheet-resources`: trackers de recursos com máximo por fórmula, espaços de magia, descanso curto/longo.

### Modified Capabilities

Nenhuma (projeto novo, sem specs existentes).

## Impact

- Projeto novo: nenhum código existente é afetado.
- Dependências: Node.js, Next.js, React, Postgres, Docker; uma biblioteca de autenticação e uma de acesso ao banco, a escolher na change de `account-management`.
- Infraestrutura: VPS com proxy reverso (HTTPS), container da aplicação, container do Postgres e backup agendado do banco para fora da VPS.
