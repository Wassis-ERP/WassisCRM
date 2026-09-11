# 3.3 — Comissoes e baixa manual

> **Estado reconciliado em 11/09/2026:** frontend concluído, conforme a seção “Fechamento da execucao” ao final. Critérios antigos foram separados do aceite efetivamente evidenciado; backend permanece delimitado. Trechos de planejamento futuro e gates anteriores abaixo descrevem a época da elaboração.

Status: concluido em 2026-07-15, apos revisao e autorizacao explicita do usuario.

Classificacao: governada/contratual.

## Gate historico de autorizacao

O planejamento foi criado em rodada exclusivamente documental. A execucao so
comecou depois da mensagem explicita do usuario em 2026-07-15 autorizando a
evolucao pareada do contrato e a implementacao integral do recorte 3.3.

## Objetivo

Evoluir a visao `Comissoes` do cockpit unico `/financeiro` para uma
superficie operacional que:

- consulte fatos de `comissoes` materializados pela Fase 2, sem recompor grades,
  percentuais ou agendas;
- apresente a agenda prevista e sua origem contratual;
- relacione comissoes aos extratos, itens, associacoes e ocorrencias definidos no
  recorte 3.2;
- registre baixa manual total ou parcial com autoria, data efetiva, justificativa,
  idempotencia e historico auditavel;
- preserve separadamente previsto, informado, conciliado, efetivamente recebido,
  baixado, saldo e diferenca;
- prepare o contrato de frontend e as notas para o hand-off futuro do backend.

O Financeiro permanece estritamente securitario. Nao entram financeiro
empresarial, contas administrativas, contas a pagar/receber genericas, caixa,
tesouraria, bancos, contabilidade ou conciliacao bancaria.

## Fontes conferidas

- `AGENTS.md`;
- `.codex/artefatos/instrucoes_projeto_wassis_v2_3.md`;
- `.codex/artefatos/wassis_erp_esqueleto_v2_3.dbml`;
- `.codex/artefatos/instrucoes_projeto_wassis_v2_4.md`;
- `.codex/artefatos/wassis_erp_esqueleto_v2_4.dbml`;
- `.codex/plans/macro_plano.md`;
- `.codex/plans/micro-plano-fase-3-financeiro-securitario.md`;
- `.codex/plans/micro-plano-3.2-contrato-extratos-conciliacao.md`;
- `.codex/plans/micro-plano-3.1-parcelas-seguro.md`;
- `.codex/plans/micro-plano-2.9b-geracao-consolidada-agendas.md`;
- `relatorio-endpoints-campos.md`, somente como snapshot parcial;
- `nexus-crm/src/types/database.ts`;
- `nexus-crm/src/pages/FinanceiroPage.tsx` e a rota atual `/financeiro`;
- `nexus-crm/src/hooks/useFinanceiroParcelas.ts`;
- `nexus-crm/src/modules/financeiro/parcelasDomain.ts` e testes;
- `nexus-crm/src/modules/financeiro/conciliacaoContract.ts` e testes;
- `nexus-crm/src/lib/contractAgendaDomain.ts` e testes;
- `nexus-crm/src/lib/inMemoryDb.ts` e `queryClient.ts`;
- referencias locais do SegFy sobre painel, baixa manual, status e desfazimento;
- referencias locais do Quiver sobre recibos, baixa, ocorrencias,
  reprocessamento e saldo de comissoes;
- skill `wassis-design-uiux` para criterios de interface do cockpit.

## Estado inicial do Git

A arvore ja estava suja antes deste planejamento. Foram encontrados arquivos de
codigo modificados e nao rastreados nos recortes 2.9b, 3.1 e 3.2, incluindo
`FinanceiroPage.tsx`, `database.ts`, `inMemoryDb.ts`, dominio/testes de parcelas
e contrato/testes de conciliacao. Essas alteracoes preexistentes devem ser
preservadas e nao pertencem a esta sessao documental.

## Diagnostico da implementacao atual

### Cockpit e visao `Comissoes`

- `/financeiro` ja e a unica casca operacional e oferece as visoes `Parcelas`,
  `Comissoes`, `Repasses` e `Cobrancas`.
- Somente `Parcelas` esta funcional. `Comissoes` renderiza `FutureView`, com texto
  de fase futura e retorno para Parcelas.
- Nao existe tabela operacional, agenda, filtros, totais, selecao, detalhe,
  assistente de baixa, historico ou acao funcional para comissoes.
- Nao existem hook, adapter ou dominio de consulta/mutacao de comissoes no
  cockpit. O unico dominio financeiro novo alem de parcelas e
  `conciliacaoContract.ts`, que prova regras puras do contrato 3.2 sem executar
  baixa.
- O shell, a navegacao interna, o gating de permissao, os estados de carga/erro e
  os padroes de tabela/modal de Parcelas sao a base reutilizavel; nao se deve
  criar outra rota ou outro modulo Financeiro.

### Fatos materializados pela Fase 2

- `contractAgendaDomain.ts` gera cada `ComissaoRow` a partir da grade confirmada,
  com `tipo_comissao`, percentual, base, `valor_previsto`, data prevista,
  competencia e status `PREVISTA`.
- A geracao inicial deixa `valor_recebido`, `valor_diferenca` e `recebida_em`
  vazios.
- Fatos recebidos ou divergentes sao protegidos contra regeneracao pela Fase 2.
- O recorte 3.3 deve consumir esses fatos. Nao pode criar uma comissao ausente,
  recalcular a grade, alterar silenciosamente `valor_previsto` ou substituir o
  snapshot contratual.

### Extratos e conciliacao apos o 3.2

- A massa atual possui um extrato, dois itens, uma associacao exata confirmada e
  uma ocorrencia aberta.
- O teste do 3.2 confirma que a associacao exata nao altera a comissao: ela
  continua `PREVISTA`, sem `valor_recebido` e sem `recebida_em`.
- `classifyConciliation` representa exata, parcial, sugerida, manual, ambigua,
  nao encontrada e divergente.
- A idempotencia atual cobre extrato, item e par item+comissao. Ela nao cobre um
  comando/evento de baixa porque esse evento ainda nao existe no contrato.

## Diagnostico do contrato v2.3

### O que esta fechado e suficiente

- `comissoes` e filha de `propostas`; `parcela_id` e opcional e serve apenas
  para conciliacao quando a seguradora informa a parcela.
- `comissao_extratos` representa demonstrativo da seguradora, nunca conta,
  banco, caixa ou conciliacao bancaria.
- `comissao_extrato_itens` preserva os dados informados mesmo sem comissao
  encontrada.
- `comissao_conciliacoes` resolve N:N entre itens e comissoes, com alocacao de
  valor, snapshots, diferencas, autoria e estados.
- `comissao_conciliacao_ocorrencias` preserva ausencia, ambiguidade,
  duplicidade e divergencias de valor, percentual, competencia, parcela,
  proposta, apolice e segurado.
- Ingestao, normalizacao, associacao, conciliacao, ocorrencia e baixa sao etapas
  distintas. Conciliar nunca confirma recebimento e nunca baixa.
- Origem `MANUAL` permite criar cabecalho e itens digitados sem arquivo fisico;
  modo manual e automatico devem convergir nas mesmas entidades.

### Lacuna contratual bloqueante para a execucao completa

O v2.3 ainda condensa o resultado da baixa em `comissoes.valor_recebido`,
`valor_diferenca`, `recebida_em` e `status`. Nao existe entidade que represente:

- uma ou varias baixas sobre a mesma comissao;
- baixa parcial com saldo remanescente e nova baixa posterior;
- quais conciliacoes/itens foram consumidos por cada baixa;
- data efetiva, autoria, justificativa e chave idempotente de cada baixa;
- estorno como evento compensatorio, sem apagar ou sobrescrever historia;
- correcao por estorno + nova baixa;
- prevencao transacional de dupla baixa do mesmo valor/da mesma conciliacao;
- historico de dominio independente da trilha tecnica generica de
  `audit_logs`.

`audit_logs` e necessario para forense, mas nao substitui uma entidade de
negocio consultavel para baixas e estornos. Portanto, a implementacao completa
do 3.3 exige decisao do usuario e nova versao pareada de DBML/instrucoes antes de
alterar o frontend.

### Direcao contratual recomendada, ainda nao aprovada

Recomenda-se versionar o contrato com estruturas equivalentes a:

1. `comissao_baixas`: evento imutavel de `BAIXA` ou `ESTORNO`, vinculado a uma
   unica `comissao`, com referencia ao evento original quando for estorno;
2. `comissao_baixa_conciliacoes`: alocacoes entre o evento de baixa e uma ou
   mais `comissao_conciliacoes` confirmadas.

Campos minimos a decidir para `comissao_baixas`:

- `id`;
- `comissao_id -> comissoes.id`;
- `tipo` (`BAIXA | ESTORNO`);
- `baixa_origem_id -> comissao_baixas.id` para o estorno;
- `origem_tipo` (`MANUAL | ARQUIVO | INTEGRACAO`), coerente com o extrato;
- `valor_efetivo`, com semantica e sinal fechados;
- `data_efetiva`;
- `justificativa` e `motivo_tipo`;
- `chave_idempotencia` unica no escopo correto;
- `criado_por_id -> profiles.id` e `criado_em`;
- eventual `versao_comissao`/token de concorrencia, se a estrategia do backend
  nao usar outro mecanismo.

Campos minimos a decidir para a alocacao:

- `id`;
- `baixa_id -> comissao_baixas.id`;
- `conciliacao_id -> comissao_conciliacoes.id`;
- `valor_aplicado`;
- unicidade do par e constraints de soma/sinal.

Um comando/lote de confirmacao pode criar varias baixas, uma por comissao, e
cada baixa pode consumir uma ou mais conciliacoes. Essa direcao preserva a
cardinalidade N:N do 3.2 e mantem o evento financeiro ancorado na comissao.
Ainda depende de aprovacao explicita.

## Entidades, FKs e campos a consumir

### Agenda e origem contratual

- `comissoes`: `id`, `proposta_id`, `parcela_id`, `numero`, `tipo_comissao`,
  `percentual`, `base_calculo`, `valor_previsto`, `valor_recebido`,
  `valor_diferenca`, `status`, `prevista_em`, `recebida_em`,
  `competencia_inicio`, `competencia_fim` e `observacoes`;
- `propostas`: `id`, `apolice_id`, `tipo`, numeros de proposta/endosso/fatura,
  competencia e datas documentais necessarias para identificacao/navegacao;
- `apolices`: `id`, `segurado_id`, `seguradora_id`, `ramo_id`, numero e produtor
  quando necessario para contexto;
- `parcelas`: `id`, `proposta_id` e `numero`, somente quando a comissao/item
  realmente informar a parcela;
- `segurados`: `id`, `filial_id` e `nome`;
- `filiais`, `seguradoras` e `ramos`: `id` e rotulos operacionais;
- FKs: `comissoes.proposta_id -> propostas.id`,
  `comissoes.parcela_id -> parcelas.id` opcional,
  `propostas.apolice_id -> apolices.id`,
  `apolices.segurado_id -> segurados.id`,
  `apolices.seguradora_id -> seguradoras.id`,
  `apolices.ramo_id -> ramos.id` e `segurados.filial_id -> filiais.id`.

### Extrato, itens e conciliacao

- `comissao_extratos`: identidade e escopo (`id`, `tenant_id`, `filial_id`,
  `seguradora_id`), identificacao/periodo/datas, origem/formato/referencia/hash,
  chave/tentativa/status, totais, erros, autoria e timestamps;
- `comissao_extrato_itens`: identidade externa/chave, referencias informadas de
  produtor, ramo, proposta, apolice, endosso, documento, parcela e segurado,
  competencia/datas, valores bruto/liquido/descontos, percentual, tipo de
  comissao, lote/referencia, descricao, status e timestamps;
- `comissao_conciliacoes`: `item_id`, `comissao_id`, chave, tipo/estado,
  confianca, snapshots, valores informado/alocado/conciliado/diferenca,
  percentuais, competencias, motivo, autoria e timestamps;
- `comissao_conciliacao_ocorrencias`: `item_id`, `conciliacao_id`, tipo/estado,
  motivo, valores/percentuais/competencias comparados, resolucao, autoria e
  timestamps;
- FKs principais: extrato -> filial/seguradora/profiles; item -> extrato e,
  quando resolvidos, produtor/ramo; conciliacao -> item/comissao/profiles;
  ocorrencia -> item e conciliacao opcional.

### Efeitos e auditoria

- `repasses`: `id`, `comissao_id`, `status`, `liberado_em`, `pago_em` e campos
  necessarios para bloquear/reverter a liberacao; nenhuma operacao de pagamento
  entra no 3.3;
- `profiles`: autoria operacional;
- `audit_logs`: entidade, ID, campo/acao, valores anterior/novo, usuario,
  origem e timestamp, como trilha tecnica adicional;
- futuras entidades de baixa/estorno e alocacao, se aprovadas, com as FKs
  recomendadas na secao anterior.

Nenhum desses joins autoriza fundir contrato, documento, parcela, comissao,
extrato, conciliacao, ocorrencia, baixa ou repasse numa entidade unica.

## Aderencia atual de `database.ts`

- `ComissaoRow` espelha os campos de `comissoes` do v2.3 e usa unions para
  `ComissaoTipo` e `ComissaoStatus`.
- As quatro entidades do 3.2, seus campos, FKs logicas e unions de origem,
  processamento, item, associacao, ocorrencia e resolucao estao representadas.
- Os campos concorrentes `extrato_numero` e `seguradora_lote` nao existem mais
  em `ComissaoRow`, coerente com o v2.3.
- A divergencia nao e um drift exclusivo do TypeScript: DBML e `database.ts`
  estao alinhados, mas ambos nao possuem entidade/tipo de baixa e estorno.
- `RepasseRow.status` ainda e `string | null`; isso pertence ao 3.5, salvo o
  minimo estritamente necessario para demonstrar a liberacao derivada no 3.3.

## Evidencias de mercado aplicadas com cautela

- SegFy usa um cabecalho manual e varios itens, permite anexar arquivo opcional,
  busca apolice/parcela, confere o total e finaliza a baixa.
- SegFy tambem demonstra desfazimento, mas o procedimento observado apenas
  desmarca o recebimento na parcela; o WassisCRM nao deve copiar essa perda de
  historico.
- Quiver separa cadastro de recibo, baixa, ocorrencias e reprocessamento; baixa
  somente itens sem inconsistencias e registra data de recebimento/liberacao de
  repasse.
- Quiver possui relatorio de saldo de comissoes, reforcando a necessidade de
  manter saldo e diferenca consultaveis.
- Comportamentos inseguros dos benchmarks — criar parcela/comissao ausente ou
  ajustar automaticamente o previsto — permanecem rejeitados.

## Respostas planejadas as questoes do recorte

### 1. Uma comissao admite uma ou varias baixas?

A evidencia de parcialidade e N:N sustenta **varias baixas** sobre a mesma
comissao. Cada baixa deve ser um evento separado; o saldo permanece na mesma
comissao. O contrato v2.3 nao representa isso e precisa ser evoluido antes da
implementacao. Decisao de produto/contrato sujeita a revisao do usuario.

### 2. Uma baixa pode se relacionar a mais de um item conciliado?

Sim como direcao recomendada: uma baixa de uma comissao pode agregar varias
conciliacoes confirmadas, e um comando de confirmacao pode baixar varias
comissoes. O v2.3 representa os vinculos item-comissao, mas nao o vinculo
baixa-conciliacao; a ponte proposta depende de aprovacao.

### 3. Baixa parcial mantem saldo na mesma comissao?

Sim. Nao deve criar outra comissao nem dividir o fato materializado pela Fase 2.
O saldo e derivado do previsto menos a soma liquida de baixas nao estornadas,
com tratamento de sinal para `RESTITUICAO`. A comissao fica operacionalmente
`PARCIAL` ate zerar o saldo ou ser tratada por divergencia/cancelamento.

### 4. Pode haver baixa manual sem extrato?

Pode haver baixa sem **arquivo fisico**, mas nao sem trilha de extrato/item. O
fluxo manual cria `comissao_extratos.origem_tipo = MANUAL`, um ou mais itens
digitados e associacoes manuais confirmadas. Baixa direta que pula extrato,
item e conciliacao fica bloqueada. Alterar essa regra exige decisao explicita.

### 5. Quais status pertencem a cada entidade?

- comissao persistida no v2.3: `PREVISTA | RECEBIDA | DIVERGENTE | CANCELADA`;
- estado operacional derivado da linha: `PENDENTE | CONCILIADA | PARCIAL |
  DIVERGENTE | BAIXADA | CANCELADA`, sem persistir sinonimo antes da revisao
  contratual;
- extrato: processamento e conciliacao ja definidos no 3.2;
- item: `PENDENTE | SUGERIDO | CONCILIADO | PRONTO_PARA_BAIXAR | PARCIAL |
  AMBIGUO | NAO_ENCONTRADO | DIVERGENTE | IGNORADO`;
- associacao: tipo `EXATA | PARCIAL | SUGERIDA | MANUAL` e estado `SUGERIDA |
  CONFIRMADA | REJEITADA | CANCELADA`;
- ocorrencia: `ABERTA | EM_ANALISE | RESOLVIDA | IGNORADA`;
- baixa/estorno: vocabulário ainda inexistente no contrato; recomenda-se evento
  `BAIXA | ESTORNO`, sem apagar o evento anterior.

Precedencia visual proposta para comissao: `CANCELADA`, `DIVERGENTE`, `BAIXADA`,
`PARCIAL`, `CONCILIADA`, `PENDENTE`.

### 6. O contrato ja representa historico de baixa?

Nao. Ele representa historico de extrato, item, associacao e ocorrencia, mas
somente campos acumulados/finais na comissao para a baixa. Essa e a principal
lacuna contratual do 3.3.

### 7. Como impedir dupla baixa?

O backend futuro deve combinar:

- chave idempotente unica por comando/evento de baixa;
- unicidade de cada alocacao baixa+conciliacao;
- validacao transacional do saldo disponivel da comissao e da conciliacao/item;
- lock/controle de versao para comandos concorrentes;
- rejeicao de conciliacao cancelada, rejeitada, ja consumida ou sobrealocada;
- repeticao da mesma chave retornando o mesmo resultado, nunca nova baixa.

As unicidades do 3.2 impedem associacao duplicada, mas sozinhas nao impedem
baixa duplicada.

### 8. Estorno entra no 3.3?

O macro e o plano transversal ja exigem desfazimento auditado e reconciliacao
dos repasses. Portanto, o **estorno da baixa manual entra no 3.3**, mas deve ser
um evento compensatorio, nao exclusao/limpeza do historico. Sua implementacao
fica bloqueada ate a modelagem contratual e a regra com repasses serem aprovadas.

### 9. Qual evento altera o estado sem substituir o historico?

`BAIXA` acrescenta valor recebido; `ESTORNO` referencia e compensa uma baixa
anterior. Correcao de valor = estorno total do evento incorreto + nova baixa.
`comissoes.valor_recebido`, `valor_diferenca`, `recebida_em` e `status` podem ser
projecoes/denormalizacoes transacionais desses eventos, nunca a unica historia.

### 10. Quais decisoes exigem revisao antes da implementacao?

Todas as listadas em `Decisoes obrigatorias do usuario`, especialmente novas
entidades, cardinalidade, semantica bruto/liquido, status parcial, justificativas,
estorno e dependencia com repasses.

## Semantica dos valores

| Conceito | Fonte/derivacao planejada | Regra |
|---|---|---|
| Valor previsto | `comissoes.valor_previsto` | Snapshot da Fase 2; nunca reescrito pela baixa |
| Valor informado no extrato | bruto/liquido/descontos em `comissao_extrato_itens` | Preserva o que a seguradora informou; a base operacional bruto x liquido depende de decisao |
| Valor conciliado | soma de `comissao_conciliacoes.valor_conciliado` confirmadas | Prova de associacao; ainda nao e recebimento |
| Valor efetivamente recebido | valor confirmado pelo operador em cada evento de baixa | Requer data efetiva e autoria |
| Valor baixado | soma de baixas menos estornos aplicados | Igual ao efetivamente recebido apos confirmacao, mas permanece distinguivel na previa/historia |
| Saldo | previsto menos baixado, com regra de sinal aprovada | Mantem parcialidade na mesma comissao |
| Diferenca | recebido/baixado menos previsto ou diferenca do item/associacao | Exibir por camada; nao colapsar divergencias distintas em um numero unico |

`valor_diferenca` em `comissoes` deve ser tratado como projecao final/agregada.
As diferencas de item e associacao continuam preservadas nos registros do 3.2.

### Ponto aberto: bruto x liquido

O v2.3 guarda `valor_bruto_informado`, `valor_liquido_informado` e descontos,
mas nao fecha qual deles alimenta `valor_recebido` da comissao. A recomendacao e
comparar previsto com a base de comissao contratual e registrar como efetivamente
recebido o valor financeiro escolhido de forma explicita no resumo, sem importar
imposto, fluxo de caixa ou regra contabil. A base padrao precisa da decisao do
usuario e de contrato antes da execucao.

## Regras de consulta e apresentacao

### Totais compactos

- previsto no periodo;
- informado em itens filtrados;
- conciliado confirmado;
- baixado liquido de estornos;
- saldo pendente;
- divergencias/ocorrencias abertas.

Totais devem reagir ao escopo de corretora e filtros, informar a base usada e
nao misturar valores brutos e liquidos.

### Filtros

- corretora;
- segurado;
- seguradora;
- ramo;
- proposta/apolice/endosso/fatura;
- competencia prevista e informada;
- data prevista e data efetiva;
- tipo de comissao;
- estado operacional da comissao;
- status do item/conciliacao;
- com ou sem extrato/arquivo;
- com ocorrencia aberta;
- busca por identificacao externa/lote/referencia informada.

### Tabela operacional

Colunas minimas:

- selecao;
- corretora e segurado;
- origem contratual navegavel;
- seguradora e ramo;
- numero/tipo/competencia/data prevista;
- percentual e base;
- previsto, informado, conciliado, baixado, saldo e diferenca;
- estado operacional textual;
- ocorrencias;
- acoes.

Usar tabela densa, moeda/datas em padrao pt-BR, fonte mono para valores/IDs e
badges semanticos. Cor de ramo nunca representa status.

## Ciclo de vida no cockpit

1. **Materializada:** a Fase 2 cria a comissao `PREVISTA`.
2. **Pendente:** ainda nao ha associacao confirmada nem baixa.
3. **Sugerida/associada:** item aponta para a comissao, mas sugestao ainda nao
   autoriza baixa.
4. **Conciliada:** uma ou mais associacoes confirmadas comprovam o valor, sem
   alterar recebimento.
5. **Pronta para baixar:** item/associacao elegiveis e sem ocorrencia bloqueante.
6. **Parcialmente baixada:** existe baixa menor que o saldo total; a mesma
   comissao continua aberta.
7. **Baixada:** saldo zerado dentro da tolerancia aprovada.
8. **Divergente:** diferenca ou ocorrencia exige tratamento/aceite explicito.
9. **Estornada:** evento compensatorio reabre total ou parcialmente o saldo,
   preservando ambos os eventos.
10. **Cancelada:** fato contratual cancelado; nao admite nova baixa.

## Elegibilidade e bloqueios da baixa manual

### Habilitar quando

- usuario possui permissao de atualizacao no Financeiro e acesso a corretora;
- comissao existe, pertence ao mesmo tenant/corretora/seguradora e nao esta
  cancelada;
- ha saldo disponivel coerente com o sinal do fato;
- data efetiva e valor sao validos;
- existe extrato/item manual e associacao `CONFIRMADA`;
- conciliacoes e itens possuem valor disponivel nao consumido;
- nao existe ocorrencia bloqueante aberta;
- a chave idempotente e nova ou corresponde ao mesmo comando anterior.

### Impedir quando

- comissao cancelada ou saldo zerado;
- item ambiguo, nao encontrado, duplicado, ignorado ou sem associacao confirmada;
- associacao apenas sugerida, rejeitada ou cancelada;
- valor excede saldo/alocacao sem tratamento explicito;
- ha divergencia bloqueante nao resolvida;
- tentativa repete conciliacao/valor ja baixado;
- estorno conflita com repasse ja pago;
- dados pertencem a corretoras/seguradoras incompatíveis.

## Comportamento por tipo/estado da conciliacao

- **Exata + confirmada:** elegivel para baixa total ate o valor disponivel.
- **Parcial + confirmada:** elegivel apenas para o valor alocado/disponivel;
  mantem saldo na comissao e/ou no item.
- **Ambigua:** bloqueia; operador deve escolher a comissao correta ou tratar a
  ocorrencia.
- **Sugerida:** nao baixa; deve ser confirmada ou rejeitada antes.
- **Manual:** pode baixar depois de confirmada; divergencias continuam visiveis
  e nao sao apagadas pelo vinculo manual.
- **Nao encontrada:** bloqueia; nunca cria comissao. Corrigir o contrato na Fase
  2 ou identificar outra comissao e reprocessar.
- **Divergente:** bloqueia por padrao. Pode seguir somente por aceite explicito
  autorizado, com ocorrencia resolvida como `DIVERGENCIA_ACEITA` e justificativa.
- **Ignorada:** nao participa da baixa.

## Divergencias e justificativas

Tratar separadamente:

- valor;
- percentual;
- competencia;
- parcela;
- proposta/documento;
- apolice;
- segurado;
- duplicidade;
- comissao ja conciliada ou ja recebida;
- identificacao insuficiente.

### Justificativa obrigatoria

- aceite de qualquer divergencia;
- baixa parcial por decisao do operador quando o item poderia cobrir o total;
- baixa com data efetiva diferente da data informada/credito;
- estorno total ou parcial;
- correcao por estorno + nova baixa;
- vinculo manual que contrarie sinais fortes de documento, competencia,
  percentual ou valor;
- ignorar item/ocorrencia.

Baixa exata, integral, com associacao confirmada e datas coerentes pode usar
justificativa opcional. Os tipos fechados de motivo ainda dependem de contrato.

## Autoria, datas e historico

- `data_efetiva` representa a data operacional do recebimento reconhecido;
- `criado_em` representa quando o comando foi registrado;
- autoria vem do perfil autenticado, nunca de campo livre;
- cabecalho, item, associacao, ocorrencia, baixa e estorno mantem timestamps
  proprios;
- historico apresenta eventos em ordem cronologica, com previsto, informado,
  conciliado, baixa, estorno, saldo apos evento, autor e justificativa;
- `audit_logs` registra a mutacao tecnica, mas a UI consulta os eventos de
  negocio, nao reconstrói o dominio por parse de logs.

## Baixa total, parcial e diferencas

- total: valor aplicado zera o saldo dentro da tolerancia aprovada;
- parcial: valor aplicado e menor que o saldo e mantem a mesma comissao aberta;
- excedente: bloqueado por padrao; eventual aceite de sobrepagamento exige
  decisao explicita e ocorrencia;
- valor inferior/superior ao previsto nao altera `valor_previsto`;
- `RESTITUICAO` exige calculo por sinal/magnitude definido em contrato; nao usar
  `Math.abs` indiscriminadamente na persistencia;
- tolerancia monetaria/percentual nao foi fechada no v2.3 e precisa de decisao.

## Estorno e correcao

- estorno entra no 3.3 como evento compensatorio auditado;
- nao apagar baixa, item, associacao ou ocorrencia;
- estorno parcial, se autorizado, compensa somente parte do evento original;
- nao permitir estornar mais que o saldo ainda ativo da baixa;
- se repasse vinculado estiver apenas `LIBERADO`, a transacao pode devolve-lo a
  `PREVISTO` conforme regra aprovada;
- se houver repasse `PAGO`, bloquear ate reversao no 3.5;
- correcao de dados da baixa = estornar e registrar nova baixa;
- cancelar associacao/extrato nao pode estornar recebimento silenciosamente.

## Arquivos provavelmente envolvidos na futura execucao

### Contrato e tipos, somente apos aprovacao

- novo par versionado em `.codex/artefatos/instrucoes_projeto_wassis_vX_Y.md` e
  `.codex/artefatos/wassis_erp_esqueleto_vX_Y.dbml`;
- `nexus-crm/src/types/database.ts`.

### Dominio e dados

- `nexus-crm/src/modules/financeiro/conciliacaoContract.ts` e testes;
- novos `comissoesDomain.ts` e `comissoesDomain.test.ts` no mesmo modulo;
- `nexus-crm/src/lib/inMemoryDb.ts`;
- `nexus-crm/src/lib/queryClient.ts`;
- possivel adapter dedicado apenas se a composicao da leitura nao couber no
  dominio/hook sem duplicacao.

### Hooks e interface

- novo `nexus-crm/src/hooks/useFinanceiroComissoes.ts`;
- `nexus-crm/src/pages/FinanceiroPage.tsx`, preferindo extrair a visao em
  componente proprio para evitar concentrar todo o cockpit num arquivo;
- novos componentes do assistente de baixa manual e historico em
  `nexus-crm/src/components/financeiro/`;
- componentes compartilhados de feedback/modal ja existentes.

Nao se preve nova rota principal, alteracao de sidebar, parser, upload funcional
ou componente de repasses completo no 3.3.

## Impactos futuros por camada

- **tipos:** eventos de baixa/estorno, alocacoes, motivos e projeções tipadas;
- **mock:** casos total, parcial, divergente, sem arquivo, varias conciliacoes,
  duplicidade, estorno e bloqueio por repasse pago;
- **regras puras:** calculo de saldos, status derivado, elegibilidade,
  justificativa, idempotencia e estorno;
- **hooks:** consulta, baixa, estorno e invalidacao coordenada de comissoes,
  extratos, conciliacoes e repasses;
- **UI:** lista operacional, filtros, resumo, assistente manual, previa,
  confirmacao e historico;
- **testes:** unitarios, integracao do mock e fluxo no navegador.

## Responsabilidades futuras do backend

- RLS/RBAC por tenant, corretoras acessiveis e perfil;
- consulta paginada/ordenada com filtros e agregados consistentes;
- validar toda a cadeia comissao -> proposta -> apolice -> filial/seguradora;
- comandos de baixa/estorno transacionais, idempotentes e concorrentes;
- constraints de soma, sinal, saldo e consumo de conciliacoes;
- gerar/projetar `valor_recebido`, `valor_diferenca`, `recebida_em` e status sem
  perder os eventos fonte;
- liberar ou reverter repasses vinculados na mesma transacao quando permitido;
- bloquear estorno com repasse pago;
- manter auditoria imutavel e autoria do servidor;
- devolver conflitos de versao/duplicidade de forma segura;
- expor previa sem persistencia e confirmacao com resultado item a item;
- definir retencao/referencia de anexo sem transformar o recorte em gestao
  bancaria, contabil ou fiscal.

## Proposta de fluxo da baixa manual

1. Acao `Baixa manual` na visao Comissoes, opcionalmente iniciada por uma ou
   mais linhas selecionadas.
2. **Cabecalho:** corretora, seguradora, identificacao, competencia/periodo,
   data de credito/recebimento, totais e observacao; arquivo e opcional.
3. **Itens:** buscar comissao por segurado/apolice/documento/numero/tipo e
   informar valores/datas; criar item manual, sem criar comissao.
4. **Associacao:** classificar e confirmar os vinculos; ocorrencias permanecem
   explicitas.
5. **Previa:** comparar total do cabecalho, soma dos itens, alocacoes, previsto,
   baixado anterior, novo saldo e diferencas.
6. **Resumo:** separar elegiveis, parciais, divergentes e bloqueados; exigir as
   justificativas cabiveis.
7. **Confirmacao:** comando idempotente cria eventos de baixa e efeitos
   transacionais; itens bloqueados nao sao mascarados.
8. **Historico:** exibir resultado, autoria, datas, ocorrencias e saldo por
   comissao.

A semantica de lote — atomico para todos ou sucesso parcial item a item — precisa
ser decidida. Recomendacao: cabecalho/itens/associacoes sao preservados, enquanto
a confirmacao retorna resultado por comissao e nao baixa itens inelegiveis; uma
mesma comissao deve ser atomica em todas as suas alocacoes.

## Aceite vigente do frontend — 11/09/2026

- [x] Consulta de comissões materializadas, filtros, origem contratual e cockpit entregues.
- [x] Baixa manual total/parcial com extrato lógico, conciliações e eventos normalizados; previsão preservada.
- [x] Estorno, justificativas, saldo, idempotência no mock e trava de repasse pago entregues, com testes do domínio.
- [x] Interface e fluxo principal validados no fechamento da execução; este registro reaproveita essas evidências.
- [x] Hand-off consolidado na seção 3 do [relatório raiz](../../relatorio-endpoints-campos.md).

A atomicidade/concorrência real e a autorização por servidor dependem do backend. A comissão usa PREVISTA/PARCIAL/RECEBIDA/DIVERGENTE/CANCELADA; conciliação e baixa têm estados/eventos próprios. Os critérios originais abaixo são referência histórica de planejamento, substituída por este aceite e pelo fechamento executado; não certificam concorrência distribuída.

## Critérios funcionais originais — referência histórica

- `Comissoes` consulta somente fatos materializados pela Fase 2;
- origem contratual e navegavel;
- agenda e valores previstos permanecem imutaveis pela baixa;
- estados pendente, conciliada, parcial, divergente, baixada e cancelada
      sao distinguiveis e explicados;
- filtros e totais refletem corretoras acessiveis e os valores corretos;
- baixa manual cria extrato/item manual mesmo sem arquivo;
- associacao sugerida/ambigua/nao encontrada nao baixa silenciosamente;
- baixa total e parcial preservam saldo e historico;
- varias conciliacoes podem alimentar uma baixa sem dupla alocacao;
- idempotencia impede repeticao por clique, retry e concorrencia;
- justificativa e obrigatoria nos casos definidos;
- estorno preserva a baixa original e respeita repasses;
- nenhuma conciliacao simples altera recebimento;
- nenhuma regra bancaria, contabil ou empresarial foi introduzida;
- `database.ts` fica aderente ao novo contrato aprovado;
- nenhum novo `any`, JSON de negocio, `setState(` em efeito evitavel ou
      dialogo nativo e introduzido.

## Critérios visuais e de UX — referência histórica

- manter o cockpit unico e a navegacao interna atual;
- tabela densa e operacional, sem criar card-pagina ou novo modulo;
- cabecalho e filtros compactos; acoes `Baixa manual` e
      `Importar PDF/Excel` permanecem distintas, com a segunda ainda orientadora
      ate o 3.4;
- status sempre tem rotulo textual e tom semantico; cor de ramo nao comunica
      estado;
- previsto, informado, conciliado, baixado, saldo e diferenca sao legiveis
      sem depender de tooltip;
- estados de carga, vazio geral, vazio por filtro, erro, somente leitura e
      sem permissao estao cobertos;
- modais fecham por clique fora e `Esc`, exceto durante salvamento/risco de
      perda;
- confirmacoes usam componente interno, nunca `window.confirm/alert/prompt`;
- zoom 100% e viewport desktop comum sem corte, sobreposicao ou overflow
      indevido.

## Estrategia de testes futura

### Unitarios

- calculo de previsto, conciliado, baixado, saldo e diferenca;
- estado derivado e precedencia;
- baixa total, parcial e sucessiva;
- varias conciliacoes na mesma baixa;
- extrato/item manual sem arquivo;
- bloqueios por status e ocorrencia;
- justificativas obrigatorias;
- idempotencia por chave e consumo;
- `RESTITUICAO` e sinal;
- estorno total/parcial e correcao por novo evento;
- bloqueio/reversao de repasse.

### Integracao no mock

- consulta completa com joins e filtros;
- comando preserva cabecalho, itens, conciliacoes, eventos, projecao da
  comissao, repasses e `audit_logs`;
- rollback integral por comissao em falha;
- retry devolve o mesmo resultado;
- concorrencia simulada nao sobrebaixa;
- Fase 2 nao regenera fato processado.

### Navegador

- abrir `Comissoes`, filtrar e navegar para apolice/documento;
- executar baixa manual exata total e parcial;
- tentar baixa sugerida, ambigua, nao encontrada e divergente;
- validar sem arquivo, justificativa, previa e historico;
- repetir confirmacao sem duplicar;
- estornar e observar saldo/repasse;
- validar permissoes e estados de interface;
- zoom 100% e viewport desktop comum.

### Verificacoes tecnicas na execucao

- TypeScript;
- Vitest focado e suite completa;
- ESLint focado e global, classificando divida legada;
- build;
- busca no diff por novo `any`, `setState(`, dialogos nativos, JSON de negocio e
  arquivos de configuracao;
- validacao visual unica e focada apos o fluxo funcional estar estavel.

## Fronteira precisa entre 3.3, 3.4 e 3.5

### 3.3 — entra

- lista, filtros, totais e agenda de comissoes;
- baixa manual com cabecalho/item digitados;
- associacao/conciliacao manual sobre o contrato comum;
- baixa total/parcial, historico, idempotencia e estorno;
- efeito minimo de liberar/reverter status de repasse vinculado, somente para
  demonstrar a dependencia transacional aprovada.

### 3.4 — nao antecipar

- upload funcional e leitura real de PDF/XLS/XLSX;
- parser por seguradora/layout e versao;
- extracao/normalizacao automatica;
- matching automatico, previa de arquivo e reprocessamento por parser;
- baixa em lote originada da leitura automatica;
- OCR ou formatos nao homologados.

`Importar PDF/Excel` pode permanecer como acao orientadora/indisponivel no 3.3,
sem falso upload.

### 3.5 — nao antecipar

- superficie operacional de Repasses;
- consulta por beneficiario e snapshot de favorecido;
- pagamento/desfazimento individual ou em lote;
- forma, referencia e comprovante de pagamento;
- criacao ou recomposicao de beneficiarios/regras.

No 3.3, apenas a transicao derivada `PREVISTO <-> LIBERADO` pode ser tocada na
medida estritamente necessaria para a baixa/estorno da comissao. Repasse `PAGO`
sempre bloqueia estorno ate o 3.5.

## Decisoes adotadas na autorizacao

1. Uma comissao admite N baixas e a parcial mantem saldo na mesma linha.
2. `comissao_baixas` guarda eventos imutaveis; a ponte
   `comissao_baixa_conciliacoes` suporta N conciliacoes por evento.
3. Sem conciliacao existente, a baixa cria extrato, item e conciliacao de origem
   `MANUAL`; quando existem conciliacoes confirmadas, consome-as sem duplicar o
   extrato.
4. Bruto, descontos e liquido informado permanecem nos itens; o operador informa
   explicitamente o valor efetivamente recebido no evento.
5. `PARCIAL` entrou no status persistido de `comissoes`; `CONCILIADA` e `BAIXADA`
   permanecem estados operacionais derivados no cockpit. Ocorrencia aberta/em
   analise ou associacao sugerida bloqueia baixa ate resolucao.
6. Estorno integral ou parcial e evento compensatorio, nunca exclusao.
7. Tolerancias fechadas em R$ 0,01 e 0,01 ponto percentual. Valor acima do
   saldo e divergencias de percentual/competencia exigem aceite e justificativa;
   os snapshots permanecem na conciliacao.
8. Motivos fechados: `EXATA | PARCIAL | DIVERGENCIA_ACEITA | CORRECAO |
   ESTORNO | OUTRO`; todos exceto `EXATA` exigem justificativa.
9. `RESTITUICAO` preserva sinal negativo em previsto, informado, baixa e estorno.
10. O mock executa o comando de baixa de forma atomica; o backend deve oferecer
    retorno por comissao sem perder atomicidade transacional do comando aceito.
11. Baixa libera `PREVISTO -> LIBERADO`; estorno total pode reabrir
    `LIBERADO -> PREVISTO`; `PAGO` bloqueia estorno.
12. O par contratual v2.4 foi criado antes da implementacao e `database.ts` foi
    alinhado na mesma rodada.

## Riscos e lacunas residuais

- estorno, idempotencia, consumo N:N e liberacao de repasse exigem transacao,
  lock/concurrency check e autorizacao real no backend;
- o backend deve recalcular a projecao de `comissoes` a partir dos eventos e nao
  confiar apenas em `saldo_apos`/`status_resultante` do frontend;
- layouts reais do 3.4 ainda podem exigir tolerancias especificas por seguradora;
  o contrato-base usa R$ 0,01 e 0,01 ponto percentual;
- lotes mistos com falha por item exigem contrato de resposta detalhado no
  backend sem permitir confirmacao silenciosamente parcial;
- a arvore Git continua contendo alteracoes preexistentes dos recortes 2.9b,
  3.1 e 3.2; autoria foi preservada e nao houve limpeza destrutiva;
- armazenamento/retencao de arquivo continua responsabilidade do backend e a
  leitura automatica permanece no 3.4.

## Fechamento da execucao

- contrato pareado v2.4 criado com D20, `PARCIAL`, eventos de baixa/estorno e
  ponte N:N para conciliacoes;
- `database.ts` alinhado ao v2.4 para o modulo alterado;
- dominio in-memory, hooks, query keys e testes implementados sem backend, SQL,
  migration ou JSON de negocio;
- `Comissoes` substituiu o placeholder no cockpit unico `/financeiro` com
  totais, filtros, agenda, selecao, baixa em wizard, historico e estorno;
- baixa manual sem arquivo e consumo de conciliacoes confirmadas usam o mesmo
  contrato, sem antecipar parser/upload do 3.4;
- repasse foi tocado apenas em `PREVISTO <-> LIBERADO`; pagamento permanece no
  3.5 e `PAGO` bloqueia estorno;
- Vitest financeiro focado: 24 testes aprovados, incluindo 11 casos do 3.3;
- TypeScript e ESLint focado aprovados;
- fluxo principal validado no navegador em viewport desktop 1440x900, zoom
  padrao 100%, incluindo baixa, historico e estorno, sem erro de runtime;
- suite completa aprovada: 22 arquivos e 137 testes;
- ESLint global e TypeScript aprovados;
- build de producao aprovado; permanece apenas o aviso conhecido de chunk
  principal acima de 500 kB, sem falha funcional.

## Validacao documental final

- o v2.4 nao recria fatos materializados pela Fase 2;
- extrato, item, associacao, conciliacao, ocorrencia, baixa e repasse permanecem
  separados;
- nenhuma regra de conciliacao bancaria foi introduzida;
- 3.4 permanece responsavel por upload/parser e 3.5 por pagamento de repasses;
- `relatorio-endpoints-campos.md` permanece snapshot parcial e inalterado;
- as responsabilidades transacionais, de concorrencia, permissao e auditoria do
  backend continuam registradas para o hand-off final.
