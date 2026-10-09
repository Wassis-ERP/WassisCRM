# Reproduzir a jornada real em ambiente descartável

Pré-requisitos: clones irmãos WassisCRM/WAssisBE, Node compatível com o lockfile, PowerShell 7, SDK .NET **10.0.401**, dependências restauradas e binários oficiais PostgreSQL 16 para Windows. O caminho dos binários deve conter `initdb.exe`, `pg_ctl.exe` e `psql.exe`. Este procedimento usa exclusivamente um cluster novo em loopback, com senha e certificado efêmeros e TLS `VerifyFull`; não aceita uma connection string de HML/PRD.

Em `WassisCRM/nexus-crm`, executar `npm ci` e `npx playwright install chromium`. Em `WAssisBE`, conferir o SDK e executar:

```powershell
dotnet restore WAssisInsurance.sln --locked-mode --no-http-cache
dotnet build WAssisInsurance.sln --configuration Release --no-restore
pwsh -NoProfile -File scripts/test-security-postgres.ps1 `
  -PostgresBinDirectory 'C:\caminho\pgsql\bin' `
  -ConnectedCrmDirectory 'C:\caminho\WassisCRM\nexus-crm'
```

O script executa a categoria PostgreSQL completa e, se aprovada, a jornada conectada. Cria um banco exclusivo para o navegador, aplica migrations somente nesse banco, importa `tests/Fixtures/connected-ui.sql` e inicia API/CRM em portas livres de `127.0.0.1`. A API usa uma role comum sem ownership nem `BYPASSRLS`; os grants amplos dessa fixture **não são o modelo de privilégios de Production**. A autenticação usa uma identidade sintética de Development. Workers e chamadas a seguradoras não são iniciados.

O navegador verifica login/logout, criação/edição e persistência após reload de Segurados/Oportunidades, ganho, lista/Kanban e atualização de dados em nova sessão. Registra GET/POST/PUT ao BE e rejeita conexões fora das duas origens locais. Tarefas e Cálculos devem exibir a pendência de integração no modo conectado, sem fallback para memória. Screenshots ficam em `nexus-crm/.screens/e2e`, ignoradas no Git; traces estão desativados para evitar captura de credenciais.

Ao terminar, o script encerra apenas os seus processos, exclui seu banco/role, para o cluster e remove a senha/chave privada efêmeras. Logs permanecem no diretório temporário informado; não os publique sem sanitização. A alternativa Windows comprova PostgreSQL real/TLS, mas não comprova a fixture Docker/Testcontainers. Essa fixture continua sendo exercitada no CI do BE.

O smoke separado `npx playwright test --config playwright.production.config.ts` verifica o bundle já compilado com Auth0. Ele intercepta somente a consulta de identidade com uma resposta 401 sintética e não comprova login real no IdP. A jornada conectada acima usa o BE real.
