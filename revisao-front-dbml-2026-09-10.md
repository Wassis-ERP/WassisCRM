# Revisão geral frontend × DBML v3.0

Data: 10/09/2026. Escopo: frontend e mock; nenhuma alteração de banco, API, configuração de produção ou contrato estrutural.

## Resultado

**Ainda não há aderência integral.** Foram comparadas 68 tabelas e 1163 colunas do DBML. 57 tabelas têm os mesmos nomes de colunas e tipos escalares compatíveis; 11 apresentam diferenças ou ausência. Há 94 colunas ausentes nos tipos aplicados e 22 campos extras, além da tabela técnica integracao_logs sem representação. Os tipos de quatro tabelas administrativas vivem em platform.ts, fora de Database.public.Tables.

Foram encontradas 90 diferenças de nulabilidade. A maior parte é o frontend exigindo preenchimento em colunas opcionais do DBML; isso não é automaticamente falha funcional. As colunas obrigatórias no DBML que o front aceita nulas são: profiles.tenant_id, segurados.tenant_id, segurados.filial_id.

## Como reproduzir e limites

Execute, da raiz: `node nexus-crm/scripts/audit-frontend-contract.mjs`. O script é somente leitura, resolve aliases/interseções com o compilador TypeScript e compara colunas escalares, nomes, nulabilidade e presença das colunas de FK. Inclui platform.ts para não confundir tipos separados com ausência de UI. Saída detalhada: .codex/plans/auditoria-front-dbml-2026-09-10.json.

A conferência não prova enforcement de FK, unicidade, permissões ou equivalência semântica apenas pela presença de string/number. Valores de domínio definidos como comentários no DBML exigem inspeção de domínio e testes, feita no recorte comercial alterado. Não significa que cada coluna do banco deva virar um campo visível; algumas são técnicas ou derivadas. Datas/IDs são strings por convenção frontend.

## Divergências e decisão de tratamento

- **Cadastros/plataforma:** tenants, profiles, role_permissions e pessoa_contato conservam aliases de uma versão anterior. Filiais, produtores, perfis e vínculos estão implementados, mas tipados separadamente e com conjuntos menores de campos. Segurados também não representa todos os campos da v3.0. Recomenda-se reconciliação por módulo com adapters explícitos antes do hand-off definitivo. Uma renomeação cega quebraria formulários, permissões e fixtures. Esta revisão registra o escopo de correção, sem eliminar campos nem presumir equivalência de nomes.
- **Comercial:** calc_auto.chassi_remarcado existe no formulário, no tipo e no mock, mas não no DBML. Manter temporariamente o comportamento existente e decidir formalmente entre adicionar coluna no próximo par de contrato ou retirar o campo do pedido. Não foi inventada coluna nem removida uma decisão visual preexistente.
- **Técnico:** integracao_logs é responsabilidade futura do backend, sem UI por decisão vigente; ausência esperada.
- **Comentário desatualizado:** o DBML v3.0 ainda menciona limite de três itens no comentário de apresentacao_cotacoes; a regra do app passa para cinco por solicitação expressa de 10/09/2026, sem mudança estrutural. O micro-plano atual registra a precedência.
- **Nulabilidade:** decidir por módulo se a obrigatoriedade é validação de formulário ou contrato. Prioridade para tenant_id/filial_id que não podem ficar nulos no backend. Não relaxar validação de negócio só para deixar o relatório sem alertas.

## Matriz completa

| Tabela | Colunas DBML | Tipo aplicado | Diferenças de colunas/tipo | Nulabilidade |
|---|---:|---|---|---:|
| tenants | 23 | database.ts | Faltam 21; Extras 4 | 1 |
| filiais | 36 | platform.ts:Filial | Faltam 10; Extras 2 | 2 |
| profiles | 14 | database.ts | Faltam 10; Extras 4 | 1 |
| perfis | 8 | platform.ts:Perfil | Faltam 3; Extras 2 | 3 |
| profile_filiais | 8 | platform.ts:ProfileFilial | Faltam 3; Extras 2 | 1 |
| role_permissions | 10 | database.ts | Faltam 4; Extras 2 | 0 |
| produtores | 35 | platform.ts:Produtor | Faltam 21; Extras 2 | 2 |
| segurados | 46 | database.ts | Faltam 15; Extras 1 | 8 |
| pessoa_contato | 12 | database.ts | Faltam 7; Extras 2 | 2 |
| seguradoras | 16 | database.ts | Compatível | 4 |
| ramos | 15 | database.ts | Compatível | 9 |
| endosso_subtipos | 9 | database.ts | Compatível | 3 |
| cancelamento_motivos | 8 | database.ts | Compatível | 2 |
| origens | 6 | database.ts | Compatível | 2 |
| motivos_perda | 6 | database.ts | Compatível | 2 |
| coberturas_catalogo | 16 | database.ts | Compatível | 3 |
| pipelines | 10 | database.ts | Compatível | 5 |
| pipeline_stages | 12 | database.ts | Compatível | 5 |
| oportunidades | 28 | database.ts | Compatível | 0 |
| calculos | 21 | database.ts | Compatível | 1 |
| calc_auto | 34 | database.ts | Extras 1 | 0 |
| calc_residencia | 20 | database.ts | Compatível | 0 |
| calc_condominio | 20 | database.ts | Compatível | 0 |
| calc_vida | 13 | database.ts | Compatível | 0 |
| calc_empresa | 22 | database.ts | Compatível | 0 |
| calc_diversos | 5 | database.ts | Compatível | 0 |
| calculo_coberturas | 10 | database.ts | Compatível | 0 |
| calculo_execucoes | 17 | database.ts | Compatível | 0 |
| cotacoes | 17 | database.ts | Compatível | 0 |
| cotacao_coberturas | 17 | database.ts | Compatível | 0 |
| cotacao_parcelamentos | 13 | database.ts | Compatível | 0 |
| apresentacoes_comerciais | 18 | database.ts | Compatível | 0 |
| apresentacao_cotacoes | 9 | database.ts | Compatível | 0 |
| apolices | 33 | database.ts | Compatível | 0 |
| propostas | 37 | database.ts | Compatível | 0 |
| apolice_itens | 12 | database.ts | Compatível | 0 |
| item_veiculo | 25 | database.ts | Compatível | 0 |
| item_imovel | 15 | database.ts | Compatível | 0 |
| item_empresa | 19 | database.ts | Compatível | 0 |
| item_vida | 14 | database.ts | Compatível | 0 |
| item_coberturas | 15 | database.ts | Compatível | 0 |
| sinistros | 32 | database.ts | Compatível | 0 |
| sinistro_envolvidos | 16 | database.ts | Compatível | 0 |
| pos_vendas | 15 | database.ts | Compatível | 0 |
| recebimento_grades | 13 | database.ts | Compatível | 7 |
| recebimento_grade_parcelas | 8 | database.ts | Compatível | 3 |
| repasse_regras | 18 | database.ts | Compatível | 5 |
| parcelas | 20 | database.ts | Compatível | 0 |
| financeiro_cobrancas | 14 | database.ts | Compatível | 1 |
| comissoes | 16 | database.ts | Compatível | 1 |
| comissao_extratos | 37 | database.ts | Compatível | 0 |
| comissao_extrato_itens | 29 | database.ts | Compatível | 0 |
| comissao_conciliacoes | 23 | database.ts | Compatível | 0 |
| comissao_conciliacao_ocorrencias | 20 | database.ts | Compatível | 0 |
| comissao_baixas | 14 | database.ts | Compatível | 0 |
| comissao_baixa_conciliacoes | 5 | database.ts | Compatível | 0 |
| repasses | 19 | database.ts | Compatível | 0 |
| repasse_recibos | 20 | database.ts | Compatível | 0 |
| repasse_recibo_itens | 12 | database.ts | Compatível | 0 |
| atividades | 19 | database.ts | Compatível | 3 |
| atividade_mencoes | 5 | database.ts | Compatível | 0 |
| anexos | 15 | database.ts | Compatível | 3 |
| audit_logs | 13 | database.ts | Compatível | 3 |
| integracao_logs | 15 | — | Sem tipo (técnica) | 0 |
| campo_definicoes | 19 | database.ts | Compatível | 5 |
| campo_opcoes | 6 | database.ts | Compatível | 3 |
| campo_valores | 12 | database.ts | Compatível | 0 |
| campo_valor_opcoes | 4 | database.ts | Compatível | 0 |

## Campos divergentes, por tabela

### tenants

Ausentes: `razao_social`, `nome_fantasia`, `cnpj_cpf`, `email`, `telefone`, `celular`, `home_page`, `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `pais`, `timezone`, `moeda_padrao`, `status`, `ativo`, `criado_em`, `atualizado_em`.

Extras/legado: `created_at`, `is_active`, `name`, `updated_at`.

### filiais

Ausentes: `inscricao_estadual`, `inscricao_municipal`, `regime_tributario`, `percentual_iss`, `codigo_corretora`, `codigo_externo`, `municipio_ibge`, `pais`, `horario_atendimento`, `observacoes`.

Extras/legado: `created_at`, `updated_at`.

### profiles

Ausentes: `nome_completo`, `telefone`, `celular`, `cargo`, `departamento`, `status`, `ativo`, `ultimo_acesso_em`, `convite_status`, `convite_enviado_em`.

Extras/legado: `created_at`, `full_name`, `phone`, `updated_at`.

### perfis

Ausentes: `descricao`, `nivel_acesso`, `ordem`.

Extras/legado: `created_at`, `updated_at`.

### profile_filiais

Ausentes: `ativo`, `data_inicio`, `data_fim`.

Extras/legado: `created_at`, `updated_at`.

### role_permissions

Ausentes: `modulo`, `escopo`, `can_export`, `can_manage`.

Extras/legado: `created_at`, `module`.

### produtores

Ausentes: `tipo_pessoa`, `nome_fantasia`, `rg_ie`, `susep`, `categoria_operacional`, `data_nascimento`, `telefone2`, `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `pais`, `tipo_conta`, `favorecido_nome`, `favorecido_cpf_cnpj`, `descontar_imposto`, `percentual_imposto`, `observacoes`.

Extras/legado: `created_at`, `updated_at`.

### segurados

Ausentes: `nome_social`, `rg_ie`, `inscricao_municipal`, `atividade_economica`, `profissao`, `renda_mensal`, `cnh_numero`, `cnh_categoria`, `cnh_vencimento`, `celular`, `telefone2`, `whatsapp`, `pais`, `lgpd_autorizado_em`, `origem_importacao`.

Extras/legado: `created_by`.

### pessoa_contato

Ausentes: `nome`, `departamento`, `email`, `telefone`, `celular`, `ativo`, `observacoes`.

Extras/legado: `created_at`, `tenant_id`.

### calc_auto

Extras/legado: `chassi_remarcado`.

### integracao_logs

Tabela técnica não implementada no frontend.

## Relações e jornadas revisadas

O eixo comercial segue calculos → calculo_execucoes → cotacoes → cotacao_coberturas/cotacao_parcelamentos. Apresentação usa seleção normalizada de resultados da mesma oportunidade; não duplica resultado. A ponte proposta usa propostas.cotacao_id; criação manual e importação compartilham o vínculo explícito, validam cotado/seguradora/ramo/corretora e impedem reutilizar a mesma cotação. Aprovação não acontece só por selecionar um produto.

Apólice permanece o contrato; proposta é o documento; itens apontam ao contrato e indicam documento de inclusão. Comissão e repasse mantêm agendas separadas. Importação de proposta não materializa recebimentos nem pagamentos. Integração real Agger, extração/OCR de PDF e enforcement permanecem fora do frontend.

## Evidências de validação

TypeScript, ESLint focado e build aprovados. Suíte completa com 270 testes aprovada; após as correções finais da ponte contratual, os três arquivos afetados passaram novamente com 14 testes. Navegador 1440×900/100% validou cinco cotações, bloqueio da sexta, apresentação/PDF, cotação manual e criação de proposta pelos dois caminhos. PDFs horizontal (3 páginas) e vertical (4 páginas) foram renderizados e inspecionados integralmente. Evidências e comandos estão no micro-plano de finalização (.codex/plans/micro-plano-finalizacao-front-2026-09-10.md).

O snapshot parcial relatorio-endpoints-campos.md não foi tratado como fonte superior ao DBML v3.0. As pendências acima impedem declarar o hand-off de dados totalmente reconciliado. A fase de dashboards gerenciais permanece adiada conforme decisão anterior no macro-plano; seus KPIs demonstrativos não foram tratados como dados reais.
