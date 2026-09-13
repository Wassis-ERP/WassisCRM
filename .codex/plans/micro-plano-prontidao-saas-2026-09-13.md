# Prontidão SaaS — recorte P0

## Autorização e objetivo

Pedido de 13/09/2026 amplia o trabalho para integração frontend/BE, com backend exclusivamente em `C:\dev\WAssisBE`. Preservar o histórico de frontend demonstrativo sem confundi-lo com aceite de SaaS. Branch `codex/saas-production-readiness`, base CRM `7f1e25d`, BE `0a8d709`.

## Contrato e legado

Fonte: instruções/DBML v3.1 e relatório consolidado. `segurados`: grupo em tenant_id, corretora proprietária em filial_id; tipos PF/PJ, status Prospecto/Ativo/Inativo, CPF/CNPJ obrigatório fora de Prospecto. `profiles`, `profile_filiais` e `perfis`: autorização efetiva pertence ao backend. DTOs ingleses traduzidos no adapter HTTP, sem alterar DBML. `database.ts` não é fonte para inventar contrato remoto.

Decisão: preservar demonstração local; impedir memória em modo backend e oferecer apenas operações com endpoint dedicado. Módulos sem integração informam pendência. Oportunidades agora resolve pipeline e lookups por HTTP, sem alterar o layout original.

## Execução

Correção explícita do usuário em 13/09: preservar integralmente a experiência existente. Sidebar, Header, SeguradosPage, NovoSeguradoModal, SeguradoModal, SeguradoDetalhePage, OportunidadesPage, Kanban/lista e detalhe são os alvos. As superfícies simplificadas ConnectedWorkspace/ConnectedOpportunities foram removidas antes do commit. Integração por hooks/adapters existentes, catálogos HTTP com escopo e estados de pendência locais. Prioridade confirmada: Segurados e em seguida Oportunidades. Conclusão de oportunidade permanece na etapa original conforme contrato; flags de elegibilidade são verificadas no BE.

- [x] Build/runtime exige auth/data backend e API HTTPS; mock só em desenvolvimento explícito.
- [x] Inventário de 53 imports de memória, fronteira bloqueada e seed conectado impedido.
- [x] Segurados e Oportunidades persistidos via hooks/adapters e interface original; demais operações com pendência clara.
- [x] Vitest, TypeScript/build, lint focado, audit, Docker e Playwright com PostgreSQL. Lint global: 27 erros legados fora do recorte.
- [~] ADRs/runbooks e pendências P1/P2 documentados; fechamento de commits/PRs separados.

Arquivos prováveis: `vite.config.ts`, lib de ambiente, adapter/banco em memória, cliente HTTP, ponto de entrada/App, componentes conectados, testes. Nenhum secret real ou `.env` será versionado. Nenhuma ação em infraestrutura publicada.

## Aceite e hand-off

Build inválido falha. Login inválido não cria sessão/mock. Playwright validou criar/editar/reload de Segurados, criar/editar/reload/concluir Oportunidades, lista/Kanban, pendências e ausência de pageerrors em desktop 1440x900/zoom 100%. database.ts comparado ao DBML v3.1 para ambos os módulos, sem alteração necessária. Drift e nulabilidade residuais do BE registrados em docs/prontidao-saas-2026-09-13.md. Catálogos de leitura e filiais integrados; diretório/perfis/RBAC persistidos e CRUD administrativo pendentes. Sem reconsolidar o hand-off amplo por consequência.
