---
name: wassis-git-pr-flow
description: "Fluxo enxuto de cabo a rabo para subir alteracoes do WassisCRM: conferir sync local/remoto, validar nexus-crm, commitar, dar push em Dev, criar ou reutilizar PR para main, acompanhar CI/CodeQL, fazer merge quando a PR estiver limpa e reportar o estado final. Use quando o usuario pedir para subir alteracoes, criar PR, verificar CI/CD, fazer merge, ou checar se Dev/origin/Dev/origin/main estao corretos antes de publicar."
---

# Wassis Git PR Flow

## Objetivo

Executar o ritual Git/PR do WassisCRM com minimo de conversa e maxima previsibilidade, de cabo a rabo. O fluxo padrao e `Dev` -> `main`, mantendo a branch `Dev`, e termina com merge quando a PR estiver `CLEAN` e os checks obrigatorios passarem.

## Regras

- Responda em portugues do Brasil.
- Antes de push/PR/merge, rode `git fetch origin main Dev`.
- Use `nexus-crm` como cwd para validacoes de frontend.
- Prefira binarios locais: `node_modules\.bin\tsc.cmd`, `vite.cmd`, `vitest.cmd`, `eslint.cmd`.
- Nao corrija lint legado amplo durante este fluxo; registre como risco se falhar fora do escopo.
- Se houver conflito, divergencia remota, working tree inesperadamente suja, ou check vermelho, pare e reporte.
- Para merge, confirme que a PR esta `CLEAN` e checks obrigatorios passaram. Quando esta skill for chamada para subir alteracoes, faca o merge automaticamente ao fim do fluxo apto, salvo se o usuario pedir explicitamente para nao mesclar.
- Se comandos Git/GitHub precisarem de permissao elevada por sandbox, solicite diretamente no comando.

## Sequencia Rapida

1. Estado inicial:
   - `git status --short --branch`
   - `git fetch origin main Dev`
   - `git rev-list --left-right --count "origin/Dev...HEAD"`
   - `git rev-list --left-right --count "origin/main...Dev"`

2. Validacoes locais:
   - Em `nexus-crm`: `node_modules\.bin\tsc.cmd -b`
   - Em `nexus-crm`: `node_modules\.bin\vite.cmd build`
   - Em `nexus-crm`: `node_modules\.bin\vitest.cmd run --passWithNoTests`
   - Em `nexus-crm`: `node_modules\.bin\eslint.cmd .`

3. Commit e push:
   - `git diff --stat`
   - `git add -A`
   - `git commit -m "<mensagem curta>"`
   - `git push origin Dev`

4. PR:
   - Verificar PR aberta: `gh pr list --head Dev --base main --state open --json number,title,url`
   - Se nao existir, criar: `gh pr create --base main --head Dev --title "<titulo>" --body "<resumo e validacoes>"`
   - Acompanhar: `gh pr checks <numero> --watch --interval 10`
   - Confirmar estado: `gh pr view <numero> --json state,mergeStateStatus,statusCheckRollup,url`

5. Merge automatico ao fim do fluxo apto:
   - Confirmar que a PR esta aberta, `CLEAN` e com checks obrigatorios verdes
   - `gh pr merge <numero> --merge --delete-branch=false`
   - `git fetch origin main Dev`
   - Estado final:
     - `git status --short --branch`
     - `git rev-list --left-right --count "origin/Dev...HEAD"`
     - `git rev-list --left-right --count "origin/main...Dev"`

## Resposta Final

Inclua apenas:
- PR criada/usada e URL.
- Commit principal.
- Resultado dos checks locais e remotos.
- Se merge foi feito.
- Estado final de `Dev`, `origin/Dev` e `origin/main`.
- Diretivas Git do Codex app somente para acoes realmente concluidas.
