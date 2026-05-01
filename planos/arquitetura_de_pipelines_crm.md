# Plano de Arquitetura: Pipelines Flexíveis para Corretora de Seguros

Este documento define a estratégia arquitetural estruturando o CRM para suportar múltiplas jornadas de trabalho (Pipelines) de forma flexível. O objetivo é permitir que a corretora gerencie todos os processos visuais (Kanban/Listas) adaptando-se a qualquer setor do negócio.

## Visão Geral das Necessidades

A corretora possui diferentes fluxos de valor, cada um com etapas e responsabilidades únicas:

1. **Negociação Comercial:** Prospecção, Cotação, Apresentação, Acompanhamento, Fechamento (Ganho/Perdido).
2. **Acompanhamento de Emissão:** Validação da Proposta, Protocolo na Seguradora, Averiguação de Pendências, Apólice Emitida.
3. **Pós-venda (Endossos/Renovações):** Mapeamento de renovações futuras, solicitações de alteração de apólice, cancelamentos.
4. **Financeiro:** Controle de parcelas e comissões (Contas a Receber da Seguradora, Repasse a Produtores, Inadimplência de Clientes).
5. **Sinistro:** Aviso de sinistro, Regulação, Vistoria, Retorno/Envio de Recibos, Pagamento de Indenização, Recusa.

---

## 1. Modelo de Dados (Supabase / Banco de Dados)

Para que o CRM suporte essa flexibilidade sem criar uma tabela para cada tipo quadro (Kanban) engessado, propomos um **Motor Dinâmico de Pipelines**.

### Estrutura Central (Motor de Pipelines)

- **Tabela `pipelines`**: Define o tipo de fluxo.
  - `id` (uuid)
  - `name` (Ex: "Funil de Vendas Saúde", "Fila de Sinistros Auto")
  - `module` (Enum: `comercial`, `emissao`, `pos_venda`, `financeiro`, `sinistro`)
  - `is_active` (boolean)
- **Tabela `pipeline_stages`**: Define as fases/colunas de cada pipeline.
  - `id` (uuid)
  - `pipeline_id` (fk -> pipelines.id)
  - `name` (Ex: "Cotação em Andamento", "Aguardando Vistoria")
  - `order` (inteiro para ordenação visual)
  - `color` (hexa para UI)

### Entidades de Negócio Relacionadas

Em vez de forçar tudo em um modelo genérico de "cartão", os itens visuais devem representar entidades reais do negócio para mantermos consistência e emitirmos relatórios precisos, mas possuindo um ponteiro para em qual pipeline e stage estão:

- `**opportunities` (Negociação Comercial)**
  - Possui `pipeline_id` e `stage_id`.
  - Campos: `client_id`, `expected_value`, `closing_date`, etc.
- `**policies` / `proposals` (Acompanhamento de Emissão / Pós Venda)**
  - Uma proposta/apólice pode tramitar num pipeline de Emissão ou de Endosso.
  - Possui `pipeline_id` e `stage_id`.
- `**financial_transactions` (Financeiro)**
  - Parcelas de prêmio ou de comissão.
  - Pode ser vinculada a um quadro de cobrança mediante um `stage_id`.
- `**claims` (Sinistros)**
  - Possui `pipeline_id` e `stage_id`.
  - Campos específicos: `policy_id`, `event_date`, `claim_number` (número na seguradora), `documents_url`.

### Abordagem Híbrida para Estrutura de Dados

Para manter a altíssima performance em Dashboards/BI e ao mesmo tempo garantir a flexibilidade solicitada, o banco de dados funcionará no modelo híbrido:

- **Colunas Tipadas (Para BI e Agrupamento):** Tudo o que for Métrica (valor de prêmio), Classificações Críticas (Datas, Seguradora, Origem do Lead, Produto) é mantido obrigatoriamente como coluna física na tabela de banco de dados.
- **Coluna `custom_properties` (JSONB):** Dados específicos e formulários flexíveis (ex: campo temporário para "Campanha de Vendas de Cartão Saúde") viverão aqui, isolando a necessidade de migrações pesadas para a Tabela.

### Vantagem desta Abordagem

Essa separação dupla (Tabelas especializadas + JSONB) permite isolar regras exatas de seguradoras, manter as consultas de relatórios de BI extremamente rápidas, e possibilita componentizar de forma flexível a renderização do Front-End.

---

## 2. Estratégia de Front-End (Componentização Módular Kanban)

No front-end (React), criaremos um **Componente Genérico de Kanban Card Provider**, de modo que possamos reutilizá-lo para todos os setores.

```tsx
<KanbanBoard 
    pipelineId="uuid-do-pipeline"
    entityType="claim" // Pode ser 'opportunity', 'proposal', 'claim'
    fetchItems={fetchClaimsForPipeline} 
    onCardMove={updateClaimStage}
    CustomCardComponent={ClaimCardPreview} // Cada entidade tem uma miniatura customizada
/>
```

Isso garante que visualmente a tela do Corretor, Setor de Emissão e Setor de Sinistro será familiar, sem a necessidade de replicar as lógicas pesadas de arrastar e soltar (Drag and Drop) em 5 telas diferentes.

---

## 3. Automações e Gatilhos de Transição (Workflows)

A regra de negócios que orquestra as trasições e envios não ficará amarrada em código (triggers engessadas) no banco de dados. Utilizaremos o **n8n** como cérebro das automações. O banco disparará *Webhooks* protegidos para o n8n gerenciar a orquestração.

1. **Gatilho Comercial para Emissão**: O usuário atualiza uma oportunidade para a etapa "Ganho/Fechado". A ação repassa via webhook ao n8n para provisionar a apólice no quadro `proposals` e disparar "Boas Vindas" via Z-API.
2. **Gatilho Financeiro**: Se o sinistro ou a emissão mudar de estágio para "Finalizado", o respectivo fluxo no n8n recalcula e cria as "Parcelas" financeiras programadas.
3. **Gatilho de SLA/Tempo**: Rotinas de tempo (CRON) nativas no n8n rodam diariamente, varrendo o banco de dados para analisar cartões estacionados sem giro a mais de *'X'* dias numa etapa.

---

## 4. O Passo a Passo Sugerido para Implementação

**Fase 1: Fundação**

- Criação das tabelas centrais `pipelines` e `pipeline_stages` no Supabase.
- Integração do componente visual Kanban Genérico no Front-End.

**Fase 2: O Pipeline Comercial**

- Adaptação da tabela atual de oportunidades/negociações.
- Visualização funcional do Funil Comercial completo pelo corretor.

**Fase 3: Pipelines de Operação e Sinistro**

- Criação da entidade e funil de `claims` (Sinistros).
- Criação da entidade e funil de `proposals` (Emissão).

**Fase 4: Financeiro e Módulos Finais**

- Geração e visualização do quadro financeiro (Régua de Cobrança).
- Configuração dos gatilhos cruzados de automação no n8n.

**Fase 5: Módulo de Construtor de Campos Dinâmicos**

- Interface administrativa para o dono da Corretora gerenciar formulários, acionar botões visíveis de "Profissão (Select)" ou checkboxes temporários de campanhas promocionais que refletem instantaneamente no front-end dos corratórios sem necessidade de desenvolvedores.

