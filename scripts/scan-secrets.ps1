$ErrorActionPreference = 'Stop'

if (-not (Get-Command gitleaks -ErrorAction SilentlyContinue)) {
    throw 'gitleaks não encontrado. Instale a versão oficial e execute novamente.'
}

gitleaks git --redact --log-opts='--all' --no-banner .
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
