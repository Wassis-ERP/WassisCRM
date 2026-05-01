# Fase 1 — Motor de Pipelines: Plano de Implementação (v2)

> **Atualizado em:** 09/04/2026 — Incorpora decisões de arquitetura discutidas sobre status vs. etapa, multi-tenancy e elegibilidade de ganho.

## Objetivo

Construir a infraestrutura de banco de dados que permite múltiplos funis dinâmicos (Pipelines), com etapas configuráveis, conclusões por **status** (ganho/perdido) preservando a etapa de origem, e preparar toda a base para multi-tenancy.

> **IMPORTANTE:** Escopo estrito desta fase: Apenas back-end (Supabase). Nenhuma alteração de front-end. Sem `custom_properties` JSONB por enquanto. Sem seed data.

---

## Contexto da Fase 0 (Já entregue)

| Camada | Entregável |
|--------|-----------|
| Auth | `AuthContext` com fetch completo (Sessão + Perfil + Permissões) |
| RBAC | `role_permissions` (16 registros), enum `app_role`, hook `usePermission` |
| RLS | Habilitado em todas as tabelas existentes |
| Tabelas | `profiles`, `user_roles`, `segurados`, `oportunidades`, `atividades`, `anexos`, `metas`, `origens`, `ramos`, `motivos_perda`, `role_permissions` |

---

## Decisões Arquiteturais

### 1. Conclusão por STATUS, não por Etapa

A conclusão de um card (ganho/perdido) é registrada como **status na entidade**, não como uma coluna/etapa do pipeline. O card **permanece na etapa onde estava** quando foi concluído, preservando a informação vital de **onde** no processo ele foi ganho ou perdido.

```
┌─────────────────────────────────────────────────────┐
│                   PIPELINE                          │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Etapa 1  │→ │ Etapa 2  │→ │ Etapa 3  │  ...     │  ← stages (tramitação)
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│  A qualquer momento, em QUALQUER etapa:             │
│    • Card pode ser marcado como PERDIDO ❌          │
│    • Card continua PENDENTE (padrão) ⏳            │
│                                                     │
│  Somente em etapas com is_win_eligible = true:      │
│    • Card pode ser marcado como GANHO ✅            │
│                                                     │
│  O card NÃO sai da etapa. Apenas muda de status.   │
└─────────────────────────────────────────────────────┘
```

Isso viabiliza o **funil analítico** com perdas por etapa, % de conversão entre etapas e pendentes por etapa:

```sql
-- Funil de conversão (reproduz o gráfico de barras)
SELECT 
  ps.name, ps."order",
  COUNT(*) FILTER (WHERE o.status = 'lost')    AS perdas,
  COUNT(*) FILTER (WHERE o.status = 'pending')  AS pendentes,
  COUNT(*) FILTER (WHERE o.status = 'won')      AS ganhos,
  SUM(o.premio_liquido) FILTER (WHERE o.status != 'lost') AS valor_ativo
FROM oportunidades o
JOIN pipeline_stages ps ON o.stage_id = ps.id
WHERE o.pipeline_id = $1
GROUP BY ps.name, ps."order"
ORDER BY ps."order";
```

### 2. Elegibilidade de Ganho (`is_win_eligible`)

Nem toda etapa permite marcar como "ganho". Um negócio comercial precisa chegar até "Orçamento Enviado"; um sinistro precisa chegar até "Reparo Concluído". A regra é configurável por corretora:

| Pipeline | Etapas elegíveis para ganho | Cenário |
|----------|---------------------------|---------|
| Comercial | Apenas "Orçamento Enviado" (última) | Processo padrão |
| Sinistro | "Reparo Concluído" **e** "Liberação Oficina" | Corretora com 2 fluxos de conclusão |
| Emissão | "Conferência Final" | Penúltima, pois a última é "Arquivamento" |

**Regras:**
- `is_win_eligible = false` por padrão em toda etapa nova
- **Perdido** pode ser marcado em **qualquer etapa** (sem restrição)
- **Ganho** só em etapas com `is_win_eligible = true`
- O front-end (Fase 2) mostra/esconde o botão "Marcar como Ganho" conforme o flag

### 3. Rótulos Customizáveis por Pipeline

O admin pode renomear as palavras "Ganho" e "Perdido" para cada pipeline:

| Pipeline | `won_label` | `lost_label` |
|----------|------------|-------------|
| Comercial | "Negócio Fechado" | "Perdido" |
| Sinistro | "Sinistro Indenizado" | "Sem Indenização" |
| Emissão | "Apólice Emitida" | "Proposta Recusada" |

### 4. Multi-tenancy

Todas as tabelas receberão `tenant_id uuid` referenciando `tenants.id`. A tabela `tenants` será a raiz de isolamento. RLS filtrará por tenant via função auxiliar.

### 5. Remoção de Enums Fixos

A tabela `oportunidades` atualmente tem:
- `etapa` (enum `etapa_funil`) → **Removida.** Substituída por `stage_id` dinâmico.
- `tipo_funil` (enum `tipo_funil`) → **Removida.** Substituída por `pipeline_id` dinâmico.
- `status` (enum `status_oportunidade`: `pendente/fechado/declinado`) → **Substituída** por novo enum `card_status` (`pending/won/lost`).

---

## Modelo de Dados Final

```
┌─────────────┐
│   tenants    │
│ (corretora)  │
└──────┬───────┘
       │ 1:N
  ┌────┴────────────────────────────────────┐
  │                                         │
  ▼                                         ▼
┌───────────────────────┐            ┌──────────────┐
│      pipelines        │            │  segurados   │
│ tenant_id             │            │  tenant_id   │
│ won_label/lost_label  │            └──────┬───────┘
└──────┬────────────────┘                   │
       │ 1:N                                │
       ▼                                    │
┌───────────────────────┐                   │
│   pipeline_stages     │                   │
│ is_win_eligible       │                   │
│ order, color          │                   │
└──────┬────────────────┘                   │
       │                                    │
       │      ┌─────────────────────┐       │
       └─────►│   oportunidades     │◄──────┘
              │ pipeline_id         │
              │ stage_id            │
              │ status (card_status)│  ← pending / won / lost
              │ concluded_at        │  ← timestamp da conclusão
              │ tenant_id           │
              └─────────────────────┘
```

---

## Micro-etapas de Execução

### Micro-etapa 1: Infraestrutura de Multi-tenancy

**Migração:** `001_create_tenants`

```sql
-- Tabela raiz de isolamento multi-tenant
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,               -- Nome da corretora (ex: "W.Assis Seguros")
  slug text NOT NULL UNIQUE,        -- Identificador URL-friendly
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Vincular profiles ao tenant
ALTER TABLE public.profiles 
  ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

-- Índice para busca rápida
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
```

**Entregável:** Tabela `tenants` criada, coluna `tenant_id` em `profiles`.

---

### Micro-etapa 2: Motor de Pipelines — Tabelas Centrais

**Migração:** `002_create_pipeline_engine`

```sql
-- Enum para módulo do pipeline  
CREATE TYPE pipeline_module AS ENUM (
  'comercial', 
  'emissao', 
  'pos_venda', 
  'financeiro', 
  'sinistro'
);

-- Tabela de Pipelines (Funis)
CREATE TABLE public.pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,                           -- "Funil de Vendas Saúde"
  module pipeline_module NOT NULL,              -- Classificação do módulo
  is_active boolean NOT NULL DEFAULT true,
  won_label text NOT NULL DEFAULT 'Ganho',      -- Rótulo customizável para conclusão positiva
  lost_label text NOT NULL DEFAULT 'Perdido',   -- Rótulo customizável para conclusão negativa
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Etapas do Pipeline
CREATE TABLE public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,                             -- "Cotação em Andamento"
  "order" integer NOT NULL DEFAULT 0,             -- Ordenação visual
  color text NOT NULL DEFAULT '#6B7280',          -- Cor hex para UI
  is_win_eligible boolean NOT NULL DEFAULT false, -- Permite marcar como "ganho" nesta etapa?
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_pipelines_tenant ON public.pipelines(tenant_id);
CREATE INDEX idx_pipelines_module ON public.pipelines(module);
CREATE INDEX idx_stages_pipeline ON public.pipeline_stages(pipeline_id);
CREATE INDEX idx_stages_order ON public.pipeline_stages(pipeline_id, "order");

-- RLS
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
```

**Entregável:** Tabelas `pipelines` (com `won_label`/`lost_label`) e `pipeline_stages` (com `is_win_eligible`) criadas.

---

### Micro-etapa 3: Refatoração da tabela `oportunidades`

**Migração:** `003_refactor_oportunidades`

```sql
-- 1. Criar novo enum de status do card
CREATE TYPE card_status AS ENUM ('pending', 'won', 'lost');

-- 2. Adicionar novas colunas (motor de pipelines + tenant + status novo)
ALTER TABLE public.oportunidades
  ADD COLUMN tenant_id uuid REFERENCES public.tenants(id),
  ADD COLUMN pipeline_id uuid REFERENCES public.pipelines(id),
  ADD COLUMN stage_id uuid REFERENCES public.pipeline_stages(id),
  ADD COLUMN new_status card_status NOT NULL DEFAULT 'pending',
  ADD COLUMN concluded_at timestamptz;

-- 3. Remover colunas legadas (0 registros, sem risco de perda de dados)
ALTER TABLE public.oportunidades
  DROP COLUMN etapa,
  DROP COLUMN tipo_funil,
  DROP COLUMN status;

-- 4. Renomear new_status para status
ALTER TABLE public.oportunidades
  RENAME COLUMN new_status TO status;

-- 5. Dropar enums órfãos
DROP TYPE IF EXISTS etapa_funil;
DROP TYPE IF EXISTS tipo_funil;
DROP TYPE IF EXISTS status_oportunidade;

-- 6. Índices para performance
CREATE INDEX idx_oportunidades_tenant ON public.oportunidades(tenant_id);
CREATE INDEX idx_oportunidades_pipeline ON public.oportunidades(pipeline_id);
CREATE INDEX idx_oportunidades_stage ON public.oportunidades(stage_id);
CREATE INDEX idx_oportunidades_status ON public.oportunidades(status);
CREATE INDEX idx_oportunidades_concluded ON public.oportunidades(concluded_at) 
  WHERE concluded_at IS NOT NULL;
```

**Entregável:** `oportunidades` agora usa `pipeline_id`/`stage_id` dinâmicos + `status` (pending/won/lost) + `concluded_at`.

---

### Micro-etapa 4: Propagação de `tenant_id` nas tabelas existentes

**Migração:** `004_add_tenant_to_existing_tables`

```sql
-- Adicionar tenant_id às tabelas que ainda não possuem
ALTER TABLE public.segurados
  ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

ALTER TABLE public.origens
  ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

ALTER TABLE public.ramos
  ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

ALTER TABLE public.motivos_perda
  ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

ALTER TABLE public.atividades
  ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

ALTER TABLE public.anexos
  ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

ALTER TABLE public.metas
  ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

-- Índices de performance
CREATE INDEX idx_segurados_tenant ON public.segurados(tenant_id);
CREATE INDEX idx_origens_tenant ON public.origens(tenant_id);
CREATE INDEX idx_ramos_tenant ON public.ramos(tenant_id);
CREATE INDEX idx_motivos_perda_tenant ON public.motivos_perda(tenant_id);
CREATE INDEX idx_atividades_tenant ON public.atividades(tenant_id);
CREATE INDEX idx_anexos_tenant ON public.anexos(tenant_id);
CREATE INDEX idx_metas_tenant ON public.metas(tenant_id);
```

**Entregável:** Todas as tabelas de negócio com `tenant_id`.

---

### Micro-etapa 5: Políticas RLS (Row Level Security)

**Migração:** `005_rls_policies`

```sql
-- Função auxiliar: retorna o tenant_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;

-- === TENANTS ===
CREATE POLICY "Usuário visualiza apenas seu tenant"
  ON public.tenants FOR SELECT
  USING (id = public.get_user_tenant_id());

-- === PIPELINES ===
CREATE POLICY "Isolamento por tenant"
  ON public.pipelines FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- === PIPELINE STAGES ===
-- Isolamento via join com pipelines (stages herdam o tenant do pipeline)
CREATE POLICY "Isolamento via pipeline"
  ON public.pipeline_stages FOR ALL
  USING (
    pipeline_id IN (
      SELECT id FROM public.pipelines WHERE tenant_id = public.get_user_tenant_id()
    )
  );

-- === OPORTUNIDADES ===
DROP POLICY IF EXISTS "Users can view oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Authenticated users can CRUD oportunidades" ON public.oportunidades;
CREATE POLICY "Isolamento por tenant"
  ON public.oportunidades FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- === SEGURADOS ===
DROP POLICY IF EXISTS "Users can view segurados" ON public.segurados;
DROP POLICY IF EXISTS "Authenticated users can CRUD segurados" ON public.segurados;
CREATE POLICY "Isolamento por tenant"
  ON public.segurados FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- === ORIGENS ===
DROP POLICY IF EXISTS "Authenticated users can read origens" ON public.origens;
CREATE POLICY "Isolamento por tenant"
  ON public.origens FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- === RAMOS ===
DROP POLICY IF EXISTS "Authenticated users can read ramos" ON public.ramos;
CREATE POLICY "Isolamento por tenant"
  ON public.ramos FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- === MOTIVOS_PERDA ===
DROP POLICY IF EXISTS "Authenticated users can read motivos_perda" ON public.motivos_perda;
CREATE POLICY "Isolamento por tenant"
  ON public.motivos_perda FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- === ATIVIDADES ===
DROP POLICY IF EXISTS "Users can view atividades" ON public.atividades;
CREATE POLICY "Isolamento por tenant"
  ON public.atividades FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- === ANEXOS ===
DROP POLICY IF EXISTS "Users can view anexos" ON public.anexos;
CREATE POLICY "Isolamento por tenant"
  ON public.anexos FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- === METAS ===
DROP POLICY IF EXISTS "Users can view metas" ON public.metas;
CREATE POLICY "Isolamento por tenant"
  ON public.metas FOR ALL
  USING (tenant_id = public.get_user_tenant_id());
```

**Entregável:** Isolamento completo por tenant em todas as tabelas.

---

### Micro-etapa 6: Regeneração dos Tipos TypeScript

Após todas as migrações, gerar os tipos automaticamente via Supabase CLI e atualizar as referências no código que mencionam `etapa`, `tipo_funil` ou o antigo `status`.

**Entregável:** Tipos TypeScript sincronizados com o novo schema.

---

## Resumo das Regras de Negócio no Modelo

| Regra | Implementação |
|-------|--------------|
| Perdido pode em qualquer etapa | Sem restrição — `status = 'lost'`, `stage_id` preserva onde foi perdido |
| Ganho só em etapas elegíveis | `pipeline_stages.is_win_eligible = true` nas etapas permitidas |
| Admin renomeia "Ganho"/"Perdido" | `pipelines.won_label` / `pipelines.lost_label` |
| Timestamp de conclusão | `oportunidades.concluded_at` preenchido ao mudar para won/lost |
| Cards concluídos ocultos no Kanban | Filtro no front-end por `status = 'pending'` (Fase 2) |
| Perda com motivo | `oportunidades.motivo_perda_id` (FK já existe) |
| Funil analítico por etapa | Query agrupa por `stage_id` + `status` |

---

## Verificação (Pós-execução)

| Check | Comando/Ação |
|-------|-------------|
| Tabelas criadas | `list_tables` no Supabase MCP |
| Enums antigos removidos | `SELECT typname FROM pg_type WHERE typname IN ('etapa_funil','tipo_funil','status_oportunidade')` → vazio |
| Novos enums existem | `SELECT typname FROM pg_type WHERE typname IN ('card_status','pipeline_module')` → 2 resultados |
| RLS ativo | Verificar `rls_enabled = true` em todas as tabelas |
| Função tenant | `SELECT public.get_user_tenant_id()` funciona para usuário logado |
| Tipos TS | Arquivo `database.ts` gerado sem erros |

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Front-end quebra ao refatorar `oportunidades` | Esperado. Será corrigido na Fase 2. Nenhuma alteração de front-end nesta fase. |
| RLS bloqueia acesso se `tenant_id` for NULL em profiles | O tenant precisa ser atribuído ao profile do admin antes de testar queries |
| Policies antigas conflitam com novas | Drop explícito das policies antigas antes de recriar |
| Colisão de nome `status` ao adicionar novo + remover antigo | Usar coluna temporária `new_status`, dropar antigo, depois renomear |
