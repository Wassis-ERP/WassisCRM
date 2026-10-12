# Varredura local de segredos

O CI executa a CLI oficial Gitleaks 8.30.1 no histórico completo. O script
`scripts/install-gitleaks.ps1` verifica um SHA-256 fixo antes de extrair o binário
x64 Windows/Linux. A action comercial deixou de ser usada; o scanner continua
obrigatório, com saída redigida e falha em achados. Nenhuma licença da action é necessária.

Para habilitar o mesmo gate antes de commits neste clone:

```text
git config core.hooksPath .githooks
```

O binário oficial `gitleaks` deve estar no `PATH`. Para uma varredura manual de todo o histórico, execute `scripts/scan-secrets.ps1`. A saída deve ser compartilhada somente como categoria/regra, caminho e linha; nunca copie o valor detectado para tickets ou logs.

O hook usa `git --pre-commit --staged --redact=100`, conforme o
[hook oficial do Gitleaks 8.30.1](https://github.com/gitleaks/gitleaks/blob/v8.30.1/.pre-commit-hooks.yaml).
Sem `--staged`, a inspeção do working tree podia examinar zero bytes mesmo com
alterações preparadas para commit. Hooks têm LF explícito e modo executável no Git.
O CI também executa `scripts/test-secret-hook.ps1 -GitleaksPath <binário>`:
em repositório temporário, um token sintético em stage deve ser bloqueado pelo hook
real, um commit limpo deve passar e toda saída deve estar redigida. A fixture não
é enviada a provedor, não é um segredo real e é removida no fim. Este teste não
substitui a varredura de histórico inteiro.
