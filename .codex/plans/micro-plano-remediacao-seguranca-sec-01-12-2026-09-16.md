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

- [~] Substituir a action Gitleaks que exige licença por CLI oficial com versão e
  checksum fixos; manter scanner e falha de CI em achados.
- [ ] Corrigir transição de identidade/CSRF, recuperação de sessão e filiais
  disponíveis no adapter/AuthContext quando comprovadas regressões.
- [ ] Alinhar gating PROPRIO com enforcement do backend e testes negativos.
- [ ] Validar testes, lint e build afetados; registrar limites da validação real.
- [ ] Preparar checkpoint e prompt de continuação, sem declarar Production pronta.

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
