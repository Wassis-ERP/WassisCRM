# Varredura local de segredos

O CI executa Gitleaks no histórico completo. Para habilitar o mesmo gate antes de commits neste clone:

```text
git config core.hooksPath .githooks
```

O binário oficial `gitleaks` deve estar no `PATH`. Para uma varredura manual de todo o histórico, execute `scripts/scan-secrets.ps1`. A saída deve ser compartilhada somente como categoria/regra, caminho e linha; nunca copie o valor detectado para tickets ou logs.
