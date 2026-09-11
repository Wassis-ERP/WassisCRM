# 3.4 — Leitura automatica de PDF/Excel e conciliacao por extrato

> **Estado reconciliado em 11/09/2026:** frontend concluído, conforme a seção “Execucao frontend concluida” ao final. Critérios antigos foram separados do aceite efetivamente evidenciado; backend permanece delimitado. Trechos de planejamento futuro e gates anteriores abaixo descrevem a época da elaboração.

Status: `[x]` frontend concluido em 2026-07-15.

Classificacao: governada/contratual.

## Gate de execucao

O usuario autorizou explicitamente a execucao em 2026-07-15 e delimitou o
recorte ao frontend. Como nao existem fixtures reais de demonstrativos no
repositorio, a entrega usa resposta de extracao mockada, tipada e identificada
na interface. Nenhum layout de seguradora foi inventado ou declarado
homologado.

Parser autoritativo, armazenamento duravel, inspecao segura do arquivo e
qualquer reconhecimento de imagem pertencem ao backend. O frontend valida a
entrada demonstrativa, calcula hash para idempotencia, apresenta a previa e
persiste no mock os fatos previstos pelo contrato v2.4.

## Objetivo

Evoluir a acao orientadora `Importar demonstrativo` da visao `Comissoes` do
cockpit `/financeiro` para um fluxo assistido que:

- receba arquivos PDF, XLS e XLSX fornecidos pelo operador;
- identifique um layout tecnico explicitamente suportado e versionado;
- extraia e normalize cabecalho e itens sem alterar a agenda contratual;
- apresente previa editavel e rastreavel;
- sugira associacoes com as comissoes materializadas pela Fase 2;
- permita confirmar conciliacoes e tratar ocorrencias;
- reutilize, em comando separado, a baixa auditavel entregue no 3.3;
- preserve arquivo, hash, parser, versao, tentativas e resultados sem duplicar
  importacao, conciliacao ou baixa.

O recorte permanece estritamente securitario. `Extrato` significa demonstrativo
de comissao da seguradora; nao significa extrato de conta bancaria.

## Fontes conferidas

- `AGENTS.md`;
- `.codex/artefatos/instrucoes_projeto_wassis_v2_4.md`;
- `.codex/artefatos/wassis_erp_esqueleto_v2_4.dbml`;
- `.codex/plans/macro_plano.md`;
- `.codex/plans/micro-plano-fase-3-financeiro-securitario.md`;
- `.codex/plans/micro-plano-3.2-contrato-extratos-conciliacao.md`;
- `.codex/plans/micro-plano-3.3-comissoes-baixa-manual.md`;
- `relatorio-endpoints-campos.md`, somente como snapshot parcial;
- `nexus-crm/src/types/database.ts`;
- cockpit `/financeiro`, `CommissionsView`, modais de baixa/historico e hooks;
- `comissoesDomain`, `conciliacaoContract`, testes, query keys e massa do
  `inMemoryDb`;
- referencias locais do SegFy sobre importacao, arquivo nao reconhecido,
  status, previa e baixa;
- referencias locais do Quiver sobre PDF por seguradora, layouts XLS/XLSX,
  ocorrencias, arquivos processados e reprocessamento.

## Estado inicial do Git e preservacao da arvore

Antes desta rodada, a branch `Dev` estava um commit a frente de `origin/Dev` e
ja havia alteracoes locais em:

- `.agents/skills/wassis-git-pr-flow/SKILL.md`;
- `AGENTS.md`.

Essas alteracoes sao preexistentes, foram preservadas e nao pertencem ao 3.4.
A unica correcao de codigo autorizada nesta sessao foi retirar o indicador
visual `3.3` ao lado de `Comissoes` em `FinanceiroPage.tsx`.

## Diagnostico depois do 3.3

### Contrato v2.4

O contrato vigente ja separa e representa:

- agenda materializada em `comissoes`;
- cabecalho em `comissao_extratos`;
- linhas informadas em `comissao_extrato_itens`;
- associacao N:N em `comissao_conciliacoes`;
- divergencias e resolucoes em
  `comissao_conciliacao_ocorrencias`;
- eventos imutaveis de baixa/estorno em `comissao_baixas`;
- consumo N:N de conciliacoes em `comissao_baixa_conciliacoes`;
- dependencia de liberacao com `repasses`, sem pagamento neste recorte.

Os campos `parser_identificador`, `parser_versao`,
`tentativa_processamento`, status, erros, referencia e hash do arquivo foram
reservados no 3.2 para o 3.4. D19 determina que conciliar nunca baixa; D20
determina que baixa e estorno sao eventos imutaveis.

Conclusao: o v2.4 e suficiente como contrato-base do primeiro recorte 3.4.
Nao se planeja alterar DBML, instrucoes ou `database.ts` antes de aparecer uma
lacuna comprovada por arquivo real. As lacunas de detalhe listadas neste plano
devem ser decididas antes da implementacao; se exigirem persistencia nova, o
contrato devera subir de forma pareada em rodada propria.

### Implementacao atual

- `Comissoes` ja e uma visao funcional dentro do cockpit unico.
- `Importar demonstrativo` ainda apenas informa que a leitura pertence ao 3.4.
- `Registrar baixa` e o assistente manual ja estao funcionais.
- `useFinanceiroComissoes` consulta comissoes e executa baixa/estorno.
- `comissoesDomain` compoe previsto, informado, conciliado, baixado e saldo;
  consome conciliacoes confirmadas e impede ocorrencia/sugestao pendente.
- `conciliacaoContract` ja cria chaves de extrato/item, classifica casos
  basicos e detecta duplicidade do par item+comissao.
- o mock possui extrato, itens, conciliacao confirmada e ocorrencia aberta,
  alem dos eventos do 3.3.
- nao existe hook de importacao, registro de parsers, fixture binaria, extrator
  PDF/Excel ou dependencia de leitura de PDF/XLS/XLSX no workspace.

### Decisao de legado

- evoluir a visao `Comissoes` e o dominio atual, abrindo o fluxo prolongado em
  uma rota dedicada dentro do modulo Financeiro;
- extrair o fluxo automatico para componentes e dominio proprios, sem duplicar
  a baixa manual;
- generalizar somente a fronteira comum necessaria para que origem `ARQUIVO`
  e origem `MANUAL` terminem nas mesmas conciliacoes e baixas;
- manter adapter/kanban legado de `financeiro_cobrancas` isolado para o 3.6;
- nao reintroduzir `extrato_numero` ou `seguradora_lote` em `comissoes`.

## Formatos iniciais

O compromisso funcional inicial e:

- PDF com camada de texto extraivel;
- XLS;
- XLSX.

Regras comuns:

- aceitar um ou mais arquivos selecionados, mas processar e confirmar cada
  arquivo como unidade idempotente independente;
- validar extensao, assinatura/MIME real, tamanho e conteudo antes do parser;
- nao executar formulas, macros, links externos ou conteudo incorporado;
- rejeitar formatos fora da lista, inclusive XLSM, CSV, TXT e XML neste corte;
- nenhum arquivo e considerado suportado apenas pela extensao.

## Evidencias locais por seguradora e layout

### PDF — candidatos documentados

O Quiver documenta leitura PDF e regras de identificacao para:

| Seguradora | Evidencia local de regra | Classificacao para o 3.4 |
|---|---|---|
| Porto Seguro | parcela 1 opcional, descarte dos tres ultimos digitos, zeros a esquerda, formacao de apolice e excecoes por ramo | candidato prioritario; sem fixture homologada |
| SulAmerica | agrupamento de ramos, soma por ramos, sucursal+apolice e proposta como documento em produtos especificos | candidato prioritario; sem fixture homologada |
| HDI | parcela 1, descarte de zeros/parcelas zeradas e varias composicoes do numero da apolice | candidato; sem fixture homologada |
| Bradesco | parcela 1, soma por ramos, descarte de zeros/parcelas zeradas e composicao apolice+sucursal | candidato; sem fixture homologada |
| Mitsui | descarte de zeros a esquerda em apolice/endosso | candidato; sem fixture homologada |
| Mapfre | parcela 1 e descarte dos tres ultimos digitos da apolice | candidato; sem fixture homologada |
| Liberty/Aliro | parcela 1 e descarte dos tres ultimos digitos da apolice | candidato; sem fixture homologada |

O SegFy documenta o fluxo de importacao PDF/Excel e tutoriais de obtencao de
PDF para Alfa, Allianz, Azul, Bradesco, HDI, Liberty/Aliro, Mapfre, MetLife,
Mitsui, Porto, Sancor, Sompo, Suhai, SulAmerica, Tokio Marine e Zurich. Essa
lista prova disponibilidade de extratos, nao prova que cada layout esta
programado ou que a versao atual e legivel. A tabela externa de automacao
citada pelo SegFy nao esta preservada nas amostras locais.

### XLS/XLSX — evidencia de estrutura configuravel

O Quiver documenta um layout tabular configuravel com:

- linha inicial de leitura;
- mapeamento de colunas por posicao;
- numero do recibo, cliente, seguradora e corretora;
- valores, impostos/retencoes e totalizacao por recibo ou parcela;
- uma seguradora por arquivo e varios recibos da mesma seguradora;
- reprocessamento apos pendencias.

Essa evidencia e suficiente para planejar um adapter tabular versionado, mas
nao existe no repositorio uma planilha real que fixe colunas e cabecalhos de uma
seguradora especifica.

### Gate de homologacao dos layouts

Nenhum layout pode ser declarado `suportado` na interface ou implementado como
parser definitivo com o material atual, porque nao ha arquivo binario real,
anonimizado e acompanhado do resultado esperado.

Antes da execucao, a revisao deve escolher:

1. ao menos um layout PDF, com Porto e SulAmerica como candidatos prioritarios
   pela maior evidencia documental;
2. ao menos um layout tabular que seja valido tanto em XLS quanto em XLSX, ou
   duas fixtures se as estruturas forem diferentes;
3. uma fixture anonima por combinacao seguradora+formato+layout+versao;
4. os campos esperados e casos de borda de cada fixture.

## Estrategia de identificacao de layout e versao

Criar futuramente um registro tecnico em codigo, nao uma tabela de negocio,
contendo para cada parser:

- `parserId` estavel, por exemplo `porto-comissao-pdf`;
- `versao`, iniciando em SemVer do parser;
- seguradora/codigos aceitos;
- formatos aceitos;
- assinaturas fortes do arquivo: textos de cabecalho, nomes de colunas,
  estrutura de pagina/planilha e combinacoes obrigatorias;
- funcao de extracao;
- funcao de normalizacao;
- regras especificas de identificadores;
- fixtures e testes de regressao vinculados.

Resolucao planejada:

1. validar o container do arquivo;
2. obter sinais brutos sem alterar dados;
3. pontuar parsers compativeis;
4. aceitar automaticamente apenas uma assinatura inequivoca;
5. se nenhum parser atingir os sinais obrigatorios, usar
   `LAYOUT_NAO_SUPORTADO`;
6. se dois ou mais parsers permanecerem plausiveis, pedir ao operador a
   seguradora/layout e revalidar; nunca escolher silenciosamente;
7. gravar `parser_identificador` e `parser_versao` no extrato;
8. uma mudanca de estrutura cria nova versao do parser e novo teste dourado;
   nao altera o significado de importacoes historicas.

Nome do arquivo, extensao ou seguradora selecionada isoladamente nunca bastam
para identificar o layout.

## Separacao obrigatoria das etapas

| Etapa | Resultado | Pode baixar? |
|---|---|---|
| Upload | recebe arquivo, valida formato e calcula/reconhece hash | nao |
| Armazenamento | preserva original e referencia segura | nao |
| Extracao | le celulas/texto bruto conforme parser identificado | nao |
| Normalizacao | converte valores para o contrato sem inventar dados | nao |
| Previa | mostra original, normalizado e correcoes do operador | nao |
| Associacao | localiza candidatas e cria sugestoes tipadas | nao |
| Conciliacao | confirma alocacoes e classifica diferencas | nao |
| Ocorrencia | registra bloqueios/divergencias e sua resolucao | nao |
| Baixa | comando separado do 3.3 cria evento imutavel | sim, somente apos acao explicita |

O simples upload, processamento, preview, associacao ou conciliacao nao pode
alterar `comissoes.valor_recebido`, `recebida_em`, `status`, nem liberar repasse.

## Campos do cabecalho

### Contexto e autoria

- `tenant_id` e `filial_id` derivados da sessao/escopo autorizado;
- `seguradora_id` detectada/sugerida e confirmada pelo operador;
- `recebido_por_id`, `processado_por_id` e timestamps de servidor no backend;
- `origem_tipo = ARQUIVO`;
- `origem_formato = PDF | XLS | XLSX`.

### Extraidos ou confirmados

- identificacao externa/numero do demonstrativo;
- competencia e periodo inicial/final;
- data de emissao;
- data de recebimento/credito quando informada;
- quantidade de itens;
- valor bruto total;
- valor liquido total;
- descontos totais;
- moeda, inicialmente BRL quando o layout comprovar.

### Metadados tecnicos

- nome original;
- MIME detectado;
- referencia de armazenamento;
- SHA-256;
- chave idempotente;
- parser e versao;
- tentativa e timestamps do processamento;
- status de processamento/conciliacao;
- codigo e mensagem segura de erro.

## Campos dos itens

Extrair quando o layout fornecer, sem tornar todos obrigatorios:

- identificacao e sequencia externas;
- produtor/beneficiario informado;
- proposta, apolice, endosso e documento informados;
- parcela/evento informado;
- segurado;
- ramo;
- competencia;
- data de credito e data de recebimento informada;
- bruto, liquido e descontos;
- percentual;
- tipo de comissao;
- lote e referencia da seguradora;
- descricao/linha original.

Campos ausentes permanecem `null`; o parser nao deve completar por intuicao.

## Regras de normalizacao

### Valores

- reconhecer separadores decimal e de milhar conforme o layout;
- arredondar moeda apenas na fronteira definida, preservando o valor lido para
  comparacao;
- manter `valor_bruto`, `valor_liquido` e `valor_descontos` separados;
- validar `bruto - descontos = liquido` dentro de R$ 0,01, gerando ocorrencia
  quando a semantica do layout disser que a igualdade deveria existir;
- preservar sinal negativo de `RESTITUICAO`; nao aplicar `Math.abs` como regra
  de persistencia;
- nao converter campos vazios em zero.

### Datas e competencias

- interpretar datas somente pelo formato declarado do parser;
- converter datas de texto e seriais de Excel para `YYYY-MM-DD`, sem mudanca de
  dia por fuso horario;
- normalizar competencia mensal para o primeiro dia do mes no campo `date`,
  mantendo o rotulo mes/ano na apresentacao;
- nao inferir ano ausente sem regra explicita do layout e referencia inequivoca;
- data invalida ou ambigua permanece pendente e bloqueia confirmacao do campo.

### Identificadores

- proposta, apolice, endosso, documento e parcela permanecem texto informado;
- retirar pontuacao, zeros a esquerda, sufixos ou compor sucursal/ramo/apolice
  somente quando a versao do parser declarar essa regra;
- preservar o valor original em `descricao_original`/previa;
- parcela nao vira `1` por padrao; isso e regra de layout;
- CNPJ/codigo SUSEP podem reforcar a seguradora, mas nao substituem a
  confirmacao de contexto.

### Segurados, produtores e ramos

- preservar grafia original para exibicao;
- criar chave de busca auxiliar com espacos compactados, caixa e acentos
  normalizados, sem sobrescrever o texto recebido;
- nome isolado nunca confirma associacao;
- produtor e ramo informados reforcam a candidatura, mas nao criam cadastro e
  nao substituem FKs antes da resolucao.

## Previa editavel antes da confirmacao

A previa deve existir antes de confirmar associacoes ou executar baixa e deve:

- separar cabecalho, itens, totais e diagnostico do parser;
- mostrar lado a lado valor original e normalizado quando houver mudanca;
- permitir corrigir somente campos explicitamente editaveis;
- marcar visualmente toda correcao manual;
- recalcular totais e matching sem persistir baixa;
- permitir descartar item apenas com motivo;
- impedir confirmacao enquanto faltarem contexto, parser ou campos obrigatorios;
- manter a opcao de voltar ao arquivo sem perder o diagnostico da tentativa.

No v2.4, a linha original pode ser preservada em `descricao_original`, o arquivo
original permanece referenciado e a resolucao `DADO_CORRIGIDO` registra a
correcao. Antes da implementacao, o usuario deve confirmar se essa trilha basta.
Se for exigido consultar cada valor bruto antes/depois da edicao de qualquer
campo, sera necessario avaliar uma extensao contratual tipada, sem JSON.

## Associacao e conciliacao

Toda busca ocorre dentro do mesmo tenant, corretora e seguradora. Ordem de
sinais:

1. identificador externo confiavel, se existir;
2. proposta/apolice/documento + parcela/evento + tipo de comissao;
3. competencia e data prevista;
4. segurado, ramo e produtor como reforco;
5. valor e percentual como validacao, nunca como identidade unica.

### Classificacoes

- **Exata:** uma candidata com identificadores fortes e valores/competencia
  dentro das tolerancias. O parser pode propor `EXATA`, mas a associacao
  automatica fica `SUGERIDA` ate confirmacao do operador na previa.
- **Sugerida:** uma candidata plausivel com sinais incompletos; fica
  `SUGERIDA`, sem baixa.
- **Ambigua:** duas ou mais candidatas plausiveis; criar ocorrencia
  `MULTIPLAS_COMISSOES`, mostrar candidatas e impedir confirmacao automatica.
- **Parcial:** o valor e explicitamente alocado abaixo do item ou da comissao;
  exige alocacao visivel, saldo remanescente e confirmacao.
- **Manual:** operador escolhe a comissao; persistir `MANUAL` somente apos
  confirmacao, mantendo divergencias e justificativas.
- **Nao encontrada:** nenhuma candidata; criar ocorrencia especifica e nunca
  criar comissao.

Ao confirmar uma candidata, rejeitar/cancelar as sugestoes concorrentes com
autoria. `PRONTO_PARA_BAIXAR` significa apenas conciliacao confirmada, valor
disponivel e ausencia de ocorrencia bloqueante.

## Duplicidade e reprocessamento idempotente

### Arquivo

- hash igual na mesma corretora+seguradora retorna o extrato existente;
- renomear o mesmo binario nao cria nova importacao;
- identificacao externa repetida com hash diferente gera conflito para
  conferencia, sem sobrescrever a anterior;
- o operador pode abrir o historico ou reprocessar o mesmo extrato;
- cada reprocessamento incrementa `tentativa_processamento` e conserva
  parser/versao usados na tentativa historica pela auditoria do backend.

### Item e associacao

- usar chaves deterministicas por extrato + identidade/linha;
- reutilizar item existente; nunca duplicar por retry, duplo clique ou reload;
- par item+comissao permanece unico;
- reprocessamento nao apaga ocorrencias resolvidas;
- uma nova divergencia cria novo evento/ocorrencia ou reabre mediante regra
  explicita, sem reescrever a resolucao historica;
- item/associacao ja consumido por baixa nao pode ser realocado acima do saldo.

### Baixa

- importar ou reprocessar nunca cria baixa;
- `Baixar elegiveis` gera nova chave idempotente de comando e reutiliza as
  validacoes do 3.3;
- a mesma conciliacao pode ser consumida apenas ate seu valor disponivel;
- retry devolve o mesmo resultado;
- arquivos selecionados em conjunto continuam unidades independentes; falha de
  um nao mascara nem reverte silenciosamente outro.

## Arquivos invalidos e layouts nao suportados

| Caso | Codigo v2.4 | Comportamento |
|---|---|---|
| protegido por senha | `ARQUIVO_PROTEGIDO` | nao tentar contornar; orientar nova copia ou fluxo manual |
| container corrompido | `ARQUIVO_CORROMPIDO` | preservar diagnostico seguro; nao criar itens |
| vazio/sem linhas uteis | `ERRO_DE_LEITURA` | informar arquivo sem conteudo util; nao criar itens |
| PDF escaneado sem texto | `ERRO_DE_LEITURA` | exibir o erro devolvido pelo backend e oferecer fluxo manual; o front nao executa OCR |
| assinatura desconhecida | `LAYOUT_NAO_SUPORTADO` | preservar arquivo e oferecer layout suportado/baixa manual |
| extensao/MIME fora do corte | `FORMATO_NAO_SUPORTADO` | rejeitar antes do parser |

`ARQUIVO_VAZIO` e `PDF_SEM_CAMADA_TEXTO` nao existem no v2.4. No primeiro
recorte podem ser motivos seguros dentro de `ERRO_DE_LEITURA`. A revisao deve
decidir se a operacao precisa de codigos persistidos distintos; se sim, sera
necessario novo par contratual antes da implementacao.

Quando a leitura falhar, a continuidade manual deve reaproveitar o mesmo
`comissao_extratos` de origem `ARQUIVO` e sua referencia, permitindo ao operador
digitar itens. Nao criar um segundo extrato `MANUAL` para o mesmo arquivo.

## Fronteira de OCR no frontend

OCR nao entra em nenhuma etapa, componente, hook, adapter, parser, mock ou teste
funcional do frontend.

Qualquer necessidade de OCR pertence exclusivamente ao backend. Nesse caso, o
front apenas:

- envia ou referencia o arquivo conforme o contrato da integracao futura;
- recebe dados extraidos ou um erro seguro de leitura;
- apresenta o erro ao operador;
- oferece continuidade pela digitacao/baixa manual;
- nunca tenta reconhecer imagem, estimar texto ou reconstruir campos localmente.

Para PDF sem camada de texto, o estado do front e de falha de leitura com proxima
acao clara. Nao existe decisao futura de OCR dentro do recorte frontend 3.4.

## Item ja associado, conciliado ou baixado

- associacao apenas sugerida: reusar a sugestao e permitir confirmar/rejeitar;
- associacao confirmada e nao consumida: preservar; reprocessar apenas compara;
- item parcialmente consumido: mostrar valor original, consumido e disponivel;
  permitir apenas o residual elegivel;
- item totalmente consumido: marcar sem saldo e bloquear nova baixa;
- comissao ja conciliada por outro item: criar
  `COMISSAO_JA_CONCILIADA` quando houver risco de sobrealocacao;
- comissao total ou parcialmente recebida: calcular saldo pelos eventos do 3.3
  e criar `COMISSAO_JA_RECEBIDA` quando o novo item tentar consumir valor sem
  disponibilidade;
- baixa ou estorno existente nunca e apagado, atualizado ou substituido pelo
  reprocessamento;
- repasse `PAGO` continua afetando apenas estorno, conforme D20; o 3.4 nao paga
  nem desfaz repasse.

## Ocorrencias e resolucao

Gerar ocorrencias tipadas para ausencia, ambiguidade, duplicidade e diferencas
de valor, percentual, competencia, parcela, proposta, apolice e segurado, alem
de comissao ja conciliada/recebida.

Regras:

- ocorrencia aberta ou em analise bloqueia baixa do item;
- resolver exige autoria, timestamp, tipo e observacao quando aplicavel;
- `VINCULO_CORRIGIDO` confirma a candidata escolhida e rejeita concorrentes;
- `DADO_CORRIGIDO` registra alteracao feita na previa;
- `DIVERGENCIA_ACEITA` exige justificativa e nao muda o previsto;
- `ITEM_DESCARTADO` deixa o item `IGNORADO` sem apagar a linha;
- `REPROCESSADO` aponta que nova tentativa foi executada, sem apagar a
  ocorrencia anterior;
- historico de extrato, item, associacao, ocorrencia e baixa permanece
  consultavel separadamente.

## Fronteira entre conciliacao e baixa

O 3.4 entrega leitura, previa, associacao, confirmacao da conciliacao,
ocorrencias e reprocessamento. Ele nao cria nova semantica de baixa.

Fluxo seguro:

1. `Confirmar importacao` persiste/atualiza extrato e itens idempotentes.
2. `Confirmar conciliacoes` torna associacoes elegiveis `CONFIRMADA`.
3. a tela mostra o conjunto `PRONTO_PARA_BAIXAR`.
4. somente outra acao explicita, `Baixar elegiveis`, chama o comando comum do
   3.3 com `origem_tipo = ARQUIVO`.
5. o comando cria `comissao_baixas` e pontes, atualiza a projecao e libera
   repasse conforme D20.

Nao executar baixa automatica ao terminar leitura, ao abrir a previa, ao
confirmar um vinculo ou ao reprocessar.

## Fluxo de interface planejado

### Quantidade de telas

O fluxo usa **quatro etapas dentro de uma pagina dedicada**, aberta a partir de
`Importar demonstrativo` em `Comissoes`, na rota
`/financeiro/importar-demonstrativo`. A pagina continua pertencendo ao modulo
Financeiro e nao cria hub ou modulo paralelo.

A escolha por pagina e obrigatoria porque upload, conferencia e ajustes manuais
podem demandar tempo e acumular estado relevante. O fluxo nao pode ser fechado
acidentalmente por clique fora ou `Esc`, como ocorreria em um modal.

O processamento nao vira uma quinta tela: carregamento, validacao e erro sao
estados da etapa de upload. Detalhes de um item podem abrir painel lateral ou
linha expansivel dentro da etapa de conferencia, sem aumentar a quantidade de
etapas principais.

### Tela 1 — Upload

- selecionar um ou mais arquivos;
- escolher/confirmar corretora e, quando necessario, seguradora;
- consultar formatos/layouts suportados;
- validar extensao, MIME, tamanho, duplicidade e resposta de processamento;
- mostrar progresso e resultado por arquivo;
- bloquear avanco de arquivo invalido e oferecer continuidade manual.

### Tela 2 — Conferencia e ajustes manuais

- revisar cabecalho, itens e totais extraidos;
- comparar original e normalizado;
- corrigir campos permitidos com marcacao visivel;
- revisar associacoes exatas, sugeridas, ambiguas, parciais e nao encontradas;
- escolher vinculo manual, ajustar alocacao ou ignorar com motivo;
- exibir ocorrencias e bloqueios na propria linha/item;
- recalcular a previa sem executar baixa.

Esta e a tela operacional principal do assistente. Cabecalho, tabela e painel de
detalhe devem evitar uma sequencia de pequenas telas por campo.

### Tela 3 — Confirmacao

- resumir arquivos, totais, conciliados, pendentes, ignorados e bloqueados;
- destacar correcoes e divergencias aceitas;
- informar claramente que confirmar registra importacao e conciliacoes, nao
  baixa comissoes;
- exigir justificativas ainda pendentes;
- oferecer `Voltar e ajustar` e uma unica acao primaria
  `Confirmar conciliacao`.

### Tela 4 — Conclusao

- informar sucesso/falha por arquivo e contagens por resultado;
- manter acesso a ocorrencias e ao historico da importacao;
- oferecer `Fechar`;
- quando houver itens prontos, oferecer `Baixar elegiveis` como proxima acao
  explicita, abrindo o fluxo de baixa ja entregue no 3.3.

`Baixar elegiveis` nao constitui uma quinta tela do assistente de importacao:
ele inicia outro comando/fluxo, com semantica e confirmacao do 3.3.

## Arquivos provavelmente envolvidos na futura implementacao

### Interface

- `nexus-crm/src/components/financeiro/CommissionsView.tsx`;
- novo `CommissionImportWizard.tsx`, composto na pagina dedicada;
- nova `ImportacaoDemonstrativoComissoesPage.tsx` e rota
  `/financeiro/importar-demonstrativo`;
- novos componentes de upload, previa, associacao, ocorrencias e formatos
  suportados em `nexus-crm/src/components/financeiro/`;
- `CommissionReceiptModal.tsx`, apenas para extrair/reusar a confirmacao comum
  quando isso reduzir duplicacao sem quebrar a baixa manual;
- `FinanceiroPage.tsx` preserva o cockpit; a pagina dedicada retorna para a
  visao `Comissoes` sem criar nova aba.

### Hooks, dominio e parsers

- novo `nexus-crm/src/hooks/useFinanceiroExtratos.ts`;
- `nexus-crm/src/hooks/useFinanceiroComissoes.ts` para invalidacao coordenada;
- novo `nexus-crm/src/modules/financeiro/extratoImportDomain.ts` e testes;
- `nexus-crm/src/modules/financeiro/conciliacaoContract.ts` e testes;
- `nexus-crm/src/modules/financeiro/comissoesDomain.ts` e testes, somente para
  expor comando comum de baixa com origem `ARQUIVO`;
- nova pasta `nexus-crm/src/modules/financeiro/parsers/` com registro, tipos,
  detector e adapters por layout/versao;
- fixtures anonimizadas em pasta de testes do modulo, nunca dados reais sem
  aprovacao.

### Tipos, mock e cache

- tipos transitorios de extracao/previa em arquivos do modulo, nao em
  `database.ts` se o v2.4 continuar suficiente;
- `nexus-crm/src/lib/inMemoryDb.ts` para massa e persistencia demonstrativa;
- `nexus-crm/src/lib/queryClient.ts` para chaves de extratos/processamento;
- `nexus-crm/src/types/database.ts` somente se comparacao mecanica revelar
  drift com o v2.4 ou se contrato novo for previamente aprovado.

### Dependencias

Nao ha biblioteca atual para PDF ou Excel. A futura execucao deve avaliar uma
biblioteca de PDF com camada de texto e uma de XLS/XLSX quanto a:

- licenca;
- manutencao e seguranca;
- suporte no navegador/Vite;
- tamanho de bundle e carregamento lazy;
- leitura sem executar formulas/macros;
- suporte real as fixtures homologadas.

Qualquer alteracao de `package.json`/lockfile e configuracao depende de
autorizacao no ciclo de implementacao; nenhuma e feita neste planejamento.

## Impactos futuros por camada

- **componentes:** wizard de importacao, previa densa, resolucao e resumo;
- **hooks:** upload/processamento simulado, consultas, reprocessamento,
  confirmacao e invalidacao;
- **adapters/parsers:** deteccao por assinatura, extracao e normalizacao por
  versao;
- **regras:** matching, alocacao, elegibilidade, duplicidade e erros;
- **mock:** historico de arquivos, tentativas, itens, sugestoes e ocorrencias;
- **tipos:** modelos transitorios estritos; zero `any`;
- **testes:** fixtures, testes dourados, integracao do mock e navegador;
- **contrato:** nenhuma mudanca prevista ate uma lacuna real ser aprovada.

## Responsabilidades futuras do backend

- RLS/RBAC por tenant, corretora e perfil;
- upload seguro, limite de tamanho/quantidade e MIME por assinatura;
- antivirus, isolamento do parser, timeout e limite de memoria/paginas/linhas;
- armazenamento duravel, criptografia, retencao, exclusao autorizada e URL
  segura do original;
- SHA-256 calculado no servidor e idempotencia transacional;
- fila/processamento duravel com status e retry controlado;
- registro imutavel de parser/versao e tentativas;
- extracao/normalizacao autoritativa ou validacao dos resultados do front;
- garantir tenant/filial/seguradora em toda a cadeia;
- matching paginado/consistente e locks contra sobrealocacao;
- persistir sugestoes, confirmacoes, rejeicoes, ocorrencias e resolucoes com
  autoria do servidor;
- confirmar baixa em transacao, consumindo apenas conciliacoes disponiveis;
- retornar resultado por arquivo/item sem baixa parcial silenciosa;
- auditoria tecnica em `audit_logs` sem reconstruir o dominio por parse de log;
- nunca criar comissao ausente, alterar previsto ou executar conciliacao
  bancaria.
- qualquer OCR e responsabilidade exclusiva do backend; o frontend recebe
  dados extraidos ou erro seguro e nao implementa reconhecimento de imagem.

## Aceite vigente do frontend — 11/09/2026

- [x] Página dedicada de upload, conferência, confirmação e conclusão entregue no mock.
- [x] Prévia editável, associações/ocorrências, preservação de originais e baixa por ação separada entregues no recorte demonstrativo.
- [x] Proteções contra duplicidade e reutilização do domínio de baixa 3.3 cobertas pelos testes registrados.
- [x] Histórico/conferência complementados pelo [3.4R-A](micro-plano-3.4R-A-historico-conferencia-extratos.md); fluxo principal e layout têm evidências de navegador.
- [x] Hand-off consolidado na seção 3 do [relatório raiz](../../relatorio-endpoints-campos.md).

**Fronteira ainda pendente de backend:** parser/OCR real, fixtures por seguradora/layout/versão, storage/antivírus/retencão e processamento durável. Aceitação demonstrativa de PDF/XLS/XLSX não homologa extração real. Mesa de exceções/retomada 3.4R-B permanece condicional no macro.

Os critérios originais abaixo são referência histórica, substituída pelo aceite do mock acima e pelas dependências explícitas de backend. Sua conversão para lista de referência não declara homologação de parser nem certificação completa de acessibilidade.

## Critérios funcionais originais — referência histórica

- aceitar PDF com texto, XLS e XLSX somente nos layouts homologados;
- exibir formatos/layouts suportados antes do processamento;
- tratar corretamente arquivo vazio, protegido, corrompido, escaneado e
      desconhecido, conforme o resultado seguro recebido;
- identificar e gravar parser/versao;
- extrair cabecalho e itens conforme fixture aprovada;
- normalizar valores, datas, competencias e identificadores sem inventar;
- oferecer previa editavel e marcar correcoes;
- mostrar totais do arquivo e divergencias;
- classificar exata, sugerida, ambigua, parcial, manual e nao encontrada;
- confirmar associacoes sem executar baixa;
- criar/resolver ocorrencias sem apagar historico;
- impedir duplicidade por hash, item, associacao e comando;
- reprocessar o mesmo extrato sem duplicar baixa;
- preservar itens ja associados, conciliados ou consumidos;
- permitir baixa somente por acao separada e explicita;
- reutilizar integralmente os eventos/validacoes do 3.3;
- nao criar nem alterar agenda de comissoes da Fase 2;
- nao pagar repasse nem abrir cobranca;
- nenhuma conciliacao bancaria introduzida.

## Critérios visuais e de acessibilidade — referência histórica

- manter o modulo Financeiro e o padrao visual da visao `Comissoes`, com o
      processo prolongado em pagina dedicada;
- upload com rotulo, ajuda de formatos e erro associado ao campo;
- progresso e resultado anunciados para tecnologia assistiva;
- foco inicial e ordem de tabulacao corretos na pagina;
- nenhuma etapa fecha por clique fora ou `Esc`; saidas sao explicitas;
- estados nao dependem apenas de cor; usar texto e icone;
- tabela de previa permite navegacao por teclado e cabecalhos semanticos;
- correcoes mostram original e editado de forma compreensivel;
- bloqueios explicam a causa e a proxima acao;
- vazio, carregando, processando, erro, somente leitura e sem permissao;
- nenhuma confirmacao usa dialogo nativo;
- zoom 100% e viewport desktop comum sem corte/sobreposicao;
- formatos numericos e datas em pt-BR, preservando o valor tecnico.

## Estrategia de testes futura

### Fixtures

- um arquivo binario anonimizado por layout/versao suportado;
- variante XLS e XLSX quando a biblioteca produzir resultados diferentes;
- resultado esperado em fixture TypeScript tipada;
- arquivos sinteticos vazio, corrompido, protegido e PDF sem texto;
- nenhum dado pessoal/segredo real versionado sem aprovacao.

### Unitarios

- identificacao de parser e ambiguidade entre layouts;
- extracao dourada de cabecalho/itens por fixture;
- separadores, sinais, datas, serial Excel e competencia;
- regras especificas de apolice/endosso/parcela por parser;
- exata, sugerida, ambigua, parcial, manual e nao encontrada;
- tolerancias de R$ 0,01 e 0,01 ponto percentual;
- chaves de arquivo/item/associacao e duplicidade;
- item ja conciliado, parcialmente consumido e baixado;
- apresentacao dos estados protegido, corrompido, vazio, escaneado e
  desconhecido, sem OCR no frontend;
- reprocessamento com versao igual e diferente;
- garantia de que leitura/conciliacao nao criam `comissao_baixas`.

### Integracao no mock

- arquivo -> cabecalho -> itens -> previa -> sugestoes;
- correcao da previa com ocorrencia/resolucao auditavel;
- confirmacao exata e manual sem baixa;
- reprocessamento preservando IDs e historico;
- hash repetido devolvendo a importacao existente;
- baixa separada consumindo conciliacoes confirmadas pelo comando do 3.3;
- retry sem duplicar evento;
- ocorrencia bloqueando lote;
- falha de um arquivo nao mascarando resultado dos demais;
- agenda/previsto permanecendo intactos;
- repasse apenas `PREVISTO <-> LIBERADO` pela baixa/estorno do 3.3.

### Navegador

- abrir `Comissoes` e o assistente de importacao;
- consultar formatos suportados;
- importar cada formato homologado;
- revisar/editar previa;
- tratar exata, sugerida, ambigua, parcial e nao encontrada;
- confirmar conciliacao e provar que nada foi baixado;
- baixar elegiveis por acao separada e consultar historico;
- repetir upload/reprocessamento sem duplicacao;
- testar arquivo invalido e continuidade manual;
- validar somente leitura, teclado, foco, mensagens e viewport desktop 100%.

### Gates tecnicos da execucao

- TypeScript;
- Vitest focado durante desenvolvimento e suite completa no fechamento;
- ESLint focado nos arquivos alterados;
- build de producao;
- validacao no navegador depois da ultima mudanca funcional/visual;
- diff por novo `any`, `setState(` problematico, dialogos nativos, JSON de
  negocio e arquivos de configuracao;
- comparacao do modulo financeiro de `database.ts` com o DBML vigente.

## Riscos, lacunas e decisoes para revisao

1. **Fixtures ausentes:** nenhum parser pode ser homologado sem amostras reais
   anonimizadas e resultado esperado.
2. **Layout inicial:** confirmar Porto/SulAmerica ou escolher seguradoras mais
   simples depois de receber os arquivos.
3. **XLS/XLSX:** decidir se o primeiro adapter sera um layout canonico W.Assis
   ou layout real de seguradora.
4. **Bibliotecas:** aprovar dependencias somente depois de avaliar licenca,
   seguranca e bundle.
5. **Erros:** decidir se vazio e PDF sem texto precisam de enums proprios alem
   de `ERRO_DE_LEITURA`.
6. **Previa editavel:** confirmar se arquivo original + `descricao_original` +
   ocorrencia `DADO_CORRIGIDO` satisfazem auditoria ou se o contrato deve guardar
   valores originais/corrigidos separadamente.
7. **Multiplos arquivos:** manter processamento independente por arquivo; nao
   prometer transacao atomica entre demonstrativos.
8. **Politica de armazenamento:** backend deve definir tamanho, retencao,
   exclusao, antivirus e acesso ao original.
9. **Matching:** limiares de confianca dependem das fixtures; nao fixar numeros
   arbitrarios antes delas.
10. **OCR:** nao e decisao nem implementacao do frontend. Qualquer necessidade
    pertence ao backend; o front apenas trata sucesso ou erro seguro.
11. **XLS legado:** suporte depende da biblioteca escolhida e deve ser provado
    por fixture, nao apenas pela extensao.
12. **Dados sensiveis:** fixtures precisam ser anonimizadas sem destruir as
    assinaturas do layout.

## Fronteira precisa entre 3.4, 3.5 e 3.6

### 3.4 — entra

- arquivo fornecido pelo operador;
- PDF/XLS/XLSX homologados;
- armazenamento/referencia do original;
- parser/layout/versao;
- extracao, normalizacao e previa;
- associacao, conciliacao e ocorrencias;
- reprocessamento idempotente;
- acionamento separado da baixa ja entregue no 3.3 para itens elegiveis.

### 3.4 — nao recria

- agenda, grade ou fato de comissao da Fase 2;
- baixa manual, evento, estorno ou historico do 3.3;
- associacao/ocorrencia contratual do 3.2;
- pagamento ou reversao operacional de repasse;
- cobranca de parcela;
- banco, conta, caixa, tesouraria, fluxo de caixa ou conciliacao bancaria.

### 3.5 — reservado

- superficie operacional de repasses;
- consulta por beneficiario;
- pagamento/desfazimento individual ou em lote;
- data, forma, referencia e comprovante;
- reversao de repasse pago e seus efeitos sobre estorno de comissao.

No 3.4, a baixa reutilizada do 3.3 pode apenas liberar repasse conforme D20;
nao executa pagamento.

### 3.6 — reservado

- cobrancas securitarias ancoradas em `parcela_id`;
- kanban de inadimplencia;
- responsavel, prioridade, canal, proximo contato e follow-up;
- guias transversais da cobranca;
- nenhuma relacao com o parser de demonstrativos de comissao.

## Validacao documental desta rodada

- [x] contrato-base v2.4 conferido;
- [x] fatos das Fases 2, 3.2 e 3.3 preservados;
- [x] upload, armazenamento, extracao, normalizacao, previa, associacao,
  conciliacao, ocorrencia e baixa separados;
- [x] nenhuma conciliacao bancaria incluida;
- [x] OCR excluido integralmente do frontend e atribuido ao backend;
- [x] `database.ts` analisado e mantido inalterado;
- [x] `relatorio-endpoints-campos.md` lido como snapshot e mantido inalterado;
- [x] riscos e decisoes dependentes da revisao registrados;
- [x] status do 3.4 atualizado para `[x]` somente depois da autorizacao,
  implementacao e validacao do recorte frontend.

## Execucao frontend concluida

### Entrega funcional

- `Importar demonstrativo` abre a pagina dedicada
  `/financeiro/importar-demonstrativo`, com quatro etapas: upload, conferencia,
  confirmacao e conclusao;
- PDF, XLS e XLSX entram na fila e cada arquivo e processado como unidade
  independente;
- o frontend valida extensao, assinatura basica, vazio, arquivo protegido no
  caso demonstrativo e calcula SHA-256, sem interpretar o layout de negocio;
- o processamento mockado devolve cabecalho, itens, parser/versao e sugestoes
  tipadas, deixando claro na interface que nao representam layout homologado;
- a previa permite corrigir segurado, apolice e valores, trocar o vinculo,
  justificar diferenca/parcialidade ou descartar o item com motivo;
- a confirmacao persiste `comissao_extratos`, `comissao_extrato_itens`,
  `comissao_conciliacoes` e `comissao_conciliacao_ocorrencias` no mock v2.4;
- o hash e a chave contratual devolvem o resultado anterior em nova
  confirmacao, sem duplicar extrato, item ou conciliacao;
- a conclusao oferece `Baixar elegiveis` como comando separado, abrindo o
  assistente do 3.3. A importacao nunca cria `comissao_baixas`;
- a confirmacao usa tabela operacional com situacao da associacao, segurado,
  ramo, proposta, apolice/documento, parcela, saldo previsto, comissao
  informada e diferenca. `Sugerida` e explicada como vinculo provavel que exige
  conferencia humana;
- a conclusao reapresenta a mesma tabela, marca cada linha conciliada e permite
  abrir em nova guia a aba `Parcelas e comissoes` do documento correspondente;
- nenhum pagamento de repasse, cobranca, conta bancaria ou conciliacao
  bancaria foi introduzido.

### Arquivos da entrega

- `nexus-crm/src/components/financeiro/CommissionImportWizard.tsx`;
- `nexus-crm/src/components/financeiro/CommissionsView.tsx`;
- `nexus-crm/src/pages/ImportacaoDemonstrativoComissoesPage.tsx`;
- `nexus-crm/src/App.tsx`, apenas para a rota dedicada;
- `nexus-crm/src/pages/ApoliceDetalhePage.tsx`, apenas para aceitar o deep link
  `aba=agendas` usado por `Abrir financeiro`;
- `nexus-crm/src/hooks/useFinanceiroExtratos.ts`;
- `nexus-crm/src/modules/financeiro/extratoImportDomain.ts`;
- `nexus-crm/src/modules/financeiro/extratoImportDomain.test.ts`;
- `nexus-crm/src/lib/queryClient.ts`, apenas para a chave de cache;
- `nexus-crm/src/pages/FinanceiroPage.tsx`, somente para retirar o indicador
  visual `3.3` de `Comissoes`.

`database.ts`, DBML, instrucoes contratuais, mocks de seed, configuracoes e
`relatorio-endpoints-campos.md` permaneceram inalterados.

### Evidencias de validacao

- TypeScript `tsc -b`: aprovado;
- Vitest financeiro focado: 24 testes aprovados;
- Vitest completo: 23 arquivos e 142 testes aprovados;
- ESLint focado nos arquivos alterados: aprovado;
- build Vite: aprovado; permaneceu apenas o aviso preexistente de chunk maior
  que 500 kB;
- navegador em `1280x720`: fluxo completo aprovado, sem overflow global e sem
  erros/warnings de console;
- a confirmacao demonstrativa criou 3 conciliacoes e 1 ocorrencia resolvida,
  expondo somente 2 associacoes integrais como elegiveis e mantendo `Baixado`
  em `R$ 0,00`;
- `Esc` nao encerra nem abandona a pagina de importacao e o indicador `3.3`
  permanece ausente ao lado de `Comissoes`.
- etapas 3 e 4 validadas com a tabela detalhada; os links `Abrir financeiro`
  usam nova guia e selecionam diretamente `Parcelas e comissoes` na proposta.

### Risco residual e hand-off

O frontend esta concluido, mas Porto, SulAmerica ou qualquer outra seguradora
so podem ser declaradas suportadas quando o backend receber fixtures reais
anonimizadas e homologar layout/versao. Essa pendencia nao autoriza parser nem
reconhecimento de imagem neste repositorio.

## Proximo gate

Aguardar revisao do usuario. O proximo recorte funcional e `3.5 — Repasses`;
nao inicia-lo sem novo micro-plano e autorizacao explicita.
