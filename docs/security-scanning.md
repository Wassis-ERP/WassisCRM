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
