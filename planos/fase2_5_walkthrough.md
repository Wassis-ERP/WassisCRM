# Fase 2.5 — Walkthrough (Modais e Detalhes dos Demais Funis)

Este documento resume o que foi entregue na **Fase 2.5** — uma fase-ponte entre a **Fase 2** (Kanban dinâmico) e a **Fase 4** (Integrações n8n). O objetivo foi fechar a lacuna de criação e edição manual dos funis **Sinistro**, **Financeiro**, **Emissão** e **Pós-Venda** antes de avançar para a Fase 3.

## Referências

- Plano macro: `planos/plano_de_atuacao_macro.md` (seção "FASE 2.5")
- Fase anterior: `planos/fase2_walkthrough.md`
- Migração SQL auxiliar: `planos/migrations/007_fase2_5_cobranca_oportunidade_nullable.sql`
- Projeto Supabase (teste): `https://ajuvbjukfwedwionfyqk.supabase.co`

## Decisões de arquitetura (opção C)

- **Sinistro** (evento externo): criação **manual rica**. É o cliente que avisa o sinistro; n8n não pode criar esse registro por conta própria.
- **Financeiro** (controle de inadimplência): criação **manual rica**, **independente** do Comercial/Emissão. Permite cobrança **avulsa** (sem `oportunidade_id`).
- **Emissão / Pós-Venda**: criação **primária via n8n** (Fase 4), mas com **fallback administrativo mínimo** (modal + detalhe editável) disponível desde já, com banner informativo no topo do modal.

## O que foi entregue

### Micro 1 — Fundações (ModuleAdapter + hooks + UI genérica)

1. Extensão de `ModuleAdapter` (`src/modules/types.ts`) com:
   - `createModalComponent?: ComponentType<CreateCardModalProps>`
   - `createLabel?: string`
   - `detailRoute?: (id: string) => string`
2. Hooks de CRUD por módulo (padrão TanStack Query + optimistic/invalidate):
   - `src/hooks/useSinistros.ts`
   - `src/hooks/useFinanceiroCobrancas.ts`
   - `src/hooks/useEmissoes.ts`
   - `src/hooks/usePosVendas.ts`
3. `ModuleKanbanPage` (`src/pages/ModuleKanbanPage.tsx`):
   - Botão **"+ Novo"** no cabeçalho, renderizado apenas quando o adapter declara `createModalComponent`.
   - Clique em card navega para `adapter.detailRoute(id)` quando disponível, caso contrário cai no drawer atual.

### Micro 2 — Sinistro (manual rico)

- `src/components/NovoSinistroModal.tsx` — busca/seleção de oportunidade, campos core (`numero_sinistro`, `data_sinistro`, `data_aviso`, `tipo_sinistro`, `valor_prejuizo`, `valor_indenizacao`, `observacoes`) e **metadata por ramo** (`SINISTRO_METADATA_BY_RAMO`).
- `src/pages/SinistroDetalhePage.tsx` — edição + link para a oportunidade relacionada + `ConcludeCardModal` (Concluído / Cancelado).
- Rota `/sinistros/:id` em `src/App.tsx`.
- Registro em `src/modules/sinistro/adapter.ts` (`createModalComponent`, `createLabel: 'Novo Sinistro'`, `detailRoute`).

### Micro 3 — Financeiro (cobrança, inclusive avulsa)

- `src/components/NovaCobrancaModal.tsx` — **toggle "Vinculada a apólice" × "Avulsa"**, metadata de parcela (`valor_parcela`, `numero_parcela`, `total_parcelas`, `data_vencimento`, `dias_atraso`, `forma_pagamento`). Banner alertando sobre a migração 007.
- `src/pages/FinanceiroDetalhePage.tsx` — edição + `ConcludeCardModal` (Quitado / Inadimplente).
- Rota `/financeiro/:id` em `src/App.tsx`.
- Registro em `src/modules/financeiro/adapter.ts`.
- **Migração SQL manual** `planos/migrations/007_fase2_5_cobranca_oportunidade_nullable.sql` — torna `financeiro_cobrancas.oportunidade_id` nullable. Deve ser aplicada no Dashboard Supabase antes de criar cobranças avulsas em produção.

### Micro 4 — Emissão e Pós-Venda (fallback administrativo)

- `src/components/NovaEmissaoModal.tsx` e `src/components/NovaPosVendaModal.tsx` — formulários mínimos com **banner informativo** ("Fluxo primário automatizado via n8n"), busca restrita a oportunidades com `card_status = 'won'`, metadata opcional.
- `src/pages/EmissaoDetalhePage.tsx` — edição + `ConcludeCardModal` (Emitida / Recusada). Rota `/emissoes/:id`.
- `src/pages/PosVendaDetalhePage.tsx` — edição + `ConcludeCardModal` (Concluído / Cancelado). Rota `/pos-venda/:id`.
- Registro em `src/modules/emissao/adapter.ts` e `src/modules/pos_venda/adapter.ts`.

## Como validar no front

1. Em `nexus-crm`: `npm install` (se necessário), depois `npm run dev`.
2. Aplicar (se ainda não aplicou) a migração `planos/migrations/007_fase2_5_cobranca_oportunidade_nullable.sql` no Dashboard Supabase.
3. Login com usuário do tenant de teste.
4. **Sinistros** (`/sinistros`): clicar em "+ Novo Sinistro"; preencher com e sem metadata por ramo; abrir o card → detalhe; editar; concluir como Concluído/Cancelado.
5. **Financeiro** (`/financeiro`): clicar em "+ Nova Cobrança" em ambos os modos (vinculada e avulsa); detalhe; concluir como Quitado/Inadimplente.
6. **Emissão** (`/emissoes`) e **Pós-Venda** (`/pos-venda`): criar usando o fallback; validar o banner informativo; abrir detalhe; concluir.
7. Verificar que o adapter sem `createModalComponent` (se houver futuro) **não** exibe o botão "+ Novo".

## Smoke test LGPD / RLS (manual)

Com dois usuários de tenants distintos:

1. **Sessão A**: criar Sinistro / Cobrança / Emissão / Pós-Venda no tenant A (anotar apenas prefixos de IDs).
2. **Sessão B**: confirmar que listas e Kanban do tenant B **não expõem** registros do tenant A; tentar acessar `/sinistros/<id-de-A>`, `/financeiro/<id-de-A>` etc. e validar retorno vazio/erro pela RLS.
3. **Cobrança avulsa**: garantir que `oportunidade_id = NULL` não abre brecha para leitura cruzada (RLS deve filtrar por `tenant_id` diretamente na `financeiro_cobrancas`).
4. **PII**: evitar `console.log` dos payloads completos; o app não deve persistir CPF/telefone dos envolvidos em `localStorage`.

## Pendências explícitas

- **Aplicar 007 em produção**: a migração precisa ser rodada manualmente antes de liberar a cobrança avulsa para usuários finais.
- **Fase 4 (n8n)**: substituir/gatilhar automaticamente as criações de Emissão e Pós-Venda quando a Oportunidade virar "ganho". O fallback da Fase 2.5 permanece como plano B administrativo.
- **Testes unitários**: cobrir os novos hooks e o render condicional do botão "+ Novo" quando a suíte Jest for retomada.

## Build e testes

- `npx tsc --noEmit` em `nexus-crm` → **limpo** ao fim da Fase 2.5.
- `npm run build` recomendado antes de abrir PR.
- `npm run test` quando a suíte Jest estiver alinhada aos novos módulos.

## Próximo passo (Fase 3)

Integração Supabase nas telas ainda mockadas (`SeguradosPage`, `ProdutoresPage` etc.) conforme `planos/plano_de_atuacao_macro.md`.
