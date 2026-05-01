# Fase 2 — Walkthrough (Kanban multi-módulo)

Este documento resume o que foi entregue na **Fase 2** e como validar em ambiente local, com foco em **LGPD** e **isolamento por tenant** (RLS).

## Referências

- Plano detalhado: `planos/fase2_kanban_dinamico_plan.md`
- Plano macro: `planos/plano_de_atuacao_macro.md`
- Projeto Supabase (teste): `https://ajuvbjukfwedwionfyqk.supabase.co`

## O que foi entregue

1. **Kanban genérico** (`KanbanBoard`, `KanbanColumn`, `PipelineSelector`, `ConcludeCardModal`) com TanStack Query, DnD com update otimista e conclusão (Ganho/Perdido).
2. **Adapters por módulo** (`comercial`, `sinistro`, `emissao`, `pos_venda`, `financeiro`) registrados em `registry.ts`.
3. **Comercial end-to-end**: criação (`NovaOportunidadeModal`), lista, detalhe, cards, motivo de perda ao concluir como perdido.
4. **Demais módulos**: cards visuais (`KanbanCardShell` + `makeKanbanCard`), rotas `/sinistros`, `/emissoes`, `/pos-venda`, `/financeiro` e itens no menu.
5. **Filtros**: `applyKanbanFilters` respeitando `availableFilters` por adapter; toggle **Ativos / Concluídos / Todos**; totais por coluna (soma de `primaryValue`).
6. **Bootstrap**: migração SQL de seed idempotente (tenant, pipelines, stages, lookups) — ver plano Fase 2.

## Como validar no front

1. Em `nexus-crm`: `npm install` (se necessário), depois `npm run dev`.
2. Login com usuário do tenant de teste.
3. **Oportunidades** (`/oportunidades`): Kanban e Lista; filtros; toggle Ativos/Concluídos; Nova Oportunidade; abrir card → detalhe; Ganho/Perdido.
4. **Outros funis**: menu lateral → Sinistros, Emissão, Pós-Venda, Financeiro; alternar funil se houver mais de um; DnD e conclusão quando houver dados.

## Smoke test LGPD / RLS (manual)

> Executar com **dois usuários de tenants diferentes** (ou service role apenas em ambiente controlado). Objetivo: nenhum vazamento cruzado de dados pessoais ou comerciais.

1. **Sessão A**: login no tenant A. Abrir Kanban Comercial e anotar IDs de `oportunidades` visíveis (apenas prefixo, sem expor em logs públicos).
2. **Sessão B**: login no tenant B. Confirmar que **não** aparecem registros do tenant A (listas, Kanban, detalhe por URL direta deve falhar ou retornar vazio conforme RLS).
3. **Console / rede**: evitar `console.log` de e-mail, CPF, telefone ou payloads completos de `segurados` em produção; o app não deve persistir PII em `localStorage` para o fluxo de oportunidades (Fase 2).
4. **Motivo de perda**: ao concluir como perdido, só exibir e gravar o necessário; não duplicar observações sensíveis em campos indexados sem necessidade.

## Advisors Supabase (security + performance)

A execução automática via MCP foi **interrompida** na sessão anterior. Rodar manualmente no projeto:

- Dashboard Supabase → **Advisors** (Security e Performance), ou
- CLI: `supabase db lint` / documentação oficial do projeto, conforme sua stack.

Registrar achados em issue ou no início da **Fase 3**.

## Build e testes

- `npm run build` em `nexus-crm` deve passar após os ajustes de TypeScript da Fase 2 (Micro 7).
- `npm run test`: executar antes de PR; adicionar testes unitários para `applyKanbanFilters` quando a suíte Jest estiver alinhada aos novos módulos.

## Próximo passo (Fase 3)

Integração Supabase nas telas ainda mockadas (`SeguradosPage`, `ProdutoresPage`, etc.) conforme `planos/plano_de_atuacao_macro.md`.
