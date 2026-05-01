# Walkthrough — Fase 1.1: Modelagem de Dados dos Módulos

## Resumo

Extensão da Fase 1 (Motor de Pipelines) com a **modelagem completa de dados para todos os módulos de negócio** do CRM: Comercial, Emissão, Sinistro, Pós-Venda e Financeiro (Cobranças). Esta fase consolidou a arquitetura "hub central" onde `oportunidades` concentra o contexto de negócio (cliente, seguradora, ramo) e as tabelas de módulo herdam esse contexto via FK, evitando duplicação de dados.

---

## Decisões Arquiteturais

### Hub Central Temporário
A tabela `oportunidades` é o hub que concentra o contexto de negócio. No futuro, quando a funcionalidade de proposta/apólice estiver pronta (com extração automática de PDFs), uma tabela `propostas` assumirá esse papel. As tabelas de módulo (sinistros, emissões, etc.) fazem FK para `oportunidades` e herdam segurado, seguradora, ramo e origem sem duplicar.

### Tabelas Separadas por Módulo
Cada módulo de negócio possui sua própria tabela em vez de compartilhar `oportunidades`. Isso evita uma tabela gigante com dezenas de colunas nulas, permite RLS/permissões granulares por módulo e mantém queries limpas.

### Modelo Híbrido (Colunas + JSONB)
Campos usados em filtros, relatórios e BI são colunas tipadas. Campos variáveis, temporários ou específicos por ramo ficam no `metadata` JSONB.

### Atividades e Anexos Compartilhados (Opção C)
As tabelas `atividades` e `anexos` ganham FKs nullable para cada módulo, permitindo que todos os módulos registrem histórico e arquivos na mesma tabela.

### Produção Calculada pelo n8n
O campo `producao` deixou de ser GENERATED ALWAYS e agora é um campo normal. O n8n calculará e gravará o valor. Não é editável pelo usuário, apenas para relatórios gerenciais.

---

## Migrações Executadas (9 no total)

### Migração 1: Enums Novos

- `tipo_negocio`: `'novo'` | `'renovacao'` | `'endosso'`
- `tipo_sinistro`: `'colisao'` | `'roubo_furto'` | `'incendio'` | `'alagamento'` | `'outros'`

### Migração 2: Tabela `seguradoras` (Nova Lookup)

| Coluna | Tipo | Obs |
|--------|------|-----|
| id | uuid PK | gen_random_uuid() |
| nome | text NOT NULL | unique |
| codigo_susep | text | nullable |
| ativo | boolean | default: true |
| tenant_id | uuid FK → tenants | |
| created_at | timestamptz | default: now() |

RLS: `tenant_id = get_user_tenant_id()`

### Migração 3: ALTER TABLE `oportunidades`

Colunas adicionadas:
- `seguradora_id` uuid FK → seguradoras (nullable)
- `indicador` text (campo aberto; futuro: módulo de indicação)
- `agenciamento` numeric (percentual: 100, 200, 300)
- `tipo_negocio` tipo_negocio enum (nullable)
- `tipo_contato` boolean (true=ativo, false=receptivo)
- `metadata` jsonb NOT NULL default '{}'

Colunas alteradas:
- `producao`: removido GENERATED ALWAYS, agora campo numeric normal (nullable)

Campos flexíveis no `metadata` JSONB:
- `cartao_porto` (boolean) — vendeu com cartão Porto
- `ge_porto` (boolean) — GE Porto
- `checado` (boolean) — conferência diária do gerente

Fórmula de produção (calculada pelo n8n):
- Com agenciamento: `(agenciamento/100 * premio_liquido) + ((12 - agenciamento/100) * comissao_percentual/100 * premio_liquido)`
- Sem agenciamento: `comissao_percentual/100 * premio_liquido`

### Migração 4: Tabela `sinistros` (Nova)

| Coluna | Tipo | Obs |
|--------|------|-----|
| id | uuid PK | gen_random_uuid() |
| oportunidade_id | uuid FK → oportunidades | NOT NULL |
| pipeline_id | uuid FK → pipelines | nullable |
| stage_id | uuid FK → pipeline_stages | nullable |
| status | card_status enum | default: 'pending' |
| responsavel_id | uuid FK → auth.users | NOT NULL |
| numero_sinistro | text | nullable |
| data_sinistro | date | nullable |
| data_aviso | date | nullable |
| tipo_sinistro | tipo_sinistro enum | nullable |
| valor_prejuizo | numeric | nullable |
| valor_indenizacao | numeric | nullable |
| metadata | jsonb | default: '{}' |
| observacoes | text | nullable |
| concluded_at | timestamptz | nullable |
| tenant_id | uuid FK → tenants | |
| created_at / updated_at | timestamptz | default: now() |

JSONB `metadata` por ramo (exemplos):
- **Auto**: placa, local_ocorrencia, boletim_ocorrencia, oficina, carro_reserva, terceiros
- **Residencial**: tipo_dano, comodo, prestador
- **Vida**: tipo_evento, beneficiario, documentacao_medica

RLS: `tenant_id = get_user_tenant_id()`

### Migração 5: Tabela `emissoes` (Nova)

Tabela enxuta — dados de negócio herdados via lookup de oportunidade.

| Coluna | Tipo | Obs |
|--------|------|-----|
| id | uuid PK | gen_random_uuid() |
| oportunidade_id | uuid FK → oportunidades | NOT NULL |
| pipeline_id | uuid FK → pipelines | nullable |
| stage_id | uuid FK → pipeline_stages | nullable |
| status | card_status enum | default: 'pending' |
| responsavel_id | uuid FK → auth.users | NOT NULL |
| proximo_followup | date | nullable |
| metadata | jsonb | default: '{}' |
| observacoes | text | nullable |
| concluded_at | timestamptz | nullable |
| tenant_id | uuid FK → tenants | |
| created_at / updated_at | timestamptz | default: now() |

RLS: `tenant_id = get_user_tenant_id()`

### Migração 6: Tabela `pos_vendas` (Nova)

Mesma estrutura de `emissoes`. Trata endossos, renovações e cancelamentos.

RLS: `tenant_id = get_user_tenant_id()`

### Migração 7: Tabela `financeiro_cobrancas` (Nova)

Mesma estrutura de `emissoes`. Trata cobranças e inadimplência (não comissões/repasses, que são escopo futuro do módulo de proposta).

RLS: `tenant_id = get_user_tenant_id()`

### Migração 8: ALTER TABLE `atividades` e `anexos`

FKs nullable adicionadas em ambas:
- `sinistro_id` uuid FK → sinistros
- `emissao_id` uuid FK → emissoes
- `pos_venda_id` uuid FK → pos_vendas
- `cobranca_id` uuid FK → financeiro_cobrancas

`oportunidade_id` tornado nullable (registros podem pertencer a outros módulos).

### Migração 9: Regeneração de Tipos

Arquivo `nexus-crm/src/types/database.ts` regenerado via Supabase Gen Types com todas as 18 tabelas e 6 enums.

---

## Resumo do Schema Final (18 tabelas)

| Tabela | Tipo | tenant_id | RLS | Status |
|--------|------|-----------|-----|--------|
| `tenants` | Infra | — (raiz) | Sim | Inalterada |
| `profiles` | Infra | Sim | Sim | Inalterada |
| `user_roles` | Infra | — | Sim | Inalterada |
| `role_permissions` | Infra | — | Sim | Inalterada |
| `pipelines` | Motor | Sim | Sim | Inalterada |
| `pipeline_stages` | Motor | via pipeline | Sim | Inalterada |
| `segurados` | Lookup | Sim | Sim | Inalterada |
| `seguradoras` | Lookup | Sim | Sim | **Nova** |
| `ramos` | Lookup | Sim | Sim | Inalterada |
| `origens` | Lookup | Sim | Sim | Inalterada |
| `motivos_perda` | Lookup | Sim | Sim | Inalterada |
| `metas` | Lookup | Sim | Sim | Inalterada |
| `oportunidades` | Hub/Comercial | Sim | Sim | **Alterada** (6 colunas novas) |
| `sinistros` | Módulo | Sim | Sim | **Nova** |
| `emissoes` | Módulo | Sim | Sim | **Nova** |
| `pos_vendas` | Módulo | Sim | Sim | **Nova** |
| `financeiro_cobrancas` | Módulo | Sim | Sim | **Nova** |
| `atividades` | Suporte | Sim | Sim | **Alterada** (4 FKs novas) |
| `anexos` | Suporte | Sim | Sim | **Alterada** (4 FKs novas) |

## Enums Ativos no Banco

| Enum | Valores | Usado por |
|------|---------|-----------|
| `app_role` | admin, vendedor, visualizador | user_roles, role_permissions |
| `card_status` | pending, won, lost | oportunidades, sinistros, emissoes, pos_vendas, financeiro_cobrancas |
| `pipeline_module` | comercial, emissao, pos_venda, financeiro, sinistro | pipelines.module |
| `tipo_pessoa` | PF, PJ | segurados.tipo |
| `tipo_negocio` | novo, renovacao, endosso | oportunidades.tipo_negocio |
| `tipo_sinistro` | colisao, roubo_furto, incendio, alagamento, outros | sinistros.tipo_sinistro |

---

## Validação de Segurança (LGPD)

- [x] Todas as 18 tabelas possuem RLS habilitado
- [x] Isolamento completo por tenant em todas as tabelas com dados de negócio
- [x] Nenhum dado pessoal exposto em tabelas sem proteção
- [x] Tabelas de módulo herdam isolamento via tenant_id próprio

---

## Preparação para Migração Futura (propostas/apólices)

Quando a funcionalidade de proposta/apólice for implementada:
1. Criar tabela `propostas` com FK para `oportunidades` (a oportunidade que a gerou)
2. Trocar (ou adicionar) FK das tabelas de módulo de `oportunidade_id` para `proposta_id`
3. Financeiro de comissões, parcelas e repasses de vendedores ficaria no módulo de proposta

---

## Próxima Etapa do Plano Macro

**Fase 2 — Materialização do Kanban e Telas**: Construir o componente `<KanbanBoard />` genérico no front-end e conectar ao Motor de Pipelines, configurando o primeiro funil completo (Pipeline Comercial). O front-end agora precisa ler `metadata` JSONB para renderizar campos dinâmicos por ramo.
