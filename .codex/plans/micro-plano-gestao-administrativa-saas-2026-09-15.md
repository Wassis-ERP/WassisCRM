# Gestão administrativa SaaS — contrato e validação conectada

Status: [~] em andamento. Escopo governado/contratual, iniciado a partir de
`codex/admin-management-foundation`. Fontes: instruções/DBML v3.1, comparação
de prontidão 14/09 e documentos de prontidão 13/09.

## Recorte executável

- Reconciliar DTOs de `perfis` e `role_permissions` com o adapter conectado.
- Falhar fechado quando o backend devolver escopo de permissão desconhecido.
- Evitar mensagens de envio/aceite de convite enquanto Auth0 não estiver
  provisionado e testado; cadastro pendente não concede acesso.
- Cobrir mapeamentos e estados administrativos com Vitest e a jornada principal
  com Playwright contra API/PostgreSQL descartáveis.

Entidades: `tenants`, `filiais`, `profiles`, `perfis`, `profile_filiais` e
`role_permissions`. Operações: leitura/edição do grupo, estatísticas, busca e
paginação de usuários, inclusão/inativação, vínculos por corretora, CRUD de
perfis e matriz. Backend é o responsável pela validação, isolamento, auditoria,
identidade e resolução de permissão. `nivel_acesso` permanece descritivo.

## Gates posteriores

Auth0 Organizations/BFF, convite enviado/aceito/expirado, MFA e revogação
exigem tenant Auth0 HML, configuração e credenciais limitadas. RLS aditiva exige
equivalência com guardas atuais e banco PostgreSQL de teste. Rotação de secrets,
collector/alertas, migration singleton no deploy, storage PDF e PRD/HA exigem
infraestrutura e evidências operacionais próprias. Não marcar esses gates como
concluídos por mocks, documentação ou build.

## Legado e decisão

Refatorar o adapter e os hooks no lugar. Preservar a UI existente e o modo
memória só em desenvolvimento local. Registrar drift do `database.ts` contra
DBML v3.1 se surgir diferença fora do recorte seguro.

## Verificação

`tsc -b`, Vitest, ESLint focado, build conectado fail-closed e Playwright no
fluxo principal. Registrar comando, resultado e impedimentos reproduzíveis.
