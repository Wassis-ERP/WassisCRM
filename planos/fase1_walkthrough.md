# Walkthrough — Fase 1: Motor de Pipelines (Infraestrutura Híbrida)

## Resumo

Implementação completa do **Motor de Pipelines Dinâmico** no banco de dados do Nexus CRM, incluindo infraestrutura de **multi-tenancy**, tabelas de pipelines/etapas, refatoração da tabela de oportunidades e políticas RLS com isolamento por tenant.

---

## Marcos Alcançados

### 1. Multi-tenancy (Migração 001)

*   **Nova Tabela `public.tenants`**: Raiz de isolamento multi-tenant. Cada corretora é um tenant.
    *   Campos: `id`, `name`, `slug` (unique), `is_active`, `created_at`, `updated_at`
*   **Vinculação `profiles.tenant_id`**: Coluna adicionada para associar cada usuário a um tenant.
*   **RLS**: Habilitado na tabela `tenants`.

### 2. Motor de Pipelines (Migração 002)

*   **Novo Enum `pipeline_module`**: `comercial`, `emissao`, `pos_venda`, `financeiro`, `sinistro`
*   **Nova Tabela `public.pipelines`**: Define os funis com rótulos customizáveis.
    *   Campos: `id`, `tenant_id`, `name`, `module`, `is_active`, `won_label`, `lost_label`, `created_at`, `updated_at`
    *   `won_label` / `lost_label`: Permitem renomear "Ganho"/"Perdido" por pipeline (ex.: "Sinistro Indenizado" / "Sem Indenização")
*   **Nova Tabela `public.pipeline_stages`**: Define as etapas de cada pipeline.
    *   Campos: `id`, `pipeline_id`, `name`, `order`, `color`, `is_win_eligible`, `created_at`
    *   `is_win_eligible`: Flag que controla em quais etapas o card pode ser marcado como "ganho" (por padrão `false`)
*   **RLS**: Habilitado em ambas as tabelas.

### 3. Refatoração de `oportunidades` (Migração 003)

*   **Novo Enum `card_status`**: `pending`, `won`, `lost` — substitui o antigo `status_oportunidade`
*   **Colunas Adicionadas**: `tenant_id`, `pipeline_id`, `stage_id`, `status` (card_status), `concluded_at`
*   **Colunas Removidas**: `etapa`, `tipo_funil`, `status` (antigo)
*   **Enums Removidos**: `etapa_funil`, `tipo_funil`, `status_oportunidade`

#### Decisão Arquitetural Crítica: Status vs. Etapa
A conclusão (ganho/perdido) é registrada como **status na entidade**, NÃO como etapa do pipeline. O card permanece na etapa onde estava, preservando a informação de **onde no funil** foi ganho/perdido. Isso viabiliza o funil analítico com perdas por etapa e % de conversão.

**Regras:**
- **Perdido** → pode ser marcado em qualquer etapa
- **Ganho** → somente em etapas com `is_win_eligible = true`
- **`concluded_at`** → timestamp preenchido no momento da conclusão

### 4. Propagação de `tenant_id` (Migração 004)

Coluna `tenant_id uuid REFERENCES tenants(id)` adicionada em:

| Tabela | Índice criado |
|--------|---------------|
| `segurados` | `idx_segurados_tenant` |
| `origens` | `idx_origens_tenant` |
| `ramos` | `idx_ramos_tenant` |
| `motivos_perda` | `idx_motivos_perda_tenant` |
| `atividades` | `idx_atividades_tenant` |
| `anexos` | `idx_anexos_tenant` |
| `metas` | `idx_metas_tenant` |

### 5. Políticas RLS — Isolamento por Tenant (Migração 005)

*   **Nova Função `get_user_tenant_id()`**: Retorna o `tenant_id` do usuário logado a partir de `profiles`.
*   **Todas as policies antigas foram removidas** e substituídas por uma policy única por tabela: `"Isolamento por tenant" ... USING (tenant_id = public.get_user_tenant_id())`.
*   Pipeline Stages herdam isolamento via `pipeline_id IN (SELECT id FROM pipelines WHERE tenant_id = ...)`.

### 6. Tipos TypeScript (database.ts)

*   Arquivo `nexus-crm/src/types/database.ts` gerado automaticamente via Supabase Gen Types.
*   Contém tipagem completa para todas as 14 tabelas incluindo `Row`, `Insert`, `Update` e `Relationships`.
*   Novos enums disponíveis: `card_status`, `pipeline_module`.

---

## Resumo do Schema Final

| Tabela | tenant_id | RLS | Observação |
|--------|-----------|-----|------------|
| `tenants` | — (é a raiz) | ✅ | Nova. Raiz multi-tenant |
| `pipelines` | ✅ NOT NULL | ✅ | Nova. Motor de funis |
| `pipeline_stages` | via pipeline | ✅ | Nova. Etapas dos funis |
| `profiles` | ✅ | ✅ | Atualizada |
| `user_roles` | — | ✅ | Sem alteração |
| `role_permissions` | — | ✅ | Sem alteração |
| `oportunidades` | ✅ | ✅ | Refatorada (pipeline_id, stage_id, status card_status) |
| `segurados` | ✅ | ✅ | Atualizada |
| `origens` | ✅ | ✅ | Atualizada |
| `ramos` | ✅ | ✅ | Atualizada |
| `motivos_perda` | ✅ | ✅ | Atualizada |
| `atividades` | ✅ | ✅ | Atualizada |
| `anexos` | ✅ | ✅ | Atualizada |
| `metas` | ✅ | ✅ | Atualizada |

---

## Enums Ativos no Banco

| Enum | Valores | Usado por |
|------|---------|-----------|
| `app_role` | admin, vendedor, visualizador | user_roles, role_permissions |
| `card_status` | pending, won, lost | oportunidades.status |
| `pipeline_module` | comercial, emissao, pos_venda, financeiro, sinistro | pipelines.module |
| `tipo_pessoa` | PF, PJ | segurados.tipo |

---

## Funções no Banco

| Função | Retorno | Uso |
|--------|---------|-----|
| `get_user_tenant_id()` | uuid | Todas as policies RLS de tenant |
| `get_user_role(_user_id)` | app_role | Verificação de papel |
| `has_role(_role, _user_id)` | boolean | Verificação de papel específico |
| `is_admin_or_vendedor(_user_id)` | boolean | Verificação de acesso |

---

## Validação de Segurança (LGPD)

- [x] Isolamento completo por tenant via RLS — nenhum tenant acessa dados de outro
- [x] Função `get_user_tenant_id()` usa `SECURITY DEFINER` para acesso seguro
- [x] Todas as 14 tabelas possuem RLS habilitado
- [x] Nenhum dado pessoal exposto em tabelas sem proteção

---

## Impacto no Front-end (Esperado)

As seguintes páginas **irão quebrar** porque referenciavam colunas removidas (`etapa`, `tipo_funil`, `status` antigo):

| Página | Problema esperado | Correção (Fase 2) |
|--------|------------------|-------------------|
| `KanbanPage.tsx` | Referência a `etapa` | Migrar para `pipeline_id` + `stage_id` |
| `OportunidadeDetalhePage.tsx` | Referência a `etapa`, `status` | Migrar para `stage_id`, `card_status` |
| `OportunidadesPage.tsx` | Referência a `etapa`, `tipo_funil` | Migrar para pipeline dinâmico |
| `OportunidadesListPage.tsx` | Referência a `etapa`, `status` | Migrar para pipeline dinâmico |

---

## Próxima Etapa do Plano Macro

**Fase 2 — Materialização do Kanban e Telas**: Construir o componente `<KanbanBoard />` genérico no front-end e conectar ao Motor de Pipelines, configurando o primeiro funil completo (Pipeline Comercial).
