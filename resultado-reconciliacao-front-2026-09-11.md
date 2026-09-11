# Resultado da reconciliação frontend × DBML

Data: 11/09/2026. Referência atual: par DBML/instruções **v3.1**. Escopo: frontend/mock e documentação, sem backend ou alteração de configuração.

> Atualização posterior: a [revisão campo a campo de nulabilidade](resultado-nulabilidade-2026-09-11.md) corrigiu as 86 diferenças do inventário. A contagem resumida anterior de 87 estava incorreta. Resultado atual: zero diferenças de nulabilidade.

## Resultado estrutural

- 68 tabelas e 1.164 colunas no DBML v3.1.
- As **67 tabelas representadas no frontend** têm todos os nomes de colunas e tipos escalares compatíveis. Não restam os 94 campos ausentes nem os 22 extras da auditoria original.
- `integracao_logs` continua sem representação: tabela técnica prevista para o backend, sem necessidade de uma nova tela.
- As três FKs obrigatórias que aceitavam nulo foram corrigidas. As diferenças de nulabilidade foram corrigidas posteriormente nos tipos de leitura e consumidores, preservando as validações de negócio. Consulte a revisão específica.
- Tipos de filiais, perfis, vínculos e produtores agora derivam de `Database.public.Tables`; `platform.ts` apenas reexporta aliases. `platformRows.ts` concentra as linhas canônicas e os defaults do mock.

Compatibilidade estrutural não certifica enforcement de FK, autorização, unicidade, equivalência semântica ou integração real. O script continua somente leitura e seleciona automaticamente a versão mais recente do DBML.

## Tratamento dos 11 pontos

| Ponto | Tratamento aplicado |
|---|---|
| Grupo/corretora obrigatórios | FKs não nulas nos tipos; validação de existência e coerência de grupo na escrita; lotes são validados antes de publicar. |
| Permissões | Nome `modulo`, seis ações e escopo persistidos; matriz permite editar exportar/gerenciar e escopo. Simulação aceita contexto explícito de registro; telas do cálculo e apresentação usam corretora/responsável da oportunidade. |
| Ciclo de acesso | Usuário ativo/inativo; vínculo ativo com datas inclusivas opcionais; inativação preserva a linha. Seletor de corretora e simulação desconsideram acesso inativo, expirado e perfil/corretora inativos. |
| Nomes legados | Consumidores de profiles usam `nome_completo`; `phone` saiu da linha canônica em favor de `telefone`; grupo usa razão social/nome fantasia. Datas são mantidas somente nas tabelas que as possuem. API de identidade mantém sua própria estrutura. |
| Produtores | Cadastro completo em rota dedicada `/produtores/novo` ou `/produtores/:id`; identificação PF/PJ, favorecido, tipo de conta, dados fiscais e endereço. Atualização parcial não apaga dados não editados. |
| Contato empresarial | Criação sem PF ou com PF da mesma corretora; edição de dados próprios e ativo/principal; erro de validação não desmarca o principal anterior. Dados próprios prevalecem na leitura do contato. |
| Demais cadastros | Todas as colunas representadas. Segurados ganha celular/WhatsApp separados; demais campos opcionais estão classificados abaixo e preservados em updates parciais. |
| Chassi remarcado | Coluna boolean nullable formalizada em `calc_auto` no par v3.1. Desconhecido não é convertido em falso. |
| Cinco cotações | Comentário e instruções v3.1 alinhados à regra já implementada de até cinco itens. |
| Nulabilidade | Revisão posterior concluída: zero diferenças. Leitura aceita null previsto no DBML; escrita exige os dados necessários por estado/fluxo. |
| Log técnico/tipos separados | Ausência técnica documentada; quatro entidades administrativas integradas à tipagem principal. Nenhuma tela genérica de logs criada. |

## Campos opcionais: destino nesta entrega

| Entidade | Editável agora / fluxo existente | Serviço ou contrato preservado sem nova UI |
|---|---|---|
| tenants | Nome do grupo usado no mock; identificação canônica preservada. | Cadastro institucional do grupo, contatos, endereço, moeda, timezone e estado do SaaS: previsão contratual para administração do serviço; nenhuma tela de grupo inventada. |
| profiles | Nome/email do convite simulado, avatar/nome pessoal no fluxo existente, ativação/inativação. | Telefone, celular, cargo e departamento preservados; metadados de convite e último acesso pertencem ao serviço. O mock não envia emails. |
| perfis | Nome, criação e inativação de perfis personalizados; seis ações/escopo por módulo. | Descrição, classificação `nivel_acesso` e ordem preservadas. Classificação não cria herança nem bypass de autorização. |
| profile_filiais | Perfil, principal, ativo e datas de início/fim por corretora. | IDs e coerência das FKs são responsabilidade do domínio/serviço. |
| role_permissions | `modulo`, escopo, ler/criar/editar/excluir/exportar/gerenciar. | O backend resolve e aplica a autorização real em todas as leituras, escritas e exportações. |
| produtores | Dados pessoais/empresa, canais, endereço, banco/conta/Pix, favorecido, imposto e observações. | `percentual_repasse_padrao` legado é preservado; regras financeiras normalizadas continuam sendo a fonte operacional. Cadastro fiscal não gera nova fórmula tributária. |
| segurados | Campos anteriores e agora `celular` e `whatsapp` separados. | `nome_social`, `rg_ie`, `inscricao_municipal`, `atividade_economica`, `profissao`, `renda_mensal`, `cnh_numero`, `cnh_categoria`, `cnh_vencimento`, `telefone2`, `pais` preservados para evolução; `lgpd_autorizado_em` e `origem_importacao` são metadados de processo/serviço. |
| filiais | Formulário anterior preservado, com valores não editados mantidos. | `inscricao_estadual`, `inscricao_municipal`, `regime_tributario`, `percentual_iss`, `codigo_corretora`, `codigo_externo`, `municipio_ibge`, `pais`, `horario_atendimento`, `observacoes` representados para evolução. |
| pessoa_contato | Nome, vínculo PF opcional, cargo, departamento, canais, observações, ativo/principal. | Isolamento e integridade das FKs devem ser repetidos no backend. |

## Limites de autorização

A matriz é autoria de política. O frontend possui uma simulação de elegibilidade com seis ações, período e contexto próprio; isso não implementa RLS nem substitui a autorização do backend. Telas legadas e consultas demonstrativas não devem ser tratadas como uma fronteira de segurança. O backend deverá resolver proprietário/responsável por módulo, filtrar registros e validar toda operação, inclusive exportação e administração.

GRUPO significa as corretoras autorizadas do grupo; CORRETORA exige o vínculo correspondente ao registro; PROPRIO exige responsabilidade explícita nas operações de registro. Gerenciar não concede automaticamente exportar nem as ações CRUD. Em contexto de navegação, ler pode habilitar o módulo sem autorizar acesso irrestrito a cada registro.

## Evidências e documentação

O inventário atualizado está em `.codex/plans/auditoria-front-dbml-2026-09-11.json`. O micro-plano registra os comandos, resultados e evidências de browser. O relatório original de 10/09 permanece histórico. O painel HTML foi atualizado para distinguir a situação anterior do tratamento aplicado.

O hand-off versionável `relatorio-endpoints-campos.md` foi reconciliado no recorte de plataforma/cadastros e recebe a nota contratual v3.1. As fases que ainda não foram consolidadas nesse documento continuam explicitamente identificadas; esta revisão não as declara documentadas por inferência.

## Verificação

TypeScript e build aprovados; suíte completa com 282 testes aprovados e 14 testes focados repetidos após os últimos ajustes. Jornadas principais verificadas em navegador desktop/mobile, incluindo tema escuro. ESLint do recorte não introduziu dívida: permanecem 32 ocorrências legadas em três arquivos. Build mantém aviso de tamanho de chunks.
