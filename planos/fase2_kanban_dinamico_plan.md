# FASE 2 — Plano de Implementação: Kanban Dinâmico Multi-módulo

> **Status geral:** ✅ Concluída — Micros 1 a 7 entregues (advisors Supabase via MCP pendente de execução manual se a autenticação MCP for interrompida).
> **Relacionado:** `planos/arquitetura_de_pipelines_crm.md`, `planos/plano_de_atuacao_macro.md`.

## Objetivo

Colocar o Motor de Pipelines da Fase 1/1.1 visualmente na tela, entregando um `<KanbanBoard />` genérico capaz de alternar entre os módulos `comercial`, `sinistro`, `emissao`, `pos_venda` e `financeiro`, com **Comercial como primeiro funil 100% funcional** e os demais plugáveis via `ModuleAdapter`.

## Princípios de execução

1. **Micro-execuções com validação humana:** cada micro é entregue, validado pelo usuário (humano) e só então a próxima é iniciada.
2. **Isolamento por tenant:** toda query respeita `tenant_id` via RLS; inserts populam `tenant_id` + `responsavel_id` a partir de `AuthContext`.
3. **LGPD:** nenhum dado sensível (CPF/CNPJ, e-mail, telefone) trafega em logs nem em cache sem RLS.
4. **Sem deleção de tabelas/entidades sem autorização explícita.**
5. **Visual preservado:** manter o design atual (font-black, uppercase, cantos arredondados) enquanto troca o motor de dados.

## Arquitetura adotada

- **TanStack Query** (`@tanstack/react-query`) com `QueryClient` em `src/lib/queryClient.ts` e `queryKeys` padronizados.
- **`ModuleAdapter`** em `src/modules/types.ts` + registro em `src/modules/registry.ts`.
  - Cada módulo provê: `fetchCards`, `updateStage`, `conclude`, `CardComponent`, `availableFilters`, `module`.
- **Hooks de board:** `usePipelines`, `usePipelineStages`, `useKanbanCards`, `useMoveCard`, `useConcludeCard`, `useActivePipeline`.
- **Hooks de domínio:** `useLookups` (ramos/origens/seguradoras/motivos_perda), `useSegurados`, `useOportunidades`.
- **Componentes:** `<KanbanBoard />`, `<KanbanColumn />`, `<PipelineSelector />`, `<ConcludeCardModal />`.
- **Schemas dinâmicos:** `src/modules/<modulo>/fieldSchema.ts` define campos tipados + metadata JSONB por ramo/tipo.

---

## Micro-execuções

### ✅ Micro 1 — Bootstrap SQL (seed idempotente)

- Migração `006_fase2_bootstrap_seed.sql` aplicada no Supabase (`ajuvbjukfwedwionfyqk`).
- Vincula `profiles` ao tenant W.Assis; cria 5 pipelines (comercial, sinistro, emissao, pos_venda, financeiro) com stages padrão.
- Popula lookups mínimos (`ramos`, `origens`, `seguradoras`, `motivos_perda`) com `ON CONFLICT DO NOTHING`.

### ✅ Micro 2 — Infraestrutura de dados no front

- `@tanstack/react-query` + devtools instalados, `QueryClientProvider` no `main.tsx`.
- `queryClient.ts` com defaults (`staleTime`, `gcTime`, `retry`) e `queryKeys` para pipelines/stages/cards/lookups.
- `useMoveCard` e `useConcludeCard` com **updates otimistas** + rollback em erro.
- Adapters vazios de todos os 5 módulos registrados.

### ✅ Micro 3 — `<KanbanBoard />` genérico + `PipelineSelector`

- `KanbanColumn` com colapso, indicador `is_win_eligible` e dropzone.
- `KanbanBoard` agnóstico (busca stages+cards, DnD otimista, delega render ao `CardComponent`).
- `useActivePipeline(module)` com auto-seleção do primeiro pipeline disponível.
- `KanbanPage` reescrita como thin wrapper, recebe apenas `filters` e `module`.

### ✅ Micro 4 — Módulo Comercial end-to-end

- `UserProfile` estendido com `tenantId` + `fullName`; `AuthContext` popula via `profiles`.
- `NovaOportunidadeModal` persiste em `public.oportunidades` com metadata JSONB por ramo.
- `ComercialCard` definitivo (data colorida por status, ramo tag, avatar, botões Ganho/Perdido em hover).
- `OportunidadeDetalhePage` reescrita: joins via `useOportunidade`, stages reais, selects de lookups, salvar + botões Ganho/Perdido.
- `OportunidadesListPage` migrada para Supabase via `useKanbanCards` (sem mocks, sem `localStorage`).
- `OportunidadesPage` limpo: `localStorage` de oportunidades e seletor de pipeline legado removidos.
- `ConcludeCardModal` com seleção obrigatória de motivo de perda (quando houver motivos cadastrados).

### ✅ Micro 5 — Adapters e cards dos demais módulos

- `KanbanCardShell` compartilhado + `makeKanbanCard(options)` para fabricar cards com `accent`, `accentBar` e `LeftIcon` por módulo.
- Cards: `ComercialCard` (primary), `SinistroCard` (danger+AlertTriangle), `EmissaoCard` (info+FileText), `PosVendaCard` (warning+LifeBuoy), `FinanceiroCard` (success+DollarSign).
- Adapters dos 4 módulos atualizados (tag `default` de ramo adicionada, cleanup do embed `profiles` não exposto).
- `GenericCardPlaceholder` removido.
- Nova `ModuleKanbanPage` + rotas `/sinistros`, `/emissoes`, `/pos-venda`, `/financeiro` e itens no Sidebar.

### ✅ Micro 6 — Filtros dinâmicos + aba Ativos/Concluídos

- Tipo `KanbanFilters` estendido com `status: 'active' | 'concluded' | 'all'`; `KanbanFilterKey` passa a excluir `status` (toggle universal).
- `src/modules/filters.ts` com `applyKanbanFilters(cards, filters, availableFilters)` — aplica apenas filtros listados no adapter (ramo, origem, produtor, tipoNegocio, dataRetorno, dataVigencia, search).
- `KanbanBoard` agora recebe `filters: KanbanFilters` (removido `searchTerm` e `includeConcluded` — derivados de `filters.status`).
- `KanbanColumn` exibe **total** (soma de `primaryValue` dos cards) no header em formato compacto (`R$ 12K`, `R$ 1.2M`).
- `OportunidadesPage` alinhada a `KanbanFilters`: toggle **Ativos / Concluidos / Todos**; selects de Ramo e Origem populados via `useRamos` / `useOrigens`; novo filtro `tipoNegocio` (novo/renovacao/endosso); `etapa`/`produtor` mock removidos.
- `OportunidadesListPage` migrada para `KanbanFilters` + `applyKanbanFilters`.
- `ModuleKanbanPage` ganha mesmo toggle + filtros dinâmicos (só renderiza os filtros suportados pelo `availableFilters` do adapter: search, ramo, dataRetorno, dataVigencia).

### ✅ Micro 7 — Hardening, testes e publicação

- Walkthrough `planos/fase2_walkthrough.md` (checklist LGPD/RLS manual + nota sobre advisors).
- Atualização de `.context/docs/project-overview.md` e `.context/workflow/status.yaml`.
- Ajustes de TypeScript que bloqueavam `npm run build` (`App.tsx`, `PrivateRoute`, `AuthContext`, `LoginPage`).
- **Advisors Supabase:** rodar no Dashboard do projeto (Security/Performance) ou refazer autenticação MCP quando estável; não depende do código do repositório.
- **Jest:** script `npm run test` ainda não exposto em `nexus-crm/package.json` neste workspace; alinhar com `AGENTS.md` numa PR futura se necessário.
- Commit Conventional na raiz do repositório Git.

---

## Esquema de dados (Fase 1/1.1 — referência)

- **`pipelines`**: `id`, `tenant_id`, `module`, `name`, `won_label`, `lost_label`, `is_active`.
- **`pipeline_stages`**: `id`, `pipeline_id`, `order`, `name`, `color`, `is_win_eligible`.
- **`oportunidades`**: hub central, `status card_status (pending/won/lost)`, `stage_id`, `metadata jsonb`, FKs para ramos/origens/seguradoras/motivos_perda/segurados/profiles.
- **`sinistros`, `emissoes`, `pos_vendas`, `financeiro_cobrancas`**: tabelas módulo-específicas, todas com `pipeline_id`, `stage_id`, `status card_status`, `metadata jsonb`, `tenant_id`.

## Critérios de aceite da Fase 2

- Kanban troca entre os 5 módulos; cada um tem pelo menos um pipeline seed.
- Comercial permite criar, mover, editar, concluir (ganho/perdido com motivo) ponta-a-ponta.
- Lista Comercial espelha o Kanban (mesma fonte Supabase).
- Nenhum `localStorage` de oportunidades/segurados; mocks mantidos apenas em áreas ainda não portadas (Segurados/Produtores são Fase 3).
- RLS bloqueia leituras cruzadas entre tenants (checklist manual em `planos/fase2_walkthrough.md`).
- `npm run build` em `nexus-crm` passa após Micro 7.

