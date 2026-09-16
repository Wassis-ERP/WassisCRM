# Continuação da remediação de segurança — 16/09/2026

## Objetivo e autorização

Dar seguimento às correções do relatório de segurança após os commits `7bea743`
(backend) e `be9627e` (frontend). O usuário autorizou correções nos dois repositórios,
instalação do SDK necessário e checkpoint com commit/push e prompt para Renato
quando a quota disponível se aproximar do limite. Branch: `codex/security-remediation-followup`.

Classificação: governada/contratual para acesso e sessão; sem desenho de tela.

## Contrato e legado

Fontes: instruções e DBML v3.1, especialmente decisão 18 e a seção de acesso.
Tabelas relacionadas: profiles, profile_filiais, perfis, role_permissions,
produtores, segurados e oportunidades. PROPRIO exige responsabilidade explícita;
GRUPO não transfere acesso entre corretoras sem vínculo válido.

Decisão: corrigir os adapters HTTP existentes e preservar contratos de dados de
negócio. Backend, migrations e enforcement serão implementados no WAssisBE.

## Etapas

- [x] Substituir a action Gitleaks que exige licença por CLI oficial com versão e
  checksum fixos; manter scanner e falha de CI em achados.
- [x] Corrigir transição de identidade/CSRF, recuperação de sessão e filiais
  disponíveis no adapter/AuthContext quando comprovadas regressões.
- [x] Alinhar gating PROPRIO com enforcement do backend e testes negativos.
- [x] Validar testes, lint e build afetados; registrar limites da validação real.
- [x] Preparar checkpoint e prompt de continuação, sem declarar Production pronta.

Arquivos prováveis: workflows, scripts de segurança, backendApi.ts/testes,
AuthContext.tsx, usePermission.ts e documentação de remediação.

## Critérios de aceite e hand-off

CI deve escanear o histórico sem depender de licença da action. Sessão por cookie
deve renovar o token CSRF após login; reload e troca de filial não podem conceder
acesso novo nem perder vínculos válidos. Permissões são resolvidas no servidor.
Registrar contratos e testes aqui; não reescrever o relatório de endpoints.
`database.ts` não requer mudança se forem preservados os contratos v3.1 acima.

## Evidências iniciais

- Frontend base: 333 testes, lint e build aprovados localmente; aviso de fontes.
- CI dos dois commits base falhou na action Gitleaks por falta de licença.
- Backend exige SDK 10.0.401, instalado nesta continuação. Docker ausente no PATH.
- O macro-plano já referenciava este micro-plano, mas o arquivo não estava no Git.

## Checkpoint

CLI com checksum implementada; histórico local sem achados. CSRF invalidado após
login; permissões sem filtro de filial alimentam o seletor. 334 testes, lint e
build aprovados; permanecem avisos de fontes. `database.ts` preservado e sem
mudança de contrato v3.1. Validação HTTP/navegador completa ainda pendente.
Demais frentes e prompt: RENATO_CONTINUATION.md e SECURITY_FOLLOWUP.md no backend.

## Segundo checkpoint — continuação autorizada

- Scanner: concluído; CI frontend 35145654570 passou testes, lint, build,
  auditoria de dependências e scan de imagem no commit d98b84c.
- CSRF/filiais: correções do adapter concluídas. Backend agora atualiza vínculos
  de filial a cada validação de sessão, incluindo concessão/revogação após login.
- Backend: transações administrativas/savepoints e datas corrigidas; ownership
  protegido contra reatribuição concorrente; NuGet Audit bloqueante.
- Integração: quatro jornadas PostgreSQL/TLS reais com role sem privilégios de
  proprietário, cobrindo HTTP/CSRF/replay/permissões/filiais/ownership/RLS/outbox.
- Nenhuma mudança de tela, database.ts ou contrato de payload de negócio nesta etapa.
- Pendente: smoke no navegador, matriz completa de módulos, Auth0 e demais
  bloqueadores listados em SECURITY_FOLLOWUP.md do backend.
- RENATO_CONTINUATION.md atualizado nos dois repositórios para o segundo checkpoint.

## Terceiro checkpoint — BFF Auth0 e smoke local

- O CRM ganhou modo `VITE_AUTH_PROVIDER=auth0`: em modo conectado apresenta apenas
  o redirecionamento corporativo e nunca recebe client secret ou token. Logout revoga
  primeiro a sessão interna e então segue para o logout OIDC do BFF; o estado local
  é limpo mesmo se a primeira chamada falhar, e o endpoint externo tenta novamente a
  revogação antes de apagar o cookie.
- Idle timeout local foi alinhado ao limite server-side de 30 minutos. O contrato
  funcional v3.1 e `database.ts` permaneceram inalterados.
- CI da branch passou a disparar automaticamente em push. Build publicado sem
  `VITE_AUTH_PROVIDER=auth0` agora falha. Lint sem avisos, 335/335 testes, auditoria
  npm e build Production com backend/Auth0 foram aprovados localmente.
- Smoke em navegador local carregou Dashboard e Segurados em modo mock; o health
  mínimo do BE respondeu 200. Login Auth0/backend não foi simulado: faltam tenant e
  PostgreSQL/Docker neste host, portanto essa jornada continua pendente.
- A integração BFF, RLS de quotes/worker, resultados e bloqueadores estão detalhados
  em `SECURITY_FOLLOWUP.md` e `SECURITY_REMEDIATION.md` do backend.
