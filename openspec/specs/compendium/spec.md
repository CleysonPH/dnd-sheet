# compendium Specification

## Purpose

Mantém um compêndio de talentos, traços, itens e magias já configurados, com efeitos e trackers, que o admin cadastra e que todo usuário pode buscar e copiar para as próprias fichas, como fontes independentes.

## Requirements

### Requirement: Entradas do compêndio
Cada entrada do compêndio SHALL ser uma fonte completa (talento, traço, item ou magia), com os mesmos campos, efeitos, trackers e regras de validação das fontes da ficha. O compêndio SHALL ter no máximo 2000 entradas. Duas entradas SHALL poder ter o mesmo nome.

#### Scenario: Entrada com efeitos e trackers
- **WHEN** o admin cadastra a magia "Escudo da Fé", 1º círculo, com concentração e o efeito somar 2 na CA
- **THEN** a entrada é gravada com o círculo, a concentração e o efeito

#### Scenario: Entrada inválida
- **WHEN** uma entrada chega ao servidor com um efeito de expressão inválida
- **THEN** a gravação é recusada e o compêndio não muda

### Requirement: Gestão do compêndio restrita a admins
A página do compêndio e as operações de criar, editar e excluir entradas SHALL estar disponíveis apenas para admins. O link para a página SHALL aparecer só para admins. Ler e buscar entradas SHALL estar disponível a todo usuário logado.

#### Scenario: Usuário comum abre a página do compêndio
- **WHEN** um usuário comum abre o endereço da página do compêndio
- **THEN** recebe uma página de "não encontrado"

#### Scenario: Usuário comum chama uma operação de admin
- **WHEN** um usuário comum chama diretamente a operação de excluir uma entrada
- **THEN** a operação é recusada e a entrada continua no compêndio

### Requirement: Gerenciar entradas
Na página do compêndio, o admin SHALL poder buscar e filtrar as entradas por tipo, criar uma entrada com tipo e nome, editá-la com o mesmo editor de fonte da ficha e salvar, e excluí-la depois de confirmar. A pré-visualização das expressões SHALL usar os valores de uma ficha nova.

#### Scenario: Criar e editar
- **WHEN** o admin cria o talento "Robusto", acrescenta o efeito somar `nivel * 2` no PV máximo e salva
- **THEN** "Robusto" aparece na lista do compêndio com o resumo do efeito

#### Scenario: Excluir com confirmação
- **WHEN** o admin escolhe excluir "Robusto" e confirma
- **THEN** a entrada sai do compêndio, e as fichas que já tinham copiado "Robusto" continuam com a cópia

### Requirement: Enviar fonte ao compêndio
Em Editar, cada fonte da ficha de um admin SHALL ter a ação "Enviar ao compêndio", que cria uma entrada nova com a fonte, sem o estado de mesa. A ação SHALL não substituir nenhuma entrada existente. Para usuários comuns, a ação SHALL não aparecer.

#### Scenario: Admin envia uma magia
- **WHEN** o admin, em Editar, escolhe "Enviar ao compêndio" na magia "Bola de Fogo" da própria ficha, que está em efeito
- **THEN** o compêndio ganha a entrada "Bola de Fogo", fora de efeito, e a ficha não muda

#### Scenario: Envio repetido
- **WHEN** o compêndio já tem "Bola de Fogo" e o admin envia de novo a "Bola de Fogo" da ficha
- **THEN** o compêndio passa a ter duas entradas "Bola de Fogo"

### Requirement: Buscar no compêndio
Em Editar, o painel "Compêndio" SHALL buscar as entradas por parte do nome, sem diferenciar maiúsculas nem acentos, e filtrar por tipo. O painel SHALL abrir filtrado pelos tipos da aba de fontes atual. Cada resultado SHALL mostrar o nome, o tipo, os dados principais e o resumo dos efeitos, e a etiqueta "já na ficha" quando a ficha tiver uma fonte com o mesmo nome. A busca SHALL mostrar no máximo 50 resultados, em ordem alfabética.

#### Scenario: Busca sem acento
- **WHEN** Lyra, na aba Magias, abre o compêndio e digita "bola"
- **THEN** o painel mostra "Bola de Fogo" com 3º círculo e evocação, e não mostra talentos nem itens

#### Scenario: Já na ficha
- **WHEN** a ficha já tem a magia "Bola de Fogo" e Lyra busca "fogo"
- **THEN** o resultado "Bola de Fogo" mostra a etiqueta "já na ficha"

#### Scenario: Fora de Editar
- **WHEN** a ficha está em Jogar
- **THEN** o painel "Compêndio" não aparece

### Requirement: Adicionar entrada à ficha
"Adicionar" num resultado, ou arrastá-lo até a lista de fontes no desktop, SHALL copiar a entrada para a ficha como uma fonte nova, com id próprio, trackers sem uso, item desequipado e dessintonizado e magia fora de efeito. A fonte SHALL aparecer na aba do seu tipo e poder ser editada como qualquer outra. Com a ficha no limite de fontes, a adição SHALL ser recusada com um aviso.

#### Scenario: Adicionar um talento
- **WHEN** Lyra adiciona "Treinamento com Armadura Pesada", que concede a proficiência Pesada, à ficha de Thorin
- **THEN** a aba Características mostra o talento, o cartão Proficiências mostra Pesada com essa origem, e a ficha é salva

#### Scenario: Adicionar duas vezes
- **WHEN** Lyra adiciona a mesma "Poção de Cura" duas vezes
- **THEN** a ficha passa a ter duas fontes "Poção de Cura" independentes

#### Scenario: Arrastar no desktop
- **WHEN** Lyra, numa janela de 1280 px, arrasta "Bola de Fogo" do painel até a lista de magias
- **THEN** a magia é adicionada como no botão "Adicionar"

### Requirement: Cópia independente
A fonte copiada SHALL não guardar ligação com a entrada. Editar ou excluir a entrada SHALL não alterar as fichas, e editar a cópia na ficha SHALL não alterar a entrada.

#### Scenario: Admin corrige a entrada
- **WHEN** Lyra já copiou "Bola de Fogo" e o admin muda a descrição da entrada
- **THEN** a "Bola de Fogo" da ficha de Lyra continua com a descrição antiga

#### Scenario: Jogador ajusta a cópia
- **WHEN** Lyra muda o nome da cópia para "Bola de Fogo (Sorcerer)"
- **THEN** a entrada do compêndio continua "Bola de Fogo"

### Requirement: Entradas de formatos anteriores
Uma entrada gravada num formato anterior das fontes SHALL ser lida, buscada e copiada já no formato atual.

#### Scenario: Entrada antiga
- **WHEN** o formato das fontes muda depois de o admin cadastrar "Robusto"
- **THEN** "Robusto" continua aparecendo na busca e é copiado para a ficha no formato atual
