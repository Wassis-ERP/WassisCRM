# Reproduzir a jornada real em ambiente descartável

Pré-requisitos: clones irmãos WassisCRM/WAssisBE, Node compatível, .NET 8 e Docker. O teste recusa URL frontend fora de localhost/127.0.0.1. **Conferir também que VITE_API_BASE_URL aponta à API local; nunca usar dados ou credenciais de HML/PRD.** API Staging e autenticação com hash são testadas separadamente pela suíte WebApplicationFactory do BE; este E2E usa a identidade sintética de Development.

1. Criar PostgreSQL 16 descartável com porta publicada somente em 127.0.0.1:55439, banco wassis_readiness e usuário wassis_test. Gerar senha aleatória em variável de processo, sem imprimir nem versionar. Definir ConnectionStrings__DefaultConnection no processo .NET com Host=127.0.0.1;Port=55439 e esses dados. Não alterar appsettings ou copiar env de produção.
2. Em WAssisBE, executar `dotnet build -c Release` e a API com `--migrate`, ASPNETCORE_ENVIRONMENT=Development. Importar `tests/Fixtures/connected-ui.sql` uma vez nesse banco local via psql. A fixture não é idempotente, deliberadamente acusa banco já preparado.
3. Iniciar API em http://127.0.0.1:5087 com as variáveis de processo abaixo. Manter o processo em terminal separado. Não iniciar workers ou integrações de seguradora.

```powershell
$env:ASPNETCORE_ENVIRONMENT='Development'
$prefix='Identity__DevelopmentAuth__Users__0__'
$fixture=@{
 Username='user0@example.invalid'; Password='local-integration-fixture-password'
 UserId='11111111-1111-1111-1111-111111111111'
 TenantId='22222222-2222-2222-2222-222222222222'
 BrokerageId='44444444-4444-4444-4444-444444444444'
 BranchId='44444444-4444-4444-4444-444444444444'
 BranchIds__0='44444444-4444-4444-4444-444444444444'
 UserType='brokerage_staff'; Roles__0='brokerage_admin'
}
foreach ($key in $fixture.Keys) { [Environment]::SetEnvironmentVariable($prefix+$key,$fixture[$key],'Process') }
$env:Frontend__AllowedOrigins__0='http://localhost:3011'
dotnet src/WAssis.Services.Api/bin/Release/net8.0/WAssis.Services.Api.dll --urls http://127.0.0.1:5087
```

4. Em outro terminal, na pasta WassisCRM/nexus-crm:

```powershell
npm ci
$env:VITE_AUTH_MODE='backend'
$env:VITE_DATA_MODE='backend'
$env:VITE_API_BASE_URL='http://127.0.0.1:5087'
npm run dev -- --host localhost --port 3011 --strictPort
```

5. Em terceiro terminal, mesma pasta: `npx playwright install chromium`, depois `npx playwright test`. Usa usuário/IDs sintéticos acima. Cria nomes/documentos sintéticos únicos por execução; verifica persistência após reload, edição, ganho, lista/Kanban, pendências e ausência de erros JavaScript. Screenshots ficam em `.screens/e2e`, ignoradas no Git. Não enviar trace contendo login a serviços externos.
6. Encerrar processos e remover somente o container/volume de teste criado para esta execução. Preservar outros ambientes. O Testcontainers do BE cria/remove suas próprias instâncias automaticamente e não depende desta fixture.
