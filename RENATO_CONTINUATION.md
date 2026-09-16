# Prompt para Renato continuar

Continue a remediação de segurança do WAssisBE e WassisCRM a partir da branch
`codex/security-remediation-followup`, publicada nos dois repositórios GitHub
`Wassis-ERP/WAssisBE` e `Wassis-ERP/WassisCRM`.

Antes de alterar código, faça fetch, confira status e preserve alterações locais.
Leia AGENTS.md aplicáveis, SECURITY_AUDIT.md, SECURITY_REMEDIATION.md e, principalmente,
SECURITY_FOLLOWUP.md no backend. No CRM, leia o micro-plano de remediação em
`.codex/plans` e o contrato DBML/instruções v3.1. O backend fica em repositório separado.

O SDK exigido é 10.0.401, já instalado na máquina de origem. Para restore com cache
desatualizado, use `dotnet restore WAssisInsurance.sln --locked-mode --no-http-cache`.
Não altere versões/lockfiles somente para contornar um cache local.

Primeiro valide este checkpoint e verifique os workflows GitHub. O scanner foi
mantido, agora com CLI oficial e checksum fixo, para resolver a falha de licença
da action. Corrigimos CSRF após login, criação prematura de DbContext na autenticação,
lista de permissões por vínculo, divergência de filial entre autorização/dados,
PROPRIO em Segurados/Oportunidades e quotas separadas por usuário/tenant/IP.

Execute testes reais de regressão antes de considerar qualquer SEC encerrado.
O teste SecurityServicesPostgresTests pode usar um cluster descartável loopback
via scripts/test-security-postgres.ps1; ele não substitui toda a suíte Testcontainers.
Priorize transações aninhadas em Administração e o TLS da fixture Staging, conforme
SECURITY_FOLLOWUP.md. Amplie a matriz de ownership e os testes HTTP de cookie/CSRF,
logout/replay e troca de filial, incluindo perfil com vínculos alterados na mesma sessão.
PROPRIO em módulos sem ownership implementado é negado; não reabra acesso amplo.

Depois conclua as frentes pendentes: Auth0/Production e ciclo de sessão; PDF/OCR
isolado por fila durável/storage privado/streaming; RLS/worker/grants; controles de
PII e evidências de infraestrutura. Aproveite a arquitetura existente. Não habilite
autenticador de HML em Production, não desative testes/gates nem relaxe TLS/RLS.
Não invente prazos legais, vínculos de dados antigos, segredos nem evidências de deploy.

Implemente tudo que estiver dentro do escopo com segurança, valide backend/frontend
e atualize a documentação com comandos/resultados e pendências reais. Pergunte apenas
por decisões externas indispensáveis enquanto continua trabalho independente.
Não faça deploy nem aplique migrations em produção. Ao encerrar, entregue commits,
status dos checks e próximos passos; não declare o sistema pronto enquanto restarem bloqueadores.
