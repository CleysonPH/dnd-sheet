# Spec Delta

## Purpose

Guarda na ficha as criaturas que acompanham o personagem, como familiares, montarias invocadas e companheiros de subclasse, cada uma com um bloco de estatísticas próprio. Os valores podem ser fixos ou calculados a partir dos valores do dono e do círculo da invocação, e a ficha acompanha o PV, os usos e as condições da criatura durante o jogo.

## ADDED Requirements

### Requirement: Companheiros na ficha
Em Editar, a ficha SHALL permitir criar, editar, reordenar e excluir até 4 companheiros. Um companheiro novo SHALL nascer com o nome "Companheiro", todos os atributos 10, CA 10, PV máximo 1 e 1 dado de vida d8, sem ações nem usos. Uma ficha gravada antes dos companheiros SHALL abrir sem companheiros e com todos os dados que já tinha.

#### Scenario: Criar um companheiro
- **WHEN** Brann, em Editar, cria um companheiro e o chama de "Hound"
- **THEN** a seção Companheiros mostra o Hound, e ele é salvo na ficha

#### Scenario: Quinto companheiro
- **WHEN** a ficha já tem 4 companheiros
- **THEN** a ficha não permite criar outro

#### Scenario: Ficha antiga
- **WHEN** Brann abre uma ficha gravada antes dos companheiros
- **THEN** a ficha abre com todos os dados que tinha, sem companheiros e com os mesmos valores calculados

### Requirement: Bloco do companheiro
O companheiro SHALL ter:
- nome de 1 a 50 caracteres e uma descrição de até 100;
- os seis atributos, de 1 a 30;
- proficiência em cada salvaguarda;
- nenhuma, proficiência ou especialista em cada perícia;
- CA, PV máximo e quantidade de dados de vida em expressão, e o dado de vida (d4, d6, d8, d10, d12 ou d20);
- deslocamento, sentidos e idiomas em texto de até 100 caracteres, e traços em texto de até 2.000.

#### Scenario: Coruja com números fixos
- **WHEN** Brann cria a "Coruja", "Miúda Fera, Neutro", DES 13, SAB 12, CA 11, PV máximo 1 e 1d4 de dado de vida, com o deslocamento "3 m, voo 18 m"
- **THEN** o cartão da Coruja mostra CA 11, PV 1/1, dados de vida 1/1 d4 e o deslocamento escrito

#### Scenario: Expressão inválida no bloco
- **WHEN** Brann digita "12 + dono.con.mod +" na CA de um companheiro
- **THEN** o campo indica o erro da expressão e o valor inválido não é salvo

### Requirement: Bônus de proficiência do companheiro
O bônus de proficiência do companheiro SHALL ser o do dono ou um valor próprio, inteiro de 0 a 10. Um companheiro novo SHALL usar o do dono. O PB escolhido SHALL valer em todas as salvaguardas, perícias, ações e expressões do companheiro.

#### Scenario: PB do dono
- **WHEN** o Hound usa o PB do dono e Brann sobe do nível 4 para o 5
- **THEN** o PB do Hound passa de +2 para +3

#### Scenario: PB próprio
- **WHEN** a Coruja tem PB próprio +2 e Brann está no nível 9, com PB +4
- **THEN** os valores da Coruja continuam usando +2

### Requirement: Invocação por magia
Um companheiro SHALL poder ser marcado como invocado por magia, com um círculo mínimo de 1 a 9 e o círculo atual. O círculo atual SHALL ser trocado em Jogar e em Editar, sem ficar abaixo do mínimo nem acima de 9. Ao trocar o círculo, todos os valores que dependem dele SHALL ser recalculados.

#### Scenario: Steed no 2º círculo
- **WHEN** Elara, paladina, cria o "Otherworldly Steed", invocado por magia com círculo mínimo 2, com CA "10 + circulo", PV máximo "5 + 10 * circulo" e "circulo" dados de vida d10
- **THEN** no círculo 2 o cartão mostra CA 12, PV 25/25 e dados de vida 2/2 d10

#### Scenario: Invocar de novo num círculo maior
- **WHEN** Elara, em Jogar, troca o círculo do Steed de 2 para 4
- **THEN** o cartão mostra CA 14, PV 45/45 e dados de vida 4/4 d10

#### Scenario: Abaixo do mínimo
- **WHEN** Elara tenta deixar o Steed no círculo 1
- **THEN** a ficha não aceita, e o círculo fica em 2

### Requirement: Expressões do companheiro
As expressões do companheiro SHALL usar a gramática dos efeitos, com estas variáveis:
- `for` a `car` e `.mod`: os da criatura;
- `pb`: o PB do companheiro;
- `nivel` e `conj.mod`: os do dono;
- `dono.for` a `dono.car`, com `.mod`, e `dono.pb`: os do dono;
- `circulo`: o círculo atual, ou 0 sem invocação.

As expressões das fontes SHALL continuar recusando `dono.` e `circulo`.

#### Scenario: Valores do Hound
- **WHEN** Brann, pugilista nível 5 com CON 16, dá ao Hound CA "12 + dono.con.mod", PV máximo "5 + 5 * nivel" e "nivel" dados de vida d8
- **THEN** o Hound mostra CA 15, PV 30/30 e dados de vida 5/5 d8

#### Scenario: Variável do dono numa fonte
- **WHEN** Brann digita "dono.con.mod" no valor de um efeito de uma fonte
- **THEN** o campo indica que a variável é desconhecida, e o valor não é salvo

#### Scenario: Círculo sem invocação
- **WHEN** o Hound, que não é invocado por magia, tem um bônus "circulo" numa ação
- **THEN** o bônus vale 0

### Requirement: Valores calculados do companheiro
O companheiro SHALL mostrar, calculados:
- os modificadores;
- as salvaguardas e as perícias, com o PB multiplicado pela proficiência;
- a Percepção passiva, 10 mais a perícia Percepção;
- a iniciativa, o modificador de DES;
- a CA, o PV máximo e os dados de vida.

Uma expressão que resulte em erro SHALL valer 0 e ser sinalizada, e um resultado negativo SHALL valer 0.

#### Scenario: Salvaguardas da Coruja
- **WHEN** a Coruja tem DES 13, SAB 12, PB próprio +2 e proficiência só em Percepção, como especialista
- **THEN** ela mostra salvaguarda de DES +1, Percepção +5 e Percepção passiva 15

#### Scenario: Divisão por zero
- **WHEN** o PV máximo de um companheiro é "10 / (dono.pb - dono.pb)"
- **THEN** o PV máximo vale 0 e o campo é sinalizado com o erro

### Requirement: Teste em tudo
O companheiro SHALL ter uma marcação que soma o PB a todas as suas salvaguardas e perícias, como proficiente. Uma perícia em que ele é especialista SHALL continuar com o PB em dobro. A marcação SHALL não mudar a iniciativa.

#### Scenario: Pack Bond do Hound
- **WHEN** o Hound, com FOR 14 e INT 3, tem a marcação ligada e PB +3
- **THEN** ele mostra salvaguarda de FOR +5, de INT −1 e Atletismo +5

#### Scenario: Sem a marcação
- **WHEN** a marcação do Hound é desligada e nenhuma salvaguarda é proficiente
- **THEN** a salvaguarda de FOR volta a +2

### Requirement: Ações do companheiro
O companheiro SHALL ter até 6 ações, com os mesmos campos, regras de cálculo e limites das ações das fontes. Os atributos e o PB SHALL ser os do companheiro. A conjuração SHALL usar o atributo, o ataque mágico e a CD de magia do dono. A escala por nível SHALL usar o nível do dono. A proficiência automática SHALL ser sempre proficiente, e não há Exaustão nem dados por círculo.

#### Scenario: Mordida do Hound
- **WHEN** o Hound de Brann (CON 16, PB +3) tem a ação "Mordida", ataque corpo a corpo sem atributo, sempre proficiente, bônus "dono.con.mod", com uma parte 2d4 de bônus "2 + dono.con.mod", perfurante
- **THEN** o cartão do Hound mostra a Mordida com +6 e "2d4+5 perfurante"

#### Scenario: CD por expressão
- **WHEN** o Hound tem a ação "Derrubar", salvaguarda de FOR com a CD "8 + dono.con.mod + pb"
- **THEN** o cartão mostra "FOR CD 14"

#### Scenario: Ataque com o ataque mágico do dono
- **WHEN** Elara tem ataque mágico +5 e CD de magia 13, e o Steed no círculo 4 tem o "Otherworldly Slam", ataque com conjuração e uma parte 1d8 de bônus "circulo", radiante
- **THEN** o cartão do Steed mostra +5 e "1d8+4 radiante", e a origem do acerto mostra o ataque mágico do dono

#### Scenario: Fora do cartão Ataques
- **WHEN** o Hound tem a Mordida
- **THEN** a Mordida aparece no cartão do Hound, e o cartão Ataques do personagem não a mostra

### Requirement: Usos do companheiro
O companheiro SHALL ter até 10 usos, com os mesmos campos e regras dos trackers das fontes. As expressões dos usos SHALL usar as variáveis do companheiro. Os usos SHALL ser gastos e recuperados em Jogar e em Editar, no cartão do companheiro.

#### Scenario: Healing Touch
- **WHEN** o Steed tem o uso "Healing Touch", com máximo 1 e recuperação total no descanso longo, e Elara gasta o uso
- **THEN** o cartão mostra o uso 0/1

### Requirement: PV do companheiro
O companheiro SHALL guardar o dano sofrido, o PV temporário (de 0 a 999) e os dados de vida gastos, com as regras de dano, cura e dados de vida do personagem, mas sem testes contra a morte nem concentração. Em Jogar e em Editar, o cartão SHALL permitir aplicar dano e cura, ajustar o PV temporário e gastar e recuperar dados de vida. Com 0 PV, o companheiro SHALL aparecer como caído.

#### Scenario: Dano com PV temporário
- **WHEN** o Hound tem 30/30 PV e 5 temporários e sofre 12 de dano
- **THEN** ele fica com 23/30 PV e 0 temporários

#### Scenario: Caído
- **WHEN** o Hound, com 23 PV, sofre 40 de dano
- **THEN** ele fica com 0/30 PV, aparece como caído, e nada muda nos testes contra a morte de Brann

#### Scenario: Máximo diminui
- **WHEN** o Steed está com 45 PV máximo e 10 de dano, e Elara troca o círculo de 4 para 2
- **THEN** o Steed fica com 15/25 PV

### Requirement: Condições do companheiro
O companheiro SHALL ter as suas próprias condições, as mesmas 14 do personagem, marcadas e desmarcadas no cartão, em Jogar e em Editar. Elas SHALL aparecer só como rótulos, com o resumo da regra, e SHALL não alterar os valores do companheiro nem as condições do dono. O companheiro SHALL não ter Exaustão.

#### Scenario: Amedrontado
- **WHEN** Brann marca "amedrontado" no Hound
- **THEN** o cartão do Hound mostra a condição, e a faixa de condições de Brann não muda

### Requirement: Seção Companheiros
A ficha SHALL mostrar os companheiros numa seção própria, com um cartão por criatura: o nome, a CA, o PV, os dados de vida, o círculo quando invocado, as condições, as ações e os usos. O cartão SHALL abrir o bloco completo, com atributos, salvaguardas, perícias, sentidos, idiomas e traços. Sem companheiros, a seção SHALL ficar oculta, exceto em Editar.

#### Scenario: Bloco completo
- **WHEN** Brann abre o bloco completo do Hound
- **THEN** a ficha mostra os seis atributos com os modificadores, as salvaguardas, as perícias que somam algo, a Percepção passiva, os sentidos, os idiomas e os traços

#### Scenario: Ficha compartilhada
- **WHEN** alguém abre o link de compartilhamento da ficha de Brann
- **THEN** a seção mostra o Hound com os mesmos valores e o estado de mesa, sem controles que alteram a ficha

#### Scenario: Sem companheiros em Jogar
- **WHEN** a ficha não tem companheiros e está em Jogar
- **THEN** a seção Companheiros não aparece

#### Scenario: Celular
- **WHEN** Brann abre a ficha num celular com tela de 375 px
- **THEN** os cartões dos companheiros cabem sem rolagem horizontal
