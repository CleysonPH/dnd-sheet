# Proposal

## Why

As fontes (talentos, traços, itens e magias) já estão na ficha, mas são só texto: equipar o Anel de Proteção não muda a CA, o talento Alerta não muda a iniciativa e a CA continua como "—". Esse é o núcleo do produto descrito em D4 e D5 de `dnd-sheet-architecture`: cada fonte carrega efeitos que alteram os valores calculados, e o jogador só cai no valor manual (override) para casos que o motor não cobre.

## What Changes

- **Efeitos nas fontes**: toda fonte pode ter efeitos, editados em Editar. Um efeito tem alvo, operação, valor e condições:
  - **Alvos** (lista fechada):
    - valor de atributo;
    - salvaguarda de um atributo, ou todas;
    - perícia, ou todas;
    - CA, iniciativa, deslocamento, PV máximo e percepção passiva.
  - **Operações**:
    - **somar**: soma de todos os efeitos ao alvo;
    - **base alternativa de CA**: a maior base vale;
    - **definir**: para atributos e deslocamento, vale o maior entre a base e o valor;
    - **proficiência**: metade, proficiente ou expertise em perícias e salvaguardas, valendo o maior multiplicador.
  - **Valor**: uma expressão pequena com números, `+ - * /`, parênteses, `min` e `max`, e as variáveis `for`…`car`, `for.mod`…`car.mod`, `nivel` e `pb`. Por exemplo, `10 + des.mod + con.mod`. A ficha mostra o resultado enquanto se digita e recusa expressões inválidas.
  - **Condições**: "sem armadura" e "sem escudo", para a Defesa sem Armadura do Bárbaro e do Monge.
- **Quando um efeito vale**:
  - talentos e traços, sempre;
  - itens, quando ativos;
  - magias, quando marcadas como "em efeito". É uma nova ação de mesa, para casos como Armadura Arcana.
- **CA calculada**:
  - **Bases candidatas**: 10 + DES sem armadura, a fórmula da armadura ativa e as bases alternativas ativas. Vale a maior.
  - **Escudo e bônus**: soma-se o bônus do escudo ativo e os efeitos de somar.
  - **Novos campos nos itens**:
    - armadura: tipo (leve, média ou pesada) e CA base, com DES sem limite, até +2 ou nenhuma;
    - escudo: bônus de CA, +2 por padrão.
- **Dependência circular**: efeitos de atributos que dependem uns dos outros em ciclo (ex.: FOR definida por `des.mod` e DES por `for.mod`) são ignorados e sinalizados, em vez de travar o cálculo.
- **De onde vem cada valor**: o painel de cada valor calculado mostra as contribuições. Por exemplo, CA 18 = Defesa sem Armadura 15 + Escudo +2 + Anel de Proteção +1.
- **Overrides**: a CA e o deslocamento passam a aceitar valor manual, que continua substituindo o resultado final, já com os efeitos.
- **Formato da ficha**: passa ao formato 4. As fontes ganham `effects`, os itens os campos de armadura e escudo e as magias a marcação "em efeito". As fichas do formato 3 são migradas sem efeitos.

Fora do escopo:

- **Recursos**: trackers, usos limitados e espaços de magia ficam em `sheet-resources`.
- **Rolagens**: vantagem, desvantagem, resistências, dano de armas e bônus de ataque.
- **Condições**: outras condições além de armadura e escudo, por exemplo "em fúria" ou "a até 1,5 m".
- **Expressões**: dados (`1d6`) e referências a outros valores calculados além de atributos, modificadores, nível e PB.
- **Regras do 5.5e** que o motor não aplica sozinho: desvantagem de Furtividade da armadura pesada e requisito de FOR.

## Capabilities

### New Capabilities

- `sheet-effects`: efeitos das fontes e como alteram os valores calculados. Cobre alvos, operações, expressões, condições, quando cada fonte está ativa, o cálculo da CA, a detecção de ciclos e a origem de cada valor.

### Modified Capabilities

- `sheet-core-stats`:
  - **Override manual de valores derivados**: passa a incluir CA e deslocamento.
  - **Organização da ficha na tela**: a CA deixa de aparecer como "—" e passa a ser calculada.
- `sheet-sources`:
  - **Campos de item**: ganham tipo e CA base de armadura e bônus de escudo.
  - **Campos de magia**: ganham a marcação "em efeito".
  - **Ações de mesa nas fontes**: incluem marcar uma magia como "em efeito".

## Impact

- **`src/engine/sheet/`**: formato 4 e migração do 3 para o 4.
- **`src/engine/effects/`** (novo): schema dos efeitos, alvos e operações, parser e avaliador das expressões, e a aplicação dos efeitos com detecção de ciclos. É puro e testado com personagens reais.
- **`src/engine/stats/derive.ts`**:
  - passa a aplicar os efeitos e a calcular a CA e o deslocamento efetivo;
  - devolve as contribuições de cada valor e os problemas encontrados;
  - `DERIVED_KEYS` ganha `armorClass` e `speed`.
- **`src/components/sheet/`**:
  - editor de efeitos no formulário de fonte;
  - CA, deslocamento e "em efeito" na tela;
  - contribuições no painel do valor manual.
- **O que não muda**: o servidor, o banco e as dependências.
