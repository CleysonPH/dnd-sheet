# Tasks

## 1. Banco e servidor

- [ ] 1.1 Acrescentar `share_token` (nula e única) à tabela `sheet` e gerar a migração com `npm run db:generate` (L1). Verificar que `npm run db:migrate` aplica a migração no banco de dev e que `npm run test:int` passa
- [ ] 1.2 Criar `src/server/sheets/share.ts` com `enableShare`, `regenerateShare`, `disableShare` e `getSharedSheet`, e devolver o `shareToken` em `getSheet` (L2). Testes de integração:
  - o dono gera o link, e gerar de novo devolve o mesmo token;
  - trocar devolve outro token, e o anterior deixa de ler;
  - desativar faz a leitura dar `null`;
  - outro usuário é recusado nas três ações;
  - gravar o token não muda `version`;
  - a leitura devolve o documento atual depois de um salvamento;
  - ficha excluída, código inventado e código fora do formato dão `null`;
  - dono desativado dá `null`, e volta a ler depois de reativado;
  - a resposta não tem `id`, `ownerId` nem e-mail.

  Verificar que `npm run test:int` passa

## 2. Página pública

- [ ] 2.1 Liberar `/compartilhada/` no proxy, com e sem sessão, mantendo a troca de senha pendente (L3). Extrair o `SheetBody` do `SheetEditor` e criar o modo `"view"`, com `canAct`, nos cartões de PV, dados de vida, Recursos e fontes (L4). Verificar que `npm run lint`, `npm run typecheck` e `npm test` passam e que a ficha do dono continua igual em Jogar e Editar
- [ ] 2.2 Criar `src/app/compartilhada/[token]/page.tsx` com o `SheetViewer`, `notFound()`, `noindex` e um cabeçalho sem a área logada (L3, L4). Verificar no navegador:
  - sem sessão, o link de Ária mostra a ficha sem campos editáveis nem botões de dano, cura, descanso, recursos ou ações das fontes;
  - "Ver origem" e as abas funcionam;
  - a página não mostra o nome nem o e-mail do jogador;
  - com sessão, o link abre sem redirecionar;
  - um código inventado dá "não encontrado".

  Conferir a 375 px e nos dois temas

## 3. Compartilhar na ficha do dono

- [ ] 3.1 Criar o `SharePanel` com "Gerar link", o endereço, "Copiar", "Gerar novo link" e "Desativar link", e as server actions (L5). Verificar no navegador:
  - gerar o link de Ária e abri-lo numa aba sem sessão;
  - aplicar dano e ver o PV novo ao recarregar o link;
  - gerar um novo link e ver o antigo dar "não encontrado";
  - desativar e ver o link dar "não encontrado".

  Atualizar o README (rotas e compartilhamento)
- [ ] 3.2 Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build` e `npm run format:check` e verificar que todos passam
