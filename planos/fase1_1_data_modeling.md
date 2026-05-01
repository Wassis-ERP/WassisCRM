# Plano de Implementação - Fase 1.1: Modelagem de Dados Híbrida (JSONB)

Este plano detalha a definição dos campos para cada módulo do CRM, separando o que será "Atômico/Tipado" (Colunas) do que será "Flexível" (JSONB). Esta fase é o pré-requisito para que o front-end saiba quais campos renderizar em cada pipeline.

## User Review Required

> [!IMPORTANT]
> **Adição da Coluna Metadata:** Precisamos adicionar `metadata jsonb` à tabela `oportunidades`.
> 
> **Padronização:** Definiremos um "contrato" de chaves para o JSONB para que o n8n e o Front-end possam ler os dados de forma consistente (ex: sempre usar `placa` e não `placa_veiculo`).

## Mudanças Propostas

---

### 1. Ajuste de Schema (Database)

#### [MODIFY] `public.oportunidades`
- Adicionar coluna `metadata` do tipo `JSONB` com valor padrão `{}`.
- Esta coluna armazenará os campos específicos de cada ramo/pipeline.

---

### 2. Levantamento de Campos por Módulo (Proposta)

Criaremos um guia de referência para o desenvolvimento:

#### **Módulo: Comercial (Vendas)**
*   **Campos Core (Colunas):** `ramo_id`, `valor_premio`, `comissao`, `vigencia`.
*   **JSONB (`metadata`):**
    *   **Auto:** `placa`, `chassis`, `modelo`, `ano_fabricacao`, `bonus_atual`, `pernoite_cep`.
    *   **Residencial:** `tipo_imovel` (Casa/Apto), `endereco_completo`, `cobertura_incendio`.
    *   **Vida:** `profissao`, `fumante` (boolean), `beneficiarios_json`.

#### **Módulo: Sinistros**
*   **Campos Core (Colunas):** `segurado_id`, `responsavel_id`.
*   **JSONB (`metadata`):**
    *   `numero_sinistro`, `data_ocorrencia`, `causa`, `oficina_referenciada`, `status_pecas` (pendente/pedido/entregue), `vistorizado` (boolean).

#### **Módulo: Pós-Venda / Emissão**
*   **Campos Core (Colunas):** `vigencia_inicio`, `vigencia_fim`.
*   **JSONB (`metadata`):**
    *   `numero_proposta`, `numero_apolice`, `forma_pagamento`, `quantidade_parcelas`, `cia_id` (Seguradora).

---

### 3. Passo a Passo da Execução

1.  **Migração SQL:** Executar o `ALTER TABLE` e atualizar permissões RLS.
2.  **Update Types:** Rodar o gerador de tipos para incluir `metadata` no `database.ts`.
3.  **Documentação de Referência:** Criar `planos/configuracao_campos_modulos.md` com os dicionários acima.

## Perguntas em Aberto

- **Cia Seguradora:** Fazemos uma tabela `seguradoras` (Tipada) ou deixamos no JSONB por enquanto? (Recomendo tabela para facilitar relatórios de produção por Cia).
- **Validação:** Deseja que algum desses campos JSONB seja obrigatório via banco (usando `CHECK constraints`) ou faremos a validação apenas no Front-end/n8n?

## Plano de Verificação

### Testes Automatizados
- Inserir uma oportunidade com campos JSONB variados e verificar se o Supabase aceita e retorna corretamente.

### Verificação Manual
- Validar se os tipos no arquivo `database.ts` foram atualizados para incluir o objeto JSON.
