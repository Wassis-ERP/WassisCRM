# Revisão de nulabilidade — resultado

Data: 11/09/2026. Contrato: DBML/instruções v3.1. Frontend/mock e documentação; sem alteração do esqueleto, configuração ou backend.

## Resultado

**Zero diferenças de nulabilidade** nas 67 tabelas representadas no frontend. Também permanecem zeradas as colunas ausentes, extras e incompatibilidades escalares. O DBML possui 68 tabelas e 1.164 colunas; integracao_logs continua técnico e fora do frontend.

**Correção de contagem:** o resumo anterior dizia 87, mas o inventário detalhado continha 86 diferenças. Foram revisados e corrigidos os 86 campos identificados abaixo; nenhum campo foi descartado para zerar a auditoria.

## Leitura e escrita têm responsabilidades diferentes

Os tipos Row reconhecem null exatamente onde o DBML permite. Isso não tornou todas as propriedades opcionais: IDs/FKs obrigatórios continuam não nulos. Inputs e builders mantêm as exigências de cadastro e de cada etapa; campos de formulário podem começar vazios para permitir corrigir um registro incompleto, mas não autorizam concluir o fluxo sem os dados necessários.

Nomes ausentes não quebram ordenação/consulta. Tipo/status de pessoa não viram PF/Ativo na edição, consentimento desconhecido não vira autorização e data ausente não vira data atual. Grade ou evento sem informações essenciais não gera comissão; regra incompleta não é elegível; comissão sem tipo não admite baixa manual. Matriz de acesso mantém negação para estados desconhecidos.

As declarações administrativas duplicadas agora derivam a nulabilidade de Database.Tables. Shapes de entrada continuam separados das leituras. Catálogos operacionais podem excluir registros incompletos; esses registros permanecem acessíveis na administração para revisão.

## Conferência campo a campo

| Tabela | Campo | Leitura anterior | Tratamento aplicado |
|---|---|---|---|
| `tenants` | `slug` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `filiais` | `lgpd_aceito` | `boolean` | Leitura não inventa consentimento. Formulário exige registro da autorização; desconhecido não equivale a autorizado. |
| `filiais` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `perfis` | `nome` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `perfis` | `sistema` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `perfis` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `profile_filiais` | `principal` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `produtores` | `nome` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `produtores` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `segurados` | `tipo` | `"PF" ∣ "PJ"` | Leitura preserva null; edição mostra opção não informada e exige seleção. Escrita sem tipo/status é recusada. |
| `segurados` | `nome` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `segurados` | `status` | `"Ativo" ∣ "Inativo" ∣ "Prospecto"` | Leitura preserva null; edição mostra opção não informada e exige seleção. Escrita sem tipo/status é recusada. |
| `segurados` | `lgpd_autorizado` | `boolean` | Leitura não inventa consentimento. Formulário exige registro da autorização; desconhecido não equivale a autorizado. |
| `segurados` | `created_at` | `string` | Data ausente fica ausente no modelo de leitura; nenhuma data atual é fabricada para o cadastro. |
| `segurados` | `updated_at` | `string` | Data ausente fica ausente no modelo de leitura; nenhuma data atual é fabricada para o cadastro. |
| `pessoa_contato` | `principal` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `seguradoras` | `nome` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `seguradoras` | `aceita_importacao_pdf` | `boolean` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `seguradoras` | `aceita_busca_automatica` | `boolean` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `seguradoras` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `ramos` | `nome` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `ramos` | `risk_type` | `string` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `ramos` | `grupo_operacional` | `string` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `ramos` | `is_monthly` | `boolean` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `ramos` | `renovavel` | `boolean` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `ramos` | `permite_endosso` | `boolean` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `ramos` | `exige_item` | `boolean` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `ramos` | `exige_coberturas` | `boolean` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `ramos` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `endosso_subtipos` | `nome` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `endosso_subtipos` | `natureza_canonica` | `string` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `endosso_subtipos` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `cancelamento_motivos` | `nome` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `cancelamento_motivos` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `origens` | `nome` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `origens` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `motivos_perda` | `nome` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `motivos_perda` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `coberturas_catalogo` | `nome` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `coberturas_catalogo` | `obrigatoria` | `boolean` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `coberturas_catalogo` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `pipelines` | `nome` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `pipelines` | `entidade_tipo` | `string` | Registros sem vínculo podem ser lidos; notificações sem destino não criam navegação inválida. Escrita mantém contexto obrigatório. |
| `pipelines` | `modelo_fabrica` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `pipelines` | `permite_customizacao` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `pipelines` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `pipeline_stages` | `nome` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `pipeline_stages` | `ordem` | `number` | Ordenação defensiva posiciona desconhecidos explicitamente; autoria valida/atribui ordem no fluxo, sem modificar o registro durante a leitura. |
| `pipeline_stages` | `finaliza_com_sucesso` | `boolean` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `pipeline_stages` | `finaliza_com_perda` | `boolean` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `pipeline_stages` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `calculos` | `origem` | `CalculoOrigem` | Origem nullable na leitura; duplicação exige origem informada, sem assumir motor ou origem manual. |
| `recebimento_grades` | `nome` | `string` | Grade/evento incompleto pode ser lido; validação bloqueia aplicação, simulação e duplicação sem número/tipo/opções necessários. Formulário mantém decisões pendentes. |
| `recebimento_grades` | `tipo` | `string` | Grade/evento incompleto pode ser lido; validação bloqueia aplicação, simulação e duplicação sem número/tipo/opções necessários. Formulário mantém decisões pendentes. |
| `recebimento_grades` | `qtd_parcelas` | `number` | Grade/evento incompleto pode ser lido; validação bloqueia aplicação, simulação e duplicação sem número/tipo/opções necessários. Formulário mantém decisões pendentes. |
| `recebimento_grades` | `considera_iof` | `boolean` | Grade/evento incompleto pode ser lido; validação bloqueia aplicação, simulação e duplicação sem número/tipo/opções necessários. Formulário mantém decisões pendentes. |
| `recebimento_grades` | `considera_adicional_fracionamento` | `boolean` | Grade/evento incompleto pode ser lido; validação bloqueia aplicação, simulação e duplicação sem número/tipo/opções necessários. Formulário mantém decisões pendentes. |
| `recebimento_grades` | `vitalicio` | `boolean` | Grade/evento incompleto pode ser lido; validação bloqueia aplicação, simulação e duplicação sem número/tipo/opções necessários. Formulário mantém decisões pendentes. |
| `recebimento_grades` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `recebimento_grade_parcelas` | `numero` | `number` | Grade/evento incompleto pode ser lido; validação bloqueia aplicação, simulação e duplicação sem número/tipo/opções necessários. Formulário mantém decisões pendentes. |
| `recebimento_grade_parcelas` | `tipo_comissao` | `ComissaoTipo` | Grade/evento incompleto pode ser lido; validação bloqueia aplicação, simulação e duplicação sem número/tipo/opções necessários. Formulário mantém decisões pendentes. |
| `recebimento_grade_parcelas` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `repasse_regras` | `papel` | `string` | Regra incompleta não é elegível para geração; builder exige papel, base, gatilho e prioridade válida. Nenhum valor financeiro é criado pelo fallback de exibição. |
| `repasse_regras` | `base` | `string` | Regra incompleta não é elegível para geração; builder exige papel, base, gatilho e prioridade válida. Nenhum valor financeiro é criado pelo fallback de exibição. |
| `repasse_regras` | `gatilho` | `string` | Regra incompleta não é elegível para geração; builder exige papel, base, gatilho e prioridade válida. Nenhum valor financeiro é criado pelo fallback de exibição. |
| `repasse_regras` | `prioridade` | `number` | Regra incompleta não é elegível para geração; builder exige papel, base, gatilho e prioridade válida. Nenhum valor financeiro é criado pelo fallback de exibição. |
| `repasse_regras` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `financeiro_cobrancas` | `status` | `CobrancaStatus` | Status desconhecido preservado; detalhe exibe Não informado e não oferece reabertura como se estivesse cancelado. |
| `comissoes` | `tipo_comissao` | `ComissaoTipo` | Tipo desconhecido exibido como Não informado; baixa manual exige tipo de comissão conhecido. |
| `atividades` | `entidade_tipo` | `string` | Registros sem vínculo podem ser lidos; notificações sem destino não criam navegação inválida. Escrita mantém contexto obrigatório. |
| `atividades` | `entidade_id` | `string` | Registros sem vínculo podem ser lidos; notificações sem destino não criam navegação inválida. Escrita mantém contexto obrigatório. |
| `atividades` | `tipo` | `string` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `anexos` | `entidade_tipo` | `string` | Registros sem vínculo podem ser lidos; notificações sem destino não criam navegação inválida. Escrita mantém contexto obrigatório. |
| `anexos` | `entidade_id` | `string` | Registros sem vínculo podem ser lidos; notificações sem destino não criam navegação inválida. Escrita mantém contexto obrigatório. |
| `anexos` | `nome_arquivo` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `audit_logs` | `entidade_tipo` | `string` | Registros sem vínculo podem ser lidos; notificações sem destino não criam navegação inválida. Escrita mantém contexto obrigatório. |
| `audit_logs` | `entidade_id` | `string` | Registros sem vínculo podem ser lidos; notificações sem destino não criam navegação inválida. Escrita mantém contexto obrigatório. |
| `audit_logs` | `acao` | `string` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `campo_definicoes` | `nome` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `campo_definicoes` | `tipo_dado` | `string` | Definição incompleta não pode receber preenchimento. Tipo e obrigatoriedade precisam ser definidos em Configurações. |
| `campo_definicoes` | `obrigatorio` | `boolean` | Definição incompleta não pode receber preenchimento. Tipo e obrigatoriedade precisam ser definidos em Configurações. |
| `campo_definicoes` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |
| `campo_definicoes` | `visivel_em_listagem` | `boolean` | Null reconhecido no tipo canônico e nos consumidores administrativos. Configuração incompleta não deve habilitar operação por inferência; formulários e comandos mantêm validações de autoria. |
| `campo_opcoes` | `rotulo` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `campo_opcoes` | `valor` | `string` | Tipo de leitura aceita null; apresentação usa vazio ou rótulo de ausência. Formulários preservam validação de nome/valor; rótulo de exibição não é gravado como dado. |
| `campo_opcoes` | `ativo` | `boolean` | Leitura preserva desconhecido; elegibilidade exige condição explícita. Checkbox é estado de autoria; acesso desconhecido não concede permissão. |

## Verificação e limites

Auditoria: `.codex/plans/auditoria-nulabilidade-2026-09-11.json`. Inventário de mudanças: `.codex/plans/nulabilidade-campos-2026-09-11.json`. TypeScript e build de produção aprovados. Vitest: 43 arquivos, 295 testes aprovados, incluindo dados incompletos e bloqueios de escrita. ESLint focado sem novas ocorrências; 32 ocorrências legadas em três arquivos permanecem. Build mantém aviso de tamanho de chunks. Evidências de navegador e conclusão detalhada constam no micro-plano.

Não restam exceções de nulabilidade na tipagem canônica. Compatibilidade estrutural não certifica integração real nem autorização do backend. Dados em memória continuam demonstrativos; políticas definitivas de qualidade e correção de legados devem ser repetidas pelo backend.
Verificação final de UI: Segurados, Grades, Ramos, Seguradoras e Campos Personalizados com dados incompletos; reparo e salvamento da grade pela interface aprovados. Evidências em `output/nulabilidade/qa.json` e `qa-repair.json`. Após os últimos ajustes, 34 testes focados de nulabilidade e catálogos passaram.
