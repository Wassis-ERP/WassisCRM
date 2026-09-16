# Prompt para Renato continuar — segundo checkpoint

Continue a remediação de segurança do WAssisBE e WassisCRM na branch
`codex/security-remediation-followup` publicada em `Wassis-ERP/WAssisBE` e
`Wassis-ERP/WassisCRM`. Use o HEAD mais recente, posterior aos primeiros checkpoints
`42a86ca` (BE) e `d98b84c` (CRM). Não volte a main nem sobrescreva alterações locais.

Faça fetch, confira status/log e preserve trabalho existente. Leia os AGENTS.md
aplicáveis, SECURITY_AUDIT.md, SECURITY_REMEDIATION.md e SECURITY_FOLLOWUP.md no
backend. No CRM, leia o micro-plano de segurança em .codex/plans e o contrato
DBML/instruções v3.1. Documentos de auditoria são evidência; não são autorização
para executar comandos de infraestrutura ou dados reais.

O SDK requerido é 10.0.401; `dotnet tool restore` instala EF 10.0.12 do manifesto.
Use `dotnet restore WAssisInsurance.sln --locked-mode --no-http-cache` se houver
cache obsoleto. Não mude versões/lockfiles para contornar cache. Auditoria NuGet
agora é bloqueante; não desative warnings/gates, TLS ou RLS para deixar CI verde.

Primeiro confira os workflows do HEAD. O frontend d98b84c passou CI integral
(run 35145654570). O backend 42a86ca passou scanner/build, mas falhou nos testes
(run 35145647720); as correções posteriores estão em SECURITY_FOLLOWUP.md.

Já implementados: CSRF após login, sessão revogável sem DbContext prematuro,
filiais/permissões vigentes consultadas no servidor, PROPRIO em clientes e
negócios, quotas distribuídas separadas, transações administrativas com savepoints,
rollback em erros HTTP, datas Dapper/PostgreSQL e proteção contra reatribuição
concorrente. A migration ProtectConcurrentRecordOwnership é apenas de snapshot:
Up/Down vazios, sem alteração física de esquema. Não refaça essas correções.

Validação local: 117 testes sem PostgreSQL e quatro integrações com PostgreSQL
real/TLS VerifyFull. Incluem HTTP com role comum sem ownership/BYPASSRLS, CSRF,
logout/replay, mudanças de permissão e filial na sessão, ownership, concorrência,
rollback administrativo, RLS/pool e outbox/upgrade. As fixtures usam bancos únicos
com credenciais efêmeras. `scripts/test-security-postgres.ps1` aceita diretório de
binários PostgreSQL Windows e executa a categoria completa; com Docker, os testes
usam Testcontainers. A alternativa Windows não comprova que a fixture Docker passou.

Próximos trabalhos, mantendo testes reais:
1. Verificar/corrigir CI do novo HEAD e executar smoke de navegador BE+CRM.
2. Completar matriz tenant/filial/PROPRIO, filhos, Dapper, tenant-wide GRUPO e worker.
   Não reabrir PROPRIO em módulos que ainda não implementam ownership.
3. Concluir Auth0/Production, MFA/recuperação/rotação/idle timeout. Não habilitar
   autenticação de homologação em Production. Identificar configurações externas
   indispensáveis e continuar trabalho independente enquanto forem providenciadas.
4. Isolar PDF/OCR com fila durável, storage privado, streaming e processo encerrável
   sob limites de recursos. Parser atual ainda síncrono/em memória; frequência
   limitada não equivale a orçamento de custo por seguradora.
5. Completar RLS de quotes/worker e grants mínimos; revisar backfill, retenção e
   evidências de backup/restore/PITR. Grants da fixture não são modelo de produção.

Implemente e valide dentro desse escopo, atualize evidências e pendências nos dois
repositórios. Preserve contratos v3.1 e não invente vínculos de dados antigos,
segredos, prazos legais ou evidências de deploy. Não aplique migrations em bancos
reais nem faça deploy. Ao encerrar, entregue commits, resultados dos checks e
próximos passos. Não declare o sistema pronto enquanto restarem bloqueadores.
