# 2.2f — Revisao da Visao geral e edicao auditada

Status: concluido em 2026-07-11.

Data de abertura: 2026-07-11.

## Classificacao

Governada/contratual.

Motivo: o recorte revisa a fonte contratual de `apolices` e `propostas`, altera
campos do esqueleto, antecipa a leitura dos catalogos de subtipo de endosso e
motivo de cancelamento, cria autoria auditada na pagina unica e muda a
hierarquia visual do cabecalho e da guia `Visao geral`.

## Objetivo

Adaptar `/apolices/:id` para que a pagina da apolice seja simples na leitura,
editavel sob acao explicita e coerente com cada tipo de documento.

O recorte deve:

- reduzir o cabecalho ao numero da apolice e aos dados essenciais do segurado;
- tornar o segurado um link explicito para sua pagina em nova aba;
- manter a `Visao geral` em modo de leitura por padrao;
- permitir edicao inline separada da apolice e do documento selecionado;
- registrar um `audit_log` imutavel por campo realmente alterado;
- mostrar campos documentais condicionais por `NOVA`, `RENOVACAO`, `ENDOSSO`,
  `CANCELAMENTO` e `FATURA`;
- trazer subtipo de endosso e motivo de cancelamento para o contrato de leitura
  e edicao desta tela, sem antecipar o fluxo completo de criacao da 2.7;
- simplificar premios para `premio_total` e `premio_liquido`, com valores
  negativos representando restituicao/estorno;
- retirar `data_efeito` e usar `propostas.vigencia_inicio` como inicio dos
  efeitos do documento; faturas continuam usando competencia.

## Fontes conferidas

- `.codex/artefatos/instrucoes_projeto_wassis_v2_1.md`;
- `.codex/artefatos/wassis_erp_esqueleto_v2_1.dbml`;
- `.codex/plans/macro_plano.md`;
- `.codex/plans/micro-plano-fase-2-completude-contratual.md`;
- micro-planos 2.1.1, 2.2, 2.3, 2.4 e 2.5;
- `nexus-crm/src/pages/ApoliceDetalhePage.tsx`;
- `nexus-crm/src/contexts/PropostasContext.tsx`;
- `nexus-crm/src/components/propostas/propostaSelectors.ts`;
- `nexus-crm/src/components/detail/useEntityTabsState.ts`;
- `nexus-crm/src/types/database.ts`;
- `nexus-crm/src/lib/inMemoryDb.ts`;
- `wassis-design-uiux`, `PRODUCT.md`, `DESIGN.md` e registro de produto do
  Impeccable;
- contextos locais SegFy sobre endossos de inclusao, exclusao, substituicao,
  alteracao, cancelamento e estorno negativo;
- contextos locais Quiver `ENDOSSO_NOVO`, `ENDOSSO_CANCEL` e
  `ENDOSSO_RESTITUICAO`.

## Leitura aplicada dos contextos de mercado

- tipo e subtipo do documento sao dimensoes operacionais distintas e ajudam a
  explicar por que um endosso existe;
- cancelamento precisa de motivo proprio; `motivo_recusa` nao substitui motivo
  de cancelamento;
- endosso/cancelamento usa inicio de vigencia do documento para determinar
  quando seus efeitos passam a valer;
- acrescimo, ausencia de movimento e restituicao sao efeitos financeiros, nao
  naturezas do endosso;
- estorno/restituicao pode ser representado por premio negativo, mantendo
  parcelas, comissoes e repasses com o mesmo sinal;
- o benchmark orienta nomenclatura e fluxo, mas o contrato final continua sendo
  do WassisCRM.

## Revisao geral da Fase 2

### Decisoes preservadas

- `apolices` continua sendo o contrato;
- `propostas` continua sendo o documento;
- `apolice_itens` continua sendo a identidade do risco;
- oito guias permanecem: quatro contratuais e quatro transversais;
- seletor horizontal de documentos permanece acima das guias;
- PDFs permanecem em `Anexos e logs`;
- `stage_id` nao altera automaticamente `apolices.status`;
- baixa, conciliacao, pagamento, estorno operacional e cobranca permanecem na
  Fase 3;
- importacao 2.3, aposentadoria de Emissao 2.6 e criacao de documentos 2.7 nao
  sao executadas por este recorte.

### Decisoes revisadas

- `stage_id` permanece no contrato de todos os documentos, mas a UI mostra
  `Etapa` somente quando o documento estiver em analise, pendente ou recusado;
  depois da emissao a etapa deixa de ocupar espaco na Visao geral;
- `data_efeito` sai do contrato; `vigencia_inicio` do documento passa a ser a
  referencia temporal de inclusao, exclusao, substituicao, cancelamento e
  versionamento de cobertura;
- `premio_adicional` e `premio_restituicao` saem do contrato; a tela e os fatos
  usam apenas `premio_total` e `premio_liquido`, com sinal negativo para
  restituicao/estorno;
- `tipo_movimento_endosso` passa a representar somente natureza canonica do
  movimento, nunca efeito financeiro;
- subtipo de endosso e motivo de cancelamento tornam-se catalogos persistentes;
- a pagina deixa de ser somente leitura e ganha edicao auditada em modo
  explicito.

## Evolucao do contrato

As remocoes/renomeacoes sao breaking changes. Antes de alterar o frontend,
foi criado o par v2.1 de instrucoes e DBML, sem editar silenciosamente o v2.0
historico. O numero v2.1 foi uma decisao explicita de produto, registrada no
changelog do novo contrato.

### Remover de `propostas`

- `data_efeito`;
- `premio_adicional`;
- `premio_restituicao`.

### Preservar e refinar em `propostas`

- `stage_id`: tramitacao de qualquer documento;
- `vigencia_inicio`: inicio dos efeitos contratuais do documento;
- `vigencia_fim`: fim da vigencia documental quando aplicavel;
- `premio_total` e `premio_liquido`: valores com sinal;
- `tipo_movimento_endosso`: natureza canonica fixa no codigo;
- `motivo_recusa`: somente recusa de tramitacao, nunca cancelamento.

Naturezas canonicas iniciais:

- `ALTERACAO_DADOS`;
- `INCLUSAO_ITEM`;
- `EXCLUSAO_ITEM`;
- `SUBSTITUICAO_ITEM`;
- `ALTERACAO_COBERTURA`;
- `ALTERACAO_IMPORTANCIA_SEGURADA`;
- `ALTERACAO_CLAUSULA`.

O efeito financeiro e derivado:

- `premio_total > 0`: acrescimo;
- `premio_total = 0` ou `NULL`: sem movimento/a apurar conforme contexto;
- `premio_total < 0`: restituicao/estorno.

### Catalogo `endosso_subtipos`

Contrato minimo a decidir no novo DBML:

- `id`;
- `tenant_id`;
- `filial_id` nullable;
- `ramo_id` nullable;
- `nome`;
- `natureza_canonica`;
- `ordem`;
- `ativo`;
- `observacoes`.

Adicionar `propostas.endosso_subtipo_id` nullable, obrigatorio na aplicacao
quando `propostas.tipo = ENDOSSO`.

### Catalogo `cancelamento_motivos`

Contrato minimo a decidir no novo DBML:

- `id`;
- `tenant_id`;
- `filial_id` nullable;
- `ramo_id` nullable;
- `nome`;
- `ordem`;
- `ativo`;
- `observacoes`.

Adicionar `propostas.cancelamento_motivo_id` nullable, obrigatorio na aplicacao
quando `propostas.tipo = CANCELAMENTO`.

O CRUD administrativo completo desses catalogos continua na 2.7. Neste recorte,
o front implementa tipos, relacoes, seeds e selects de valores ativos para a
edicao do documento existente.

### Auditoria

`audit_logs` nao precisa de nova tabela nem deve ser fundida com `atividades`.
Cada alteracao salva gera linha imutavel com:

- `entidade_tipo = apolice | proposta`;
- `entidade_id` correto;
- `campo`;
- `valor_antigo`;
- `valor_novo`;
- `acao = UPDATE`;
- `user_id` da sessao;
- `ocorrido_em`;
- `origem = FRONT_MOCK` no mock e origem equivalente no backend.

No backend definitivo, a escrita deve ser garantida por trigger. No mock, um
adapter simula o mesmo resultado. A guia `Anexos e logs` continua read-only e
exibe essas linhas ao ativar `Todos os eventos`.

## Cabecalho revisado

O cabecalho deve ser simples, sem repetir dados que pertencem a Visao geral.

### Conteudo

- acao `Voltar`;
- linha compacta `Apolice {numero_apolice}`; quando nao houver numero, usar
  `Apolice em emissao`;
- nome do segurado como link para `/segurados/:seguradoId`, abrindo em nova aba;
- CPF/CNPJ formatado;
- cidade/UF;
- e-mail principal;
- telefone principal.

Campos ausentes nao geram traco nem espaco vazio. Seguradora, ramo, produtor,
status, vigencia e premios saem do cabecalho e permanecem no `Resumo
contratual` da Visao geral.

### Hierarquia visual

- numero da apolice em tamanho de corpo forte/ID, sem comportamento de hero;
- segurado como informacao principal do cabecalho, sem card decorativo;
- dados de contato em uma linha que pode quebrar de forma controlada;
- link do segurado com foco visivel, `ArrowUpRight` e nome acessivel indicando
  abertura em nova aba;
- preservar densidade, dark mode e ausencia de overflow.

### Dados necessarios na projecao

Expandir a leitura/projecao da apolice com dados reais de `segurados`:

- `seguradoId`;
- `insured`/nome;
- `cpf_cnpj`;
- `cidade`;
- `estado`;
- `email`;
- `telefone`.

Nao copiar esses campos para `apolices` nem `propostas`; a fusao acontece apenas
na leitura.

## Visao geral revisada

### Modo de leitura

Padrao ao abrir a pagina. Dois blocos editaveis independentes:

1. `Resumo contratual` (`apolices`): seguradora, ramo, produtor, status,
   vigencia, premio total e premio liquido;
2. `Documento selecionado` (`propostas`): campos condicionais ao tipo.

O historico documental permanece somente leitura. Campos vazios ou
inaplicaveis nao ocupam celulas artificiais.

### Modo de edicao

- acao `Editar` no Resumo contratual;
- acao `Editar` para documento em tramitacao;
- acao `Corrigir dados` para documento emitido/oficial;
- ao acionar, somente o bloco correspondente vira formulario inline;
- acoes `Cancelar` e `Salvar alteracoes` no proprio bloco;
- apolice e documento nunca sao salvos na mesma submissao silenciosa;
- salvar somente campos que mudaram;
- bloquear troca de documento, guia, retorno ou fechamento quando houver
  alteracao nao salva, usando confirmador interno do sistema;
- durante salvamento, bloquear nova submissao e fechamento do formulario;
- feedback por toast/banner interno, nunca `window.alert`/`confirm`.

## Matriz condicional do documento

### Comuns quando preenchidos/aplicaveis

- tipo do documento;
- numero oficial;
- data de emissao;
- vigencia do documento;
- premio total;
- premio liquido;
- forma/periodicidade de pagamento;
- quantidade e primeira parcela.

### Documento em tramitacao ou recusado

- etapa;
- transmissao;
- recebimento pela seguradora;
- aceitacao ou recusa;
- motivo da recusa quando recusado.

Depois de emitido, esses campos de tramitacao deixam de aparecer no resumo,
salvo informacao excepcional que precise ser preservada no historico tecnico.

### `NOVA` e `RENOVACAO`

- numero da proposta/apolice conforme o documento;
- vigencia;
- premios;
- pagamento;
- etapa somente durante tramitacao/recusa.

### `ENDOSSO`

- numero do endosso, inclusive `Endosso 0` quando oficial;
- subtipo administravel;
- natureza canonica derivada do subtipo;
- inicio de vigencia do endosso;
- premio total e liquido com sinal;
- resumo `Antes x Depois` quando houver dados reais de itens/coberturas.

### `CANCELAMENTO`

- numero oficial;
- motivo do cancelamento;
- inicio de vigencia do cancelamento;
- premio total e liquido com sinal negativo quando houver restituicao;
- zero/ausencia de premio quando for cancelamento sem movimento.

### `FATURA`

- numero da fatura;
- competencia inicial/final;
- emissao;
- premio total e liquido;
- pagamento/parcelamento quando aplicavel;
- etapa somente se ainda estiver em tramitacao ou recusada.

## Regras de validacao

- subtipo e obrigatorio para `ENDOSSO`;
- motivo e obrigatorio para `CANCELAMENTO`;
- competencia inicial/final e obrigatoria para `FATURA`;
- `competencia_fim >= competencia_inicio`;
- `vigencia_fim >= vigencia_inicio` quando ambas existirem;
- numero oficial emitido nao pode ser apagado sem feedback de erro;
- premios aceitam valor negativo e preservam o sinal nas agendas geradas;
- stage documental nunca altera sozinho o status da apolice;
- documento recusado nao aplica efeitos de item, cobertura ou cancelamento;
- documento emitido corrigido nao reescreve historico de item/cobertura nem
  agendas ja materializadas sem operacao contratual explicita;
- alteracao de grade/regra nao reescreve snapshots.

## Impacto nos demais recortes da Fase 2

### 2.1/2.1.1

- selectors e DTOs deixam de usar `data_efeito`;
- ordenacao documental usa competencia para fatura e, nos demais documentos,
  vigencia, emissao e fallback seguro;
- efeito financeiro passa a ser derivado do sinal de premio;
- labels passam a resolver subtipo/motivo por catalogo.

### 2.3 — Importacao

- revisar de-para para subtipo de endosso e motivo de cancelamento;
- importar inicio de vigencia, nao `data_efeito`;
- importar premio total/liquido com sinal;
- nao gerar `premio_adicional`/`premio_restituicao`;
- manter a importacao nao executada nesta rodada.

### 2.4 — Itens e coberturas

- perspectiva temporal e `Antes x Depois` passam a usar
  `propostas.vigencia_inicio`;
- FKs de inclusao/exclusao continuam apontando para o documento responsavel;
- nenhuma identidade de item e alterada.

### 2.5 — Agendas

- parcelas, comissoes e repasses preservam o sinal do premio;
- restituicao gera fatos negativos quando aplicavel;
- este recorte nao executa baixa/estorno financeiro da Fase 3.

### 2.6 — Emissao

- `stage_id` continua sendo a tramitacao do documento e a fonte do Painel;
- a Visao geral apenas reduz sua exibicao depois da emissao.

### 2.7 — Documentos derivados

- permanece responsavel pelo CRUD administrativo dos catalogos e pelos fluxos
  de criar/registrar renovacao, endosso, cancelamento e fatura;
- reutiliza o contrato e os componentes de formulario estabelecidos em 2.2f.

## Recortes executaveis

### 2.2f-a — Contrato versionado

- criar instrucoes/DBML da nova versao major;
- remover os tres campos obsoletos;
- criar catalogos e FKs;
- reconciliar decisoes, comentarios, refs e changelog;
- comparar mecanicamente `database.ts` com o novo contrato.

### 2.2f-b — Tipos, mocks e selectors

- atualizar `database.ts`, `inMemoryDb`, `Proposal` e adapters;
- semear subtipos, motivos, cancelamento com/sem restituicao e endosso negativo;
- atualizar ordenacao, documento vigente e efeito financeiro;
- levar dados de contato do segurado para a projecao de leitura.

### 2.2f-c — Cabecalho e leitura condicional

- implementar cabecalho compacto;
- link do segurado em nova aba;
- mover seguradora/ramo/status/vigencia para o Resumo contratual;
- renderizar matriz condicional sem campos vazios artificiais.

### 2.2f-d — Edicao auditada

- formularios inline independentes de apolice/documento;
- validacoes por tipo;
- salvar diff no mock;
- gerar `audit_logs` por campo;
- proteger alteracoes nao salvas e estados de salvamento.

### 2.2f-e — Reconciliacao e validacao

- atualizar selectors/listas afetados da Fase 2;
- ajustar notas dos micro-planos 2.3/2.4/2.5;
- validar leitura, edicao, cancelamento, endosso, fatura e logs;
- confirmar que 2.3 nao foi executada e que a Fase 3 permaneceu intacta.

## Arquivos frontend provaveis

- `nexus-crm/src/pages/ApoliceDetalhePage.tsx`;
- componentes novos de cabecalho, resumo e formulario em
  `nexus-crm/src/components/apolices/`;
- `nexus-crm/src/components/propostas/propostaSelectors.ts` e testes;
- `nexus-crm/src/components/propostas/propostaFormat.ts`;
- `nexus-crm/src/contexts/PropostasContext.tsx`;
- `nexus-crm/src/types/proposta.ts`;
- `nexus-crm/src/types/database.ts`;
- `nexus-crm/src/lib/inMemoryDb.ts`;
- `nexus-crm/src/components/detail/useEntityTabsState.ts` e testes;
- novo contrato versionado em `.codex/artefatos`;
- macro e micro-planos afetados.

## Testes focados obrigatorios

- cabecalho exibe somente numero da apolice e dados disponiveis do segurado;
- link do segurado abre `/segurados/:id` em nova aba e possui nome acessivel;
- seguradora e ramo aparecem na Visao geral, nao no cabecalho;
- documento emitido nao exibe etapa;
- documento pendente/recusado exibe etapa e campos de tramitacao aplicaveis;
- endosso exige subtipo e resolve natureza canonica;
- cancelamento exige motivo;
- fatura exige competencia e nao mostra campos de recusa vazios;
- premio negativo e exibido e propagado com sinal;
- selector nao depende de `data_efeito`;
- editar/cancelar nao altera o mock;
- salvar altera somente campos modificados;
- cada campo alterado gera um `audit_log` com entidade/ID corretos;
- logs aparecem em `Anexos e logs` ao ativar eventos tecnicos;
- troca com alteracoes nao salvas usa confirmador interno;
- quatro guias contratuais e quatro transversais permanecem intactas.

## Verificacao prevista

- comparacao mecanica do novo DBML com `database.ts` no eixo tocado;
- TypeScript;
- ESLint focado;
- Vitest focado e suite completa;
- build;
- navegador em apolice simples, proposta em tramitacao, endosso, cancelamento,
  fatura mensal e premio negativo;
- troca de documento e escopo transversal;
- desktop comum, zoom 100%, dark mode, teclado e sem overflow;
- console sem erros.

## Criterios de aceite

- [x] Novo contrato versionado substitui o v2.0 como fonte vigente sem apagar o
      historico documental.
- [x] `data_efeito`, `premio_adicional` e `premio_restituicao` nao existem mais
      no contrato/tipos/mock/UI.
- [x] Premio total/liquido aceita e preserva valores negativos.
- [x] Subtipo de endosso e motivo de cancelamento possuem catalogos/FKs.
- [x] Cabecalho exibe apenas numero da apolice e dados essenciais do segurado.
- [x] Segurado abre sua pagina em nova aba.
- [x] Seguradora e ramo permanecem na Visao geral.
- [x] Etapa aparece somente durante tramitacao/recusa.
- [x] Campos documentais variam corretamente por tipo.
- [x] Visao geral abre em leitura e possui edicao inline explicita.
- [x] Apolice e documento possuem salvamentos independentes.
- [x] Todo campo alterado gera `audit_log` imutavel.
- [x] Historico emitido nao e reescrito destrutivamente.
- [x] Oito guias e seletor horizontal permanecem sem overflow.
- [x] 2.3, 2.6, 2.7 e Fase 3 nao sao executadas indevidamente.
- [x] Fluxos principais foram exercitados no navegador.

## Fechamento

Concluido em 2026-07-11 com contrato v2.1, types/mock/selectors reconciliados,
pagina de apolice com leitura e edicao auditada, testes locais e CI/CodeQL
aprovados na PR #38, mesclada em `main`.

## Fora de escopo

- executar a importacao 2.3;
- remover o modulo Emissao 2.6;
- criar novos endossos, cancelamentos, renovacoes ou faturas da 2.7;
- CRUD administrativo completo dos catalogos em Configuracoes;
- baixa, conciliacao, pagamento, estorno operacional, cobranca ou lote da Fase
  3;
- backend, API real, SQL, migration, trigger ou RLS/RBAC;
- atualizar `relatorio-endpoints-campos.md` antes da consolidacao autorizada.

## Hand-off futuro

Leituras:

- obter apolice com segurado e contatos sem duplicar campos no contrato;
- obter documento com subtipo/motivo e natureza canonica;
- listar catalogos ativos por grupo/corretora/ramo;
- retornar campos editaveis e permissoes aplicaveis.

Escritas:

- atualizar apolice e proposta separadamente com controle de concorrencia;
- validar subtipo/motivo conforme tipo do documento;
- preservar sinal dos premios;
- gerar auditoria imutavel por campo no backend;
- impedir que stage sozinho aplique efeitos contratuais;
- retornar conflitos e validacoes em formato previsivel.
