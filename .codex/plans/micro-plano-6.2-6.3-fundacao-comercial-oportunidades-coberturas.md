# 6.2–6.3 — Fundacao comercial e arquitetura unificada do multi-calculo

> **Estado reconciliado em 11/09/2026:** os quatro guardrails antes delegados a 6.4–6.5 estão concluídos pelos planos 6.4R-B, 6.5A, 6.5B e [finalização de setembro](micro-plano-finalizacao-front-2026-09-10.md). Persistência é normalizada no mock; o limite vigente é cinco cotações e o termo de produto é apresentação comercial. Hand-off consolidado na seção 6 do [relatório raiz](../../relatorio-endpoints-campos.md).

Status: `[x] Concluido no recorte 6.2–6.3 — 2026-07-21`\
Classificacao: `governada/contratual`\
Criado em: 2026-07-21\
Decisao de agrupamento: o usuario autorizou tratar 6.2 e 6.3 no mesmo
micro-plano, preservando 6.4 e 6.5 como recortes proprios.
Decisao de arquitetura revisada em 2026-07-21: dentro da oportunidade existe
uma unica area de `Calculos`; cada calculo contem suas cotacoes, e um orcamento
do sistema pode combinar cotacoes selecionadas de calculos diferentes.

## Objetivo

Preparar a fundacao comercial da Fase 6 em dois eixos inseparaveis:

1. reconciliar o catalogo de coberturas com os campos documentados pela API do
   Aggilizador, mantendo um unico catalogo normalizado para cotacao e contrato;
2. reconstruir Oportunidades sobre o contrato v2.6, retirando dados oficiais de
   calculo/cotacao do registro comercial e transformando o detalhe em um cockpit
   operacional aderente as guias transversais do sistema;
3. fixar a arquitetura da futura area unificada de multi-calculo: versoes como
   agrupadores de perfil/coberturas, cotacoes aninhadas por seguradora e selecao
   transversal para gerar o orcamento apresentado ao cliente.

Este recorte deve deixar Oportunidades pronta para receber `calculos` em 6.4 e
`cotacoes` em 6.5 sem exigir outro redesenho estrutural da pagina.

## Fontes oficiais conferidas

- `.codex/artefatos/instrucoes_projeto_wassis_v2_6.md`;
- `.codex/artefatos/wassis_erp_esqueleto_v2_6.dbml`;
- `.codex/artefatos/Integração API Aggilizador.pdf`;
- `.codex/.har/app.segfy.comgui.har`, inspecionado de forma sanitizada, sem
  reproduzir tokens, credenciais ou dados pessoais;
- `.codex/plans/macro_plano.md`;
- `.codex/plans/micro-plano-1.1-campos-personalizados-eav-tipado.md`;
- `.codex/plans/micro-plano-1.2a-1.2b-guias-transversais-atividades-anexos.md`;
- `.codex/plans/micro-plano-1.2c-timeline-unificada.md`;
- `.codex/plans/micro-plano-1.2d-mencoes-notificacoes.md`;
- `.codex/plans/micro-plano-2.8-edicao-guias-contratuais.md`;
- `.contextos-mercado/portal_ajuda_quiver/Utilizando_os_modulos/Orcamentos/ORCAMENTOS.htm`;
- `.contextos-mercado/portal_ajuda_segfy/knowledge/treinamento-online-como-realizar-c%C3%A1lculos-em-nossa-nova-jornada-de-cota%C3%A7%C3%B5es-autom%C3%B3vel.html`;
- `.contextos-mercado/portal_ajuda_segfy/knowledge/hfy-como-salvar-coberturas-espec%C3%ADficas-dentro-do-cota%C3%A7%C3%B5es-hfy.html`;
- `PRODUCT.md`, `DESIGN.md`, `wassis-design-uiux` e Impeccable como referencias
  de produto/UI.

O `relatorio-endpoints-campos.md` foi consultado apenas como snapshot parcial.
Nao deve ser atualizado neste recorte sem pedido explicito.

## Decisoes contratuais preservadas

- `oportunidades` representa a tentativa de venda e o funil comercial;
- lead e uma oportunidade com `segurado_id = NULL` e dados minimos nas colunas
  `lead_*`; nao existe tabela `leads`;
- uma oportunidade possui N `calculos` (versoes) e cada calculo possui N
  `cotacoes` (resultados por seguradora);
- calculos e cotacoes aparecem em uma unica area da oportunidade. `Cotacoes`
  nao e guia irma de `Calculos`; e colecao filha de cada versao;
- premio, comissao, seguradora e vigencia oficiais nao pertencem a oportunidade;
  quando exibidos nela, sao resumo derivado de calculos/cotacoes/propostas;
- `calculo_coberturas` registra a cobertura cotada e `item_coberturas` registra a
  cobertura efetivamente contratada;
- cotado e emitido permanecem fatos separados; o ganho exige de-para explicito;
- o mesmo `coberturas_catalogo`, filtrado por `ramo_id`, abastece calculo e
  proposta/apolice;
- alteracao contratual de cobertura encerra a linha anterior e inclui outra;
  nunca faz UPDATE destrutivo da versao emitida;
- codigos de fio da Agger nao entram no schema de negocio. O front/mock guarda
  significado normalizado e o adaptador futuro traduz W.Assis <-> Agger;
- `calculo` nao entra no conjunto transversal de `entidade_tipo` neste recorte.
  As guias transversais ficam em `oportunidade` e, quando aplicavel, `cotacao`;
- nenhum dado de negocio novo sera armazenado em JSON.

Nova decisao de produto sobre nomenclatura:

- `calculo` continua sendo a versao de perfil/risco/coberturas;
- `cotacao` continua sendo o resultado de uma seguradora para um calculo;
- `orcamento` passa a significar exclusivamente a apresentacao gerada pelo
  WassisCRM com uma selecao de cotacoes, possivelmente vindas de calculos
  diferentes;
- `orcamento` nao volta a ser sinonimo de calculo, cotacao ou proposta.

## Diagnostico da documentacao do Aggilizador

O PDF v1 documenta formularios e validacoes para:

- Automovel: `/Auto/*`;
- Residencial: `/Residence/*`;
- Condominio: `/Condominium/*`;
- Vida individual: `/Life/*`;
- Diversos: `/Several/*`;
- Empresarial: `/Business/*`.

O documento confirma validacoes por bloco e um POST final por tipo de calculo,
mas nao fecha autenticacao, versionamento, idempotencia, processamento
assincrono, retorno das cotacoes, polling/webhook, rate limit nem taxonomia de
erros. Portanto, ele e fonte de campos e mapeamento do adaptador, nao autorizacao
para chamada direta pelo navegador nem contrato completo de integracao.

`InsuranceBrokerId`, `Partner`, credenciais e qualquer segredo pertencem ao
backend/configuracao segura. O frontend nao deve armazenar nem solicitar esses
valores em tela generica.

## Evidencias do HAR de multi-calculo

O fluxo capturado em `.codex/.har/app.segfy.comgui.har` confirma:

- `POST /api/vehicle/version/1.0/calculate` envia um unico perfil de risco,
  coberturas e uma lista de seguradoras para aquela versao;
- `POST /api/vehicle/version/1.0/show-results` retorna resultados de varias
  seguradoras aninhados no calculo, incluindo premio, franquia, comissao,
  coberturas, precos adicionais, parcelas e status;
- a UI possui selecao multipla de historico/versoes de cotacao e mantem uma
  colecao unica de resultados selecionados;
- `POST /api/orcamento/UpdateQuotationResults` recebe uma lista de IDs de
  cotacoes selecionadas e devolve `urlVisualizacao` e `urlPdf`;
- `POST /api/quotation/version/1.0/save-public` persiste os resultados
  selecionados e configuracoes de apresentacao;
- a superficie observada oferece `Incluir cotacao`, `Gerar orcamento` e
  `Salvar alteracao`, alem de saida por link online e PDF.

O HAR prova a composicao de varias cotacoes no orcamento. A captura observada
possui uma versao efetivamente calculada, mas o bundle tambem expoe selecao de
`Historico de cotacoes`/versoes. A exigencia de combinar cotacoes de calculos
diferentes e decisao explicita do WassisCRM e deve ser coberta por teste proprio,
sem depender de inferencia sobre o comportamento interno do SegFy.

## Matriz inicial de coberturas da API

A implementacao deve transformar cada chave externa em um codigo interno estavel
de `coberturas_catalogo`, sempre por ramo. Nomes iguais em ramos distintos nao
implicam a mesma linha de catalogo.

### Automovel

Coberturas/servicos candidatos ao catalogo:

- `DanosMorais`;
- `DanosMateriais`;
- `DanosCorporais`;
- `MorteInvalidez`;
- `Assistencia`;
- `Vidros`;
- `CarroReserva`;
- `KitGas`;
- `Carroceria`;
- `Equipamento`.

Parametros do calculo, nao novas coberturas por reflexo:

- `TipoVeiculo`;
- `TipoFranquia`;
- `FatorAjuste`;
- `ArCondicionado`, que qualifica carro reserva no payload documentado.

O mapeamento de casco deve ser validado explicitamente: a API expressa o valor
de referencia por `FatorAjuste`, enquanto o catalogo atual possui `casco`. Nao
tratar percentual FIPE como `capital_lmi` sem regra de conversao aprovada.

### Residencial

- `Assistencia`;
- `Basica`;
- `DanosMorais`;
- `ResponsabilidadeCivilFamiliar`;
- `DanosEletricos`;
- `Equipamentos`;
- `Aluguel`;
- `Vidros`;
- `RouboFurto`;
- `Vazamentos`;
- `Vendaval`;
- `Desmoronamento`;
- `TumultoGreve`;
- `ImpactoVeiculos`;
- `RecomposicaoDocumento`.

### Condominio

- `Assistencia`;
- `Basica`;
- `DanosMorais`;
- `DanosEletricos`;
- `Portoes`;
- `Vidros`;
- `RouboBens`;
- `Vazamentos`;
- `Vendaval`;
- `Desmoronamento`;
- `TumultoGreve`;
- `ImpactoVeiculo`;
- `Alagamento`;
- `DespesasFixas`;
- `Sindico`;
- `Condominio`;
- `Garagista`;
- `IncendioBens`;
- `Aluguel`;
- `GaragistaExclusiva`;
- `VidaFuncionario`;
- `RouboCondomino`;
- `Anuncios`.

### Vida individual

- `Capital`;
- `AssistenciaFuneral`;
- `InvalidezDoenca`.

`Capital` deve ser traduzido para uma cobertura basica nomeada no catalogo do
ramo; nao criar uma cobertura generica chamada apenas `Capital` sem validar a
semantica comercial exibida ao corretor.

### Empresarial

- `Assistencia`;
- `Basica`;
- `DanoEletrico`;
- `Vidro`;
- `RouboFurto`;
- `Equipamento`;
- `Vendaval`;
- `ImpactoVeiculo`;
- `Desmoronamento`;
- `Anuncio`;
- `Aluguel`;
- `TumultoGreve`;
- `RecomposicaoDocumento`.

### Diversos e ramos fora da Agger

O PDF nao apresenta bloco de coberturas para `/Several`. Vida em Grupo,
Saude, Frota como frota, grandes riscos e outros ramos permanecem com cotacao
manual de primeira classe. O catalogo W.Assis continua cadastravel e pode conter
coberturas alem da Agger; a integracao nunca limita o dominio interno.

## Regra de normalizacao e de-para

Antes de criar seeds, formularios ou adapters, produzir uma matriz tipada com:

- `forma_calculo`/ramo;
- chave externa da Agger;
- codigo interno estavel de `coberturas_catalogo`;
- rotulo pt-BR;
- natureza (`cobertura`, `assistencia` ou `parametro_calculo`);
- tipo de valor (`selecao`, capital/LMI, percentual ou enum);
- destino normalizado (`calculo_coberturas`, `calc_*` ou apenas adaptador);
- regra de ida e volta e tratamento de zero/null;
- aplicabilidade no cadastro manual da proposta.

Nao criar coluna `agger_codigo` no DBML por conveniencia. Se o mapeamento nao
puder ser estavel em codigo/adaptador, registrar a necessidade contratual antes
de alterar o esqueleto.

## Diagnostico do front de Oportunidades

O front atual ainda combina o contrato novo com legado:

- `database.ts` possui as colunas canonicas `lead_*`, `titulo` e estimativas,
  mas mantem `nome`, `metadata`, `seguradora_id`, `premio_liquido`,
  `comissao_percentual`, vigencias, `pipeline_id`, `status` e outros campos
  antigos na mesma linha;
- `useOportunidades` ainda grava `metadata` e dados que deveriam pertencer a
  calculo/cotacao;
- `NovaOportunidadeModal` usa campos dinamicos em JSON;
- `OportunidadeDetalhePage` apresenta uma guia `Orcamento` com seguradora,
  premio, comissao e vigencia diretamente na oportunidade;
- `Produtores`, `Anexos e logs`, `Comentarios` e `Oportunidades` possuem
  conteudo incompleto ou placeholders e nao reutilizam integralmente a base
  transversal;
- o Kanban depende de campos legados como `nome`, `pipeline_id` e `status`, que
  devem virar view model derivado de `titulo`/lead/segurado e de
  `stage -> pipeline`, sem contaminar o contrato persistido.

## Arquitetura de informacao proposta

### Captura rapida

`Nova Oportunidade` permanece uma acao curta em modal, limitada a:

- titulo ou identificacao minima do lead;
- segurado existente quando houver;
- ramo, origem, corretora, responsavel e etapa inicial;
- prioridade e previsao de fechamento quando relevantes.

Questionario de risco, coberturas, multi-calculo e comparacao de seguradoras nao
cabem nesse modal. Em 6.4, calculos longos devem usar pagina/rota dedicada com
estado preservado e saida explicita.

### Detalhe da oportunidade

Guias entregues neste recorte:

1. `Visao geral` — identidade do negocio, lead/segurado, funil, origem,
   responsavel, ramo, prioridade, datas e desfecho; edicao inline da unidade
   escalar, com `Cancelar` e `Salvar alteracoes` no proprio bloco;
2. `Tarefas` — componente transversal por
   `entidade_tipo = oportunidade`;
3. `Campos personalizados` — EAV tipado por oportunidade;
4. `Anexos e logs` — anexos + timeline unificada, com auditoria tecnica somente
   em leitura;
5. `Observacoes` — notas, mencoes e autoria pelo componente transversal.

Area de negocio reservada para os recortes seguintes:

- `Calculos` e a unica guia comercial do multi-calculo;
- cada versao mostra rotulo, cotado, risco, vigencia, comissao sugerida,
  coberturas e estado do processamento;
- dentro de cada calculo ficam as cotacoes das seguradoras, com premio,
  franquia, comissao, forma de pagamento, parcelas, validade e status;
- cotacoes podem ser selecionadas em calculos diferentes, mantendo sempre
  visivel de qual versao/perfil cada resultado veio;
- uma barra de selecao transversal resume quantidade de calculos e cotacoes
  escolhidas e oferece `Gerar orcamento`;
- o orcamento agrupa visualmente as opcoes por calculo e, dentro do calculo,
  pelas seguradoras selecionadas.

Implementacao progressiva na mesma superficie:

- 6.4 entrega os calculos/versoes, risco e coberturas;
- 6.5 acrescenta as cotacoes aninhadas, selecao cruzada e geracao do orcamento;
- 6.5 nao cria uma nova guia `Cotacoes` nem outra pagina concorrente para o
  fluxo principal.

Nao criar abas vazias ou `Modulo em construcao`. A guia `Calculos` so aparece
quando o primeiro recorte funcional de 6.4 for entregue e evolui no lugar em
6.5.

### Exemplo canonico de selecao cruzada

Uma oportunidade possui:

- Calculo A: cobertura de terceiros em R$ 100.000,00, com cotacoes Porto,
  Tokio, Allianz e demais seguradoras;
- Calculo B: cobertura de terceiros em R$ 200.000,00, com cotacoes Porto,
  Tokio, Allianz e demais seguradoras.

O corretor pode selecionar resultados dos dois calculos para gerar um unico
orcamento. A selecao nao funde os calculos: o documento precisa deixar evidente
qual seguradora/preco pertence ao perfil de R$ 100.000,00 e qual pertence ao
perfil de R$ 200.000,00.

Validacoes minimas da composicao:

- todas as cotacoes selecionadas pertencem a calculos da mesma oportunidade;
- cada cotacao aparece uma unica vez no orcamento;
- somente resultado apresentavel e ainda valido pode ser selecionado;
- selecionar cotacoes de calculos diferentes e permitido e esperado;
- o contexto do calculo acompanha cada cotacao no preview e no documento;
- gerar orcamento nao aprova cotacao nem cria proposta automaticamente.

### Conteudo legado a aposentar ou redistribuir

- `Orcamento` legado: a guia atual mistura campos de oportunidade e cotacao e
  deve ser substituida por `Visao geral` e pela futura guia unificada
  `Calculos`. O termo volta apenas para o documento/apresentacao gerado a partir
  de cotacoes selecionadas;
- `Produtores`: nao manter guia sem entidade propria. Responsavel fica na visao
  geral; co-producao/repasse pertence ao documento contratual e nao deve ser
  inventada na oportunidade;
- `Comentarios`: substituir por `Observacoes` transversal;
- `Historico de oportunidades`: remover do detalhe. O historico do cliente ja
  pertence ao detalhe do Segurado;
- seguradora, premio, comissao e vigencia: exibir futuramente como resumo
  derivado da melhor/ultima cotacao ou proposta, nunca como autoria direta na
  oportunidade.

## Lacuna contratual para o orcamento gerado

O DBML v2.6 modela `oportunidades -> calculos -> cotacoes`, mas nao possui uma
entidade que persista uma selecao de cotacoes de varios calculos como orcamento
gerado. `anexos` sozinho nao resolve: ele pode guardar o PDF, mas nao representa
de forma normalizada quais cotacoes compuseram o documento, sua ordem, validade,
configuracoes de exibicao e historico de geracao.

Antes da implementacao de 6.5, DBML e instrucoes devem receber juntos uma
decisao aditiva/versionada. Direcao recomendada, ainda sujeita a aprovacao
contratual:

- entidade-pai de apresentacao/orcamento ligada a `oportunidade`;
- entidade-filha N:N contendo uma linha por `cotacao_id` selecionada;
- ordem de exibicao e autoria explicitas;
- validade, status, observacoes e links de visualizacao/PDF na entidade-pai;
- configuracoes importantes de apresentacao em colunas tipadas, nunca JSON;
- uma nova geracao relevante cria versao/historico, sem apagar o que foi
  apresentado ao cliente;
- aprovacao continua ocorrendo em uma `cotacao` especifica e somente ela pode
  originar `propostas.cotacao_id`.

O nome fisico deve evitar ressuscitar a ambiguidade do legado. Avaliar no bump
contratual nomes como `apresentacoes_cotacao` + `apresentacao_cotacoes`, mantendo
`Orcamento` como rotulo de produto, ou justificar explicitamente outro par.

## Direcao visual e de interacao

- cockpit operacional denso, com fundo continuo do shell e sem card-pagina;
- estrategia de cor restrita: azul W.Assis para acao/selecao, cor de ramo apenas
  para categoria e tons semanticos para status;
- cabecalho compacto com titulo, lead/segurado, etapa, ramo, responsavel e
  proximas acoes, sem hero de metricas;
- `EntityTabsBar` como navegacao interna compartilhada;
- edicao no lugar para a Visao geral, preservando memoria espacial;
- uma unidade de edicao por vez e protecao contra troca de guia com alteracoes
  nao salvas;
- estados de loading com skeleton, vazio orientativo, erro recuperavel e
  feedback interno; nenhum dialogo nativo;
- navegacao por teclado, foco visivel, contraste WCAG AA e suporte a dark mode;
- desktop comum em zoom 100% como alvo principal, com comportamento responsivo
  estrutural e sem tipografia fluida.

## Recortes executaveis

### 6.2–6.3A — Matriz Agger e completude do catalogo

- materializar o de-para tipado descrito neste plano;
- classificar cada chave externa entre cobertura e parametro de calculo;
- ampliar os seeds do `coberturas_catalogo` para os ramos documentados;
- preservar cadastros extras e o caminho manual de ramos nao atendidos;
- garantir que o cadastro manual de proposta/apolice consuma o mesmo catalogo,
  sem lista paralela hardcoded;
- testar filtro por ramo e ausencia de mistura entre catalogos homonimos.

### 6.2–6.3B — Contrato de Oportunidades

- comparar campo a campo `database.ts`, mock, hooks e adapters com
  `oportunidades` do DBML v2.6;
- retirar novos writes em `metadata` e mapear cada uso atual para coluna
  canonica, campo personalizado ou entidade propria;
- remover do contrato persistido os campos oficiais de calculo/cotacao;
- adaptar o view model do Kanban para derivar titulo, pipeline e status sem
  reintroduzir colunas legadas;
- cobrir lead solto, segurado existente e oportunidade de renovacao por
  `apolice_origem_id`.

### 6.2–6.3C — Captura e qualificacao do lead

- enxugar `NovaOportunidadeModal` para a captura rapida aprovada;
- criar oportunidade com `segurado_id = NULL` quando for lead;
- permitir vincular segurado existente;
- definir fluxo explicito para qualificar o lead, criando/vinculando Segurado e
  preservando a identidade da oportunidade;
- bloquear duplicidade/documento invalido conforme os contratos ja usados em
  Segurados, sem criar pessoa incompleta silenciosamente.

### 6.2–6.3D — Cockpit de Oportunidades

- reconstruir o detalhe sobre `EntityTabsBar` e os componentes de detalhe
  existentes;
- implementar Visao geral aderente ao contrato e edicao inline atomica;
- aplicar Tarefas, Campos personalizados, Anexos e logs e Observacoes com
  `entidade_tipo = oportunidade`;
- suportar deep link por query param para guia transversal, inclusive origem de
  notificacoes/mencoes;
- remover placeholders e guias legadas sem funcao;
- deixar o registro de tabs preparado para a inclusao funcional de Calculos e
  das cotacoes aninhadas nos recortes 6.4/6.5, sem nova guia irma.

### 6.2–6.3E — Validacao e fechamento

- testar criar lead, criar oportunidade vinculada, qualificar lead, editar visao
  geral, mover etapa, concluir como ganha/perdida e abrir origem de mencao;
- testar as quatro guias transversais na oportunidade;
- testar catalogo por ramo e uso das coberturas no cadastro manual de proposta;
- validar TypeScript, Vitest completo, ESLint focado e build;
- validar no navegador Kanban/lista, detalhe, modal curto, dark mode, zoom 100%
  e viewport desktop comum;
- varrer novos `any`, `metadata`, `setState(` problematico e dialogos nativos;
- confirmar aderencia final de `database.ts` para `oportunidades`,
  `coberturas_catalogo` e `item_coberturas`.

## Tabelas DBML envolvidas

Principais neste recorte:

- `oportunidades`;
- `coberturas_catalogo`;
- `item_coberturas`;
- `apolice_itens` e `propostas`, apenas no consumo contratual das coberturas;
- `segurados`, `ramos`, `origens`, `motivos_perda`, `pipeline_stages` e
  `pipelines` como relacionamentos/lookups;
- `atividades`, `atividade_mencoes`, `anexos`, `audit_logs`,
  `campo_definicoes`, `campo_opcoes`, `campo_valores` e
  `campo_valor_opcoes` para as guias transversais.

Preparadas, mas nao implementadas neste recorte:

- `calculos`;
- `calc_auto`, `calc_residencia`, `calc_condominio`, `calc_vida`,
  `calc_empresa`, `calc_diversos`;
- `calculo_coberturas`;
- `cotacoes`;
- `integracao_logs`.

## Arquivos frontend provaveis

- `nexus-crm/src/types/database.ts`;
- `nexus-crm/src/lib/inMemoryDb.ts`;
- `nexus-crm/src/hooks/useOportunidades.ts`;
- `nexus-crm/src/components/NovaOportunidadeModal.tsx`;
- `nexus-crm/src/pages/OportunidadesPage.tsx`;
- `nexus-crm/src/pages/OportunidadesListPage.tsx`;
- `nexus-crm/src/pages/OportunidadeDetalhePage.tsx`;
- `nexus-crm/src/components/kanban/*` e adapters do modulo comercial;
- `nexus-crm/src/components/detail/EntityTabsBar.tsx` e guias compartilhadas,
  preferencialmente sem duplicacao;
- `nexus-crm/src/components/propostas/cadastro-manual/*`;
- novo modulo tipado em `nexus-crm/src/modules/comercial/` para normalizacao,
  view models e de-para Agger, se a inspecao confirmar essa fronteira;
- testes focados dos dominios, hooks e paginas alteradas.

## Nao escopo

- implementar `calculos`, especializacoes `calc_*` ou `cotacoes` antes dos
  micro-planos 6.4/6.5;
- exibir abas vazias de Calculos/Cotacoes;
- criar uma guia independente `Cotacoes`;
- gerar orcamento persistente sem fechar antes a lacuna contratual normalizada;
- chamar a API da Agger pelo frontend;
- guardar credenciais, IDs de parceiro/corretora ou tokens no navegador;
- implementar backend, SQL, migrations, jobs, polling, webhook ou storage;
- criar UI generica de `integracao_logs`;
- copiar codigos enumerados da Agger para o schema de negocio;
- limitar o catalogo W.Assis apenas as coberturas suportadas pela Agger;
- criar modelos reutilizaveis de conjuntos de coberturas sem decisao contratual
  aditiva; a referencia de mercado foi registrada, mas nao autoriza nova tabela;
- atualizar `relatorio-endpoints-campos.md` neste momento.

## Criterios de aceite

- [x] Existe de-para tipado e revisavel entre chaves de cobertura da API e
      codigos internos por ramo.
- [x] Campos estruturais da API nao viram coberturas por engano.
- [x] O catalogo cobre a referencia Agger e continua extensivel para coberturas
      manuais e ramos nao atendidos.
- [x] O de-para e o cadastro manual de proposta/apolice usam o mesmo
      `coberturas_catalogo`; 6.4 deve consumir este catalogo, sem lista paralela.
- [x] `item_coberturas` continua versionando por excluir + incluir.
- [x] Oportunidade deixa de gravar `metadata` e dados oficiais de cotacao.
- [x] Lead pode nascer sem segurado e ser qualificado sem trocar a oportunidade.
- [x] Kanban, lista e detalhe operam sobre view models aderentes ao contrato.
- [x] O detalhe entrega Visao geral e as quatro guias transversais funcionais.
- [x] Nao permanecem as guias/termos legados `Orcamento`, `Comentarios`,
      `Produtores` sem contrato e `Historico de oportunidades`.
- [x] Fluxos principais, tipos, testes, build e QA visual do recorte foram
      aprovados.

Guardrails ja aprovados, mas cuja implementacao pertence a 6.4–6.5 e portanto
nao compoe o aceite de conclusao deste micro-plano:

- [x] Exibir a unica guia `Calculos`, ja funcional; as cotacoes devem aparecer
      dentro da versao que as originou.
- [x] Permitir selecionar cotacoes de calculos diferentes e gerar um unico
      orcamento sem perder o contexto de cada versao.
- [x] Garantir que gerar orcamento nao aprove cotacao nem crie proposta
      implicitamente.
- [x] Resolver a lacuna de persistencia do orcamento em versao conjunta de
      DBML/instrucoes antes da implementacao de 6.5.

## Evidencias de conclusao — 2026-07-21

- `database.ts`, mock, hooks e adapters foram comparados com o DBML/instrucoes
  v2.6; `oportunidades` agora persiste apenas o contrato canonico, com pipeline
  derivado da etapa e status derivado de `ganha_em`/`perdida_em`.
- a matriz tipada da Agger cobre 10 chaves de Automovel, 15 de Residencia, 23 de
  Condominio, 3 de Vida e 13 de Empresa; parametros estruturais permanecem fora
  de `coberturas_catalogo` e Diversos continua manual/extensivel.
- o cadastro manual de proposta consome os seeds produzidos pelo mesmo de-para;
  o teste focado comprova a presenca dos codigos de Automovel no lookup manual.
- o teste existente de `contractTabOperations` continuou comprovando que editar
  cobertura encerra a linha anterior e inclui nova versao.
- `npx tsc -b`: aprovado.
- `npm test`: 33 arquivos e 222 testes aprovados.
- ESLint focado em todos os arquivos alterados: aprovado sem erros.
- `npm run build`: aprovado; permaneceu apenas o aviso conhecido de chunk acima
  de 500 kB.
- QA no navegador local, tema escuro e viewport 1440 x 900: criacao de lead,
  edicao da Visao geral, qualificacao para segurado existente, conclusao como
  perdida e navegacao por Tarefas, Campos personalizados, Anexos e logs e
  Observacoes aprovadas; nenhum erro foi registrado no console.
- a visualizacao em lista foi validada com estado vazio e linha populada; a
  primeira verificacao revelou rolagem horizontal em 1440 x 900, corrigida com
  densidade responsiva e agrupamento de origem, comissao e previsao nas linhas.
  A verificacao final confirmou todos os cabecalhos visiveis, ausencia de corte
  horizontal e navegacao da linha para o detalhe, sem erros no console.
- depois do ajuste visual final, `npx tsc -b`, ESLint focado e
  `git diff --check` foram aprovados novamente; a suite completa e o build nao foram
  repetidos porque nao houve alteracao funcional posterior.
- `relatorio-endpoints-campos.md` permaneceu inalterado conforme a politica de
  consolidacao posterior do hand-off.

## Notas para o hand-off futuro de backend

Registrar para consolidacao posterior:

- CRUD e qualificacao de oportunidade, com filtros por filial, etapa, ramo,
  origem, responsavel, periodo, ganho/perda e renovacao;
- derivacao segura de titulo, pipeline/status e resumos de calculo/cotacao;
- listagem hierarquica `oportunidade -> calculos -> cotacoes` numa unica leitura
  operacional ou em consultas coordenadas com ordenacao estavel;
- composicao normalizada de orcamento por selecao de `cotacao_id` pertencentes a
  calculos da mesma oportunidade;
- geracao, versionamento, visualizacao, PDF e eventual compartilhamento do
  orcamento sem converter automaticamente nenhuma cotacao;
- lookup de coberturas por ramo e manutencao do catalogo;
- de-para entre codigo interno e chave externa da Agger como responsabilidade do
  adaptador/backend;
- IDs `InsuranceBrokerId` e `Partner` por corretora/tenant em armazenamento
  seguro, nunca enviados pelo usuario comum;
- validacoes sequenciais e submissao final da Agger;
- lacunas documentais: autenticacao, ambientes/base URL, idempotencia,
  assincronicidade, consulta de resultados, webhooks, erros, timeout/retry,
  rate limit e versionamento;
- payload cru somente em `integracao_logs`; dado util normalizado em
  `calculos`, `calc_*`, `calculo_coberturas` e `cotacoes`;
- autoria de atividades/anexos/campos no front e enforcement/RLS no backend.

## Gate antes da implementacao

Este micro-plano tambem funciona como brief de UX do recorte. A implementacao
so deve comecar depois de confirmacao explicita do usuario sobre esta arquitetura
de guias e sobre a regra de mapeamento das coberturas Agger.
