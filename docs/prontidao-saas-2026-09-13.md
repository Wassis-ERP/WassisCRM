# Integração WassisCRM/WAssisBE — 13/09/2026

## Resultado

PRs separados: [CRM #50](https://github.com/Wassis-ERP/WassisCRM/pull/50) e [BE #30](https://github.com/Wassis-ERP/WAssisBE/pull/30), sem merge ou deploy. A lista exata de arquivos e commits está no diff de cada PR.

Segurados e depois Oportunidades passaram pela jornada em PostgreSQL descartável: login, criar/editar, reload, vínculo do negócio ao segurado, valores/data e ganho. **Layout original preservado**: Sidebar/Header, páginas, modais, lista, Kanban e detalhes. ConnectedWorkspace/ConnectedOpportunities não integram a entrega. Funcionalidades sem endpoint informam integração pendente, sem simular salvamento.

O aplicativo inteiro ainda não está pronto para produção. Repositórios separados em `C:\dev\WassisCRM` e `C:\dev\WAssisBE`, preservando caminhos existentes. Nenhum deploy, alteração em banco publicado ou rotação de secrets foi feito.

## Mudanças e contrato

- Vite/environmentPolicy recusam build com auth/data diferentes de backend ou API inválida/sem HTTPS. Mock é explícito e exclusivo do desenvolvimento local.
- dataMode/inMemoryDb/adapter bloqueiam memória e seed conectados. Routes liberadas: Segurados e Oportunidades; demais operações têm aviso ou ficam desabilitadas na interface original.
- Hooks/adapter comercial usam endpoints existentes de filiais/catálogos/funis/etapas com lista fechada. Responsável limita-se à identidade atual até existir diretório real. Autorização efetiva permanece no BE.
- backendDomainApi traduz DTOs e valida respostas básicas. PUT preserva campos anteriores/desconhecidos. Ganho/perda respeitam flags sem mover etapa. Sem novos dados de negócio em JSON.
- backendApi: timeout 15 s, cancelamento, correlação UUID, sem retry de escrita, descarte de sessão inválida e mensagens sanitizadas. Ver ADR de sessão.
- Routes lazy/chunks por módulo. Entrada medida: aproximadamente 274 KB minificado/83 KB gzip; não é o total do aplicativo. Chunks demonstrativos permanecem no artefato, com rotas/adapter bloqueados. Não comparar esse número diretamente ao monólito antigo.
- Fontes locais mantendo Rubik/Mulish; HSTS; avatar externo usa iniciais; links HTTP(S). Docker sem root, bases por digest, Actions por SHA, SBOM/provenance e scan no CI.

DBML/instruções v3.1: trechos de Segurados e Oportunidades de database.ts comparados, sem necessidade de alteração. O adapter usa nomes atuais e traduz DTOs ingleses. Drift residual no BE: public.segurados/erp e legado de nulabilidade. Vínculo novo de renovação permanece pendente; vínculo existente é preservado. Alguns campos estendidos de Segurados usam `valor ?? anterior` no handler e ainda não permitem limpar por null. Não certificar edição completa desses campos.

Pendentes: diretório/perfis/RBAC persistidos; CRUD de catálogos; contatos/tarefas/notas/anexos/campos personalizados/cotações nos detalhes; Propostas, Apólices, Pós-venda, Sinistros, Financeiro, Plataforma e demais routes. Ver inventário de memória.

## Verificação

Na pasta nexus-crm: `npm ci`, `npm test`, `npm run build` com VITE_AUTH_MODE/VITE_DATA_MODE=backend e VITE_API_BASE_URL HTTPS; `npm audit --audit-level=moderate`; `npx playwright test` com fixture de e2e-local.md.

Vitest: 329 testes passaram antes do teste adicional de preservação de renovação. TypeScript/build e lint focado passaram; audit zero vulnerabilidades. Lint global executado: 27 erros preexistentes em useEntityTabsState.test.ts, ConcludeCardModal.tsx e inMemoryQueryBuilder.ts. Nenhum novo any ou supressão de regra no diff.

Playwright: jornada completa em 1440×900, zoom 100%, sem pageerror ou overflow horizontal. Evidências ignoradas em nexus-crm/.screens/e2e. Imagens Docker compilaram. Smoke CRM: HTTP 200, UID/GID 101, read-only, cap-drop=ALL, no-new-privileges, tmpfs /tmp; CSP/HSTS presentes. O warning Docker sobre VITE_AUTH_MODE é heurístico: o valor público é backend, não uma credencial.

## Passos manuais antes de publicar

1. Revisar ambos os PRs/checks; não fazer merge/deploy automático desta entrega.
2. Rotacionar credenciais comprometidas de HML e montar secrets conforme runbook BE, mediante autorização operacional. Habilitar Staging opt-in com hashes; fixture sintética nunca deve ser usada fora de teste descartável.
3. Parar worker; migration singleton; validar schema; atualizar API/worker por digest; readiness/SHA; manter uma réplica. A nova outbox exige essa ordem.
4. **Alterar porta interna CRM/Traefik de 80 para 8080** e healthcheck para a imagem sem root. O pipeline CRM ainda possui webhook Portainer: não fazer merge antes de coordenar a porta.
5. Validar as duas jornadas em HML com dados autorizados; conferir headers, fontes e avatares publicados.
6. PRD: identidade real, sessão, RBAC/RLS, módulos restantes, collector/alertas, idempotência de seguradoras, storage/malware/streaming, limites no proxy, backup/restore/PITR e separação de ambientes.
