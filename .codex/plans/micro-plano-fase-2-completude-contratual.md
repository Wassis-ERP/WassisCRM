# Fase 2 — Completude do eixo contratual

> **Estado reconciliado em 11/09/2026:** os cinco critérios antigos de capa/edição auditada foram atendidos pelo [2.2f](micro-plano-2.2f-revisao-visao-geral-edicao-auditada.md), cujo fechamento e validações constam do próprio plano. A Fase 2 foi completada pelos recortes posteriores 2.8–2.9b. O contrato atual é v3.1; versões citadas abaixo são históricas. Hand-off consolidado na seção 2 do [relatório raiz](../../relatorio-endpoints-campos.md).

Status: 2.4 e 2.5 concluidas; revisao 2.2f pronta para execucao antes de 2.3,
com trabalho restante em 2.3, 2.6 e 2.7.

Data da revisao: 2026-07-11.

## Classificacao

Governada/contratual.

Motivo: esta revisao define a fronteira entre a pagina da apolice e o modulo
Financeiro, redistribui responsabilidades entre as Fases 2 e 3 e envolve
`apolices`, `propostas`, `apolice_itens`, `item_coberturas`, `parcelas`,
`comissoes` e `repasses` do DBML v2.0.

## Objetivo

Concluir a Fase 2 com uma unica pagina de apolice capaz de explicar e consultar
todo o contrato, incluindo seus documentos, riscos e agendas financeiras
originadas pelo documento, sem transformar essa pagina em um cockpit de baixa ou
conciliacao.

A pagina da apolice e a superficie contratual. O Financeiro da Fase 3 e a
superficie operacional que trabalha sobre fatos ja criados pelo contrato.

## Fontes de verdade conferidas

- `.codex/artefatos/instrucoes_projeto_wassis_v2_0.md`;
- `.codex/artefatos/wassis_erp_esqueleto_v2_0.dbml`;
- `.codex/plans/macro_plano.md`;
- micro-planos 2.1, 2.1.1, 2.2 e 2.3;
- `.codex/plans/micro-plano-2.2f-revisao-visao-geral-edicao-auditada.md`;
- `.codex/plans/micro-plano-g8-5-financeiro-configuravel-v2.md`;
- decisao anterior da Fase 2 sobre quatro guias especificas + quatro
  transversais, recuperada e reconciliada nesta revisao;
- referencias locais SegFy/Quiver ja registradas nos micro-planos anteriores.

## Decisao de fronteira

### Leitura aplicada dos contextos de mercado

- SegFy trata `Baixa de Comissao`, extratos, baixa manual/automatizada e baixa
  de multiplos extratos como fluxo financeiro proprio, embora os resultados
  precisem permanecer associados e consultaveis na apolice;
- os materiais de repasse tambem separam grade/regra, agenda e pagamento;
- a aplicacao util ao WassisCRM e preservar a pagina da apolice como fonte de
  contexto e historico, deixando operacoes de caixa/baixa em modulo proprio;
- o benchmark orienta a fronteira, mas o modelo final continua sendo o DBML v2.0
  do WassisCRM.

### Fase 2 — contrato e documento

Pertencem a Fase 2:

- criar e manter a apolice e seus documentos;
- selecionar a emissao original, endosso, cancelamento ou fatura na pagina unica;
- criar/importar itens segurados e coberturas;
- materializar parcelas do segurado a partir da forma de pagamento do documento;
- aplicar a grade de recebimento e materializar a agenda de comissoes;
- aplicar as regras de repasse e materializar a agenda de repasses;
- consultar essas tres agendas dentro da apolice e do documento selecionado;
- explicar qual grade/regra originou cada snapshot;
- preservar o historico quando grade ou regra for alterada futuramente.

### Fase 3 — operacao financeira

Pertencem a Fase 3:

- baixa e estorno de parcelas/comissoes;
- conciliacao de comissoes por extrato;
- tratamento e reprocessamento de divergencias;
- liberacao, pagamento e desfazimento de baixa de repasses;
- operacoes financeiras em lote;
- cobranca e follow-up de parcela vencida;
- visoes e filas transversais a varias apolices.

### Matriz de responsabilidade

| Entidade | Fase 2 — pagina da apolice | Fase 3 — Financeiro |
| --- | --- | --- |
| `parcelas` | gerar, revisar e consultar por documento | baixar, estornar, cobrar e operar vencimentos |
| `comissoes` | aplicar grade, gerar snapshot e consultar agenda | baixar, conciliar extrato e tratar divergencia |
| `repasses` | aplicar regra, gerar snapshot e consultar beneficiarios | liberar, pagar, desfazer baixa e operar em lote |
| grades/regras | selecionar e registrar o molde aplicado | consultar a origem; nao reescrever o contrato |

As tabelas continuam sendo fatos unicos. A separacao e de superficie e operacao,
nao de armazenamento duplicado.

Sinistros e Pos-venda apontam para a apolice, mas nao compoem o cadastro do
contrato: mantêm seus fluxos na Fase 4. A `Visao geral` pode mostrar contagem,
alerta ou link contextual no futuro, sem criar duas implementacoes do mesmo
modulo dentro da pagina da apolice.

## Arquitetura definitiva da pagina da apolice

A pagina permanece unica em `/apolices/:apoliceId`, com
`?documento=:propostaId` para selecionar a perspectiva documental.

Ordem visual:

1. cabecalho contratual;
2. seletor horizontal do documento;
3. guias;
4. conteudo da guia ativa.

O cabecalho revisado em 2.2f mostra somente numero da apolice e dados essenciais
do segurado: nome com link em nova aba, CPF/CNPJ, cidade/UF, e-mail e telefone.
Seguradora, ramo, produtor, status, vigencia e premios ficam na `Visao geral`.

A `Visao geral` abre em modo de leitura e permite edicao inline explicita em
dois blocos independentes: `apolices` e o documento `propostas` selecionado.
Cada campo alterado gera `audit_log`; o historico documental permanece somente
leitura.

### Quatro guias especificas

1. `Visao geral`
   - resumo contratual;
   - documento selecionado;
   - historico documental;
   - cadeia de renovacao e situacoes operacionais quando disponiveis.
2. `Itens segurados`
   - riscos de `apolice_itens`;
   - especializacao por `risk_type`;
   - coberturas de `item_coberturas` dentro de cada item;
   - estado vigente e historico `Antes x Depois` por documento.
3. `Parcelas e comissoes`
   - dois blocos claramente separados na mesma guia;
   - parcelas do segurado e agenda de comissoes nunca fundidas;
   - totais, competencias, vencimentos, percentuais, valores previstos e status;
   - identificacao do documento e da grade aplicada.
4. `Repasses`
   - agenda separada por representar despesa;
   - beneficiario, papel, regra aplicada, base, percentual/valor, datas e status;
   - produtor, gerente e co-producao como linhas distintas quando aplicavel.

### Quatro guias transversais

Preservar sem renomear nem reinventar:

- `Tarefas`;
- `Campos personalizados`;
- `Anexos e logs`;
- `Observacoes`.

O seletor `Apolice`/`Documento atual` aparece somente nessas quatro guias porque
e nelas que `entidade_tipo + entidade_id` altera a fonte dos registros.

PDFs, imagens e arquivos oficiais permanecem em `Anexos e logs`; nao existe uma
guia adicional `Documentos`.

## Regras de informacao

- `apolices` e o contrato e permanece como contexto fixo;
- `propostas` e o documento selecionavel;
- `apolice_itens` e a identidade do risco;
- `item_coberturas` versiona o valor contratado pelo documento responsavel;
- `parcelas`, `comissoes` e `repasses` apontam para `propostas` e sao filtradas
  pelo documento selecionado, com consolidado opcional da apolice;
- comissao nao e parcela do segurado;
- repasse nao e comissao e possui agenda/beneficiario proprios;
- alterar molde nao reescreve snapshot existente;
- nenhuma leitura contratual autoriza baixa financeira implicita;
- zero JSON para dado de negocio e zero `any` novo.
- `stage_id` continua sendo a tramitacao de qualquer documento, mas Etapa so
  aparece na Visao geral durante tramitacao ou recusa;
- `vigencia_inicio` do documento substitui `data_efeito` como inicio dos efeitos
  contratuais; faturas usam competencia;
- premios documentais ficam restritos a `premio_total` e `premio_liquido`, com
  sinal negativo para restituicao/estorno;
- `ENDOSSO` exige subtipo ligado a natureza canonica e `CANCELAMENTO` exige
  motivo proprio;
- `audit_logs` permanece separado de atividades e e gravado por campo alterado.

## Sequencia revisada da Fase 2

### 2.1 e 2.1.1 — concluidas

Painel normalizado, arvore de apolices/documentos e navegacao direta.

### 2.2 — primeiro corte concluido

Pagina unica, documento vigente, seletor horizontal, `Visao geral` e guias
transversais. O shell e definitivo; a tela contratual completa ainda depende de
2.4 e 2.5.

### 2.2f — revisao da Visao geral e edicao auditada

Executar antes de 2.3. Versionar o contrato, simplificar cabecalho/campos,
adicionar catalogos de subtipo/motivo, implementar edicao inline e auditoria e
revalidar as costuras ja concluidas de 2.1/2.4/2.5.

### 2.3 — importacao documental

Importar documento e, quando os dados forem confiaveis, alimentar itens,
parcelas e agenda prevista de comissao. Nao executar baixa/conciliação.

### 2.4 — itens segurados e coberturas

Implementar `Itens segurados`, especializacoes, coberturas e historico por
documento.

### 2.5 — agendas contratuais

Implementar `Parcelas e comissoes` e `Repasses`, aplicar moldes e gerar snapshots
no ciclo da proposta/apolice.

### 2.6 — aposentadoria de Emissao

Consolidar tramitacao em `propostas.stage_id` e remover o modulo legado.

### 2.7 — renovacao e documentos derivados

Criar/registrar renovacao, endosso, cancelamento e fatura usando os mesmos itens
e agendas contratuais.

## Estado das guias durante a execucao

Nao criar guia vazia fingindo funcionalidade. Cada guia especifica entra quando
seu micro-plano executavel estiver pronto, mas a arquitetura alvo permanece
registrada desde ja. Ao final de 2.5, as oito guias devem existir e ser
funcionais.

## Criterios de aceite da Fase 2 completa

- [x] A pagina unica possui quatro guias especificas e quatro transversais, sem
      rolagem horizontal em desktop comum.
- [x] `Visao geral` controla resumo contratual, documento e historico.
- [x] `Itens segurados` apresenta riscos e suas coberturas.
- [x] `Parcelas e comissoes` apresenta agendas separadas no mesmo painel.
- [x] `Repasses` apresenta beneficiarios e agenda propria.
- [x] O documento selecionado filtra itens/historico/agendas quando aplicavel.
- [x] Existe consolidado da apolice sem apagar a origem por proposta.
- [x] Grade e regra aplicadas ficam identificaveis e nao reescrevem snapshots.
- [x] Nenhuma acao de baixa, conciliacao ou pagamento e executada implicitamente
      pela pagina da apolice.
- [x] A Fase 3 recebe fatos ja materializados e nao precisa recriar o contrato.
- [x] As quatro guias transversais permanecem identicas as da Fase 1.
- [x] `database.ts` e `inMemoryDb` refletem todas as tabelas tocadas do DBML v2.0.
- [x] Fluxos principais foram exercitados no navegador, alem de testes estaticos.
- [x] Cabecalho revisado exibe somente numero da apolice e dados essenciais do
      segurado, com link em nova aba.
- [x] Visao geral possui edicao inline separada para apolice e documento.
- [x] Todo campo alterado gera `audit_log` imutavel.
- [x] Campos condicionais incluem subtipo de endosso e motivo de cancelamento.
- [x] Nova versao contratual remove `data_efeito`, `premio_adicional` e
      `premio_restituicao` e preserva premios com sinal.

## Fechamento dos recortes 2.4 e 2.5 — 2026-07-11

- pagina unica concluida com quatro guias contratuais e quatro transversais;
- itens/coberturas, parcelas, comissoes e repasses aderentes ao DBML v2.0 no
  `database.ts` e no `inMemoryDb`, sem `proposta_itens`;
- snapshots de grade/regra deterministas, rastreaveis e sem reescrita retroativa;
- validacao estatica e funcional concluida; a importacao 2.3 permaneceu intacta.

## Fora de escopo desta revisao documental

- alterar frontend nesta rodada;
- implementar backend, SQL, migrations ou API real;
- atualizar agora o Relatorio de Endpoints & Campos;
- baixa, conciliacao, pagamento, cobranca ou operacao financeira em lote;
- contas empresariais, tesouraria, contabilidade ou fluxo de caixa.

## Hand-off futuro

Leituras esperadas:

- obter apolice com documentos, itens e coberturas;
- listar parcelas, comissoes e repasses por `proposta_id` e consolidar por
  `apolice_id` sem perder a origem;
- explicar grade/regra aplicada e snapshots gerados;
- obter historico de inclusao/exclusao de item/cobertura por documento.

Operacoes contratuais esperadas:

- registrar emissao/importacao e materializar agendas;
- recalcular somente antes da confirmacao do snapshot;
- criar ajuste manual auditavel quando nao houver molde compativel;
- nunca usar uma alteracao posterior de grade/regra para reescrever fatos antigos.

Operacoes financeiras ficam no hand-off da Fase 3.
