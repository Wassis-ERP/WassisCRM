---
name: wassis-git-pr-flow
description: "Fluxo enxuto para checkpoint local ou publicacao do WassisCRM: conferir sync e diff, validar nexus-crm sem gates redundantes, commitar e, quando autorizado, dar push em Dev, criar ou reutilizar PR para main, acompanhar CI/CodeQL e fazer merge. Use quando o usuario pedir checkpoint, commit consolidado, publicacao, PR, CI/CD, merge ou verificacao de Dev/origin/Dev/origin/main."
---

# Wassis Git PR Flow

## Objetivo

Executar o ritual Git/PR do WassisCRM com minimo de conversa e maxima previsibilidade. O fluxo padrao de publicacao e `Dev` -> `main`, mantendo a branch `Dev`, e termina com merge quando a PR estiver `CLEAN` e os checks obrigatorios passarem. Quando o pedido for apenas checkpoint local, encerrar depois do commit e da confirmacao da arvore limpa.

## Regras

- Responda em portugues do Brasil.
- Antes de push/PR/merge, rode `git fetch origin main Dev`.
- Use `nexus-crm` como cwd para validacoes de frontend.
- Prefira binarios locais: `node_modules\.bin\tsc.cmd`, `vite.cmd`, `vitest.cmd`, `eslint.cmd`.
- Nao corrija lint legado amplo durante este fluxo; registre como risco se falhar fora do escopo.
- Nao repita automaticamente validacoes ja aprovadas sobre a mesma arvore. Reaproveite a evidencia quando comando, resultado e escopo estiverem documentados e nao houver mudanca funcional posterior; na duvida, execute novamente somente o gate incerto.
- Se houver conflito, divergencia remota, working tree inesperadamente suja, ou check vermelho, pare e reporte.
- Respeite o limite explicito da rodada. Nao faca push, PR, merge ou troca de branch quando o usuario autorizar apenas checkpoint/commit local.
- Para merge, confirme que a PR esta `CLEAN` e checks obrigatorios passaram. Quando esta skill for chamada para subir alteracoes, faca o merge automaticamente ao fim do fluxo apto, salvo se o usuario pedir explicitamente para nao mesclar.
- Antes de commitar ou publicar, verifique o diff em busca de `setState(` e de novos usos de `any` em codigo de producao. Se aparecerem, pare e reporte com o arquivo e a linha; nao suba a alteracao ate haver confirmacao ou correcao.
- Se comandos Git/GitHub precisarem de permissao elevada por sandbox, solicite diretamente no comando.

## Sequencia Rapida

1. Estado inicial:
   - `git status --short --branch`
   - `git fetch origin main Dev`
   - `git rev-list --left-right --count "origin/Dev...HEAD"`
   - `git rev-list --left-right --count "origin/main...Dev"`

2. Definir a evidencia necessaria:
   - Revisar o diff completo, inclusive arquivos nao rastreados e compartilhados fora da pasta principal do recorte.
   - Conferir se validacoes anteriores ainda cobrem exatamente a arvore atual.
   - Se a proveniencia do conjunto consolidado for incerta, executar o conjunto minimo do passo seguinte.

3. Validacoes locais nao sobrepostas:
   - Em `nexus-crm`: `node_modules\.bin\tsc.cmd -b`.
   - Em `nexus-crm`: `node_modules\.bin\vitest.cmd run --passWithNoTests` uma unica vez; nao rodar antes os mesmos testes de forma focada, salvo diagnostico.
   - Em `nexus-crm`: executar `node_modules\.bin\eslint.cmd` somente sobre os arquivos alterados. Usar `eslint.cmd .` apenas por pedido explicito, mudanca de configuracao/lint, impacto transversal ou baseline global limpa.
   - Em `nexus-crm`: `node_modules\.bin\vite.cmd build` uma unica vez.
   - Repetir navegador apenas quando houver mudanca funcional/visual posterior a ultima evidencia documentada ou quando o usuario pedir nova validacao.
   - Depois de ajuste apenas documental, formatacao ou fim de arquivo, revisar o diff e repetir somente o gate diretamente afetado.

4. Revisao final e commit:
   - `git diff --stat`
   - `git diff --check`
   - Verificar no diff novos `setState(`, `any` em producao e dialogos nativos.
   - Adicionar ao stage somente o conjunto pretendido.
   - `git diff --cached --stat`
   - `git diff --cached`
   - `git commit -m "<mensagem curta>"`
   - Se o pedido for apenas checkpoint, confirmar branch e arvore limpa e encerrar.
   - Executar `git push origin Dev` somente quando a publicacao estiver autorizada.

5. PR:
   - Verificar PR aberta: `gh pr list --head Dev --base main --state open --json number,title,url`
   - Se nao existir, criar: `gh pr create --base main --head Dev --title "<titulo>" --body "<resumo e validacoes>"`
   - Acompanhar: `gh pr checks <numero> --watch --interval 10`
   - Confirmar estado: `gh pr view <numero> --json state,mergeStateStatus,statusCheckRollup,url`

6. Merge automatico ao fim do fluxo apto:
   - Confirmar que a PR esta aberta, `CLEAN` e com checks obrigatorios verdes
   - `gh pr merge <numero> --merge --delete-branch=false`
   - `git fetch origin main Dev`
   - Estado final:
     - `git status --short --branch`
     - `git rev-list --left-right --count "origin/Dev...HEAD"`
     - `git rev-list --left-right --count "origin/main...Dev"`

## Resposta Final

Inclua apenas:
- Commit principal.
- Resultado dos checks efetivamente necessarios, distinguindo evidencia reaproveitada de gate executado.
- Estado final da branch e da arvore.
- Quando houver publicacao: PR criada/usada e URL, checks remotos, merge e estado de `Dev`, `origin/Dev` e `origin/main`.
- Diretivas Git do Codex app somente para acoes realmente concluidas.
