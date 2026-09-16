# Plano Macro — WassisCRM rumo ao Esqueleto v3.1

> **Documento vivo e backlog central.** Este arquivo guia as fases, micro-planos,
> hand-offs e acompanhamento do projeto. Use status `[ ]` pendente, `[~]` em
> andamento e `[x]` concluido.

## Norte do plano

- [~] 16/09/2026 — Remediação de segurança SEC-01 a SEC-12 em conjunto com WAssisBE: sessão sem Web Storage, permissões efetivas, paginação e gates de CI em implementação. Micro-plano: `micro-plano-remediacao-seguranca-sec-01-12-2026-09-16.md`.

- [~] 15/09/2026 — Gestão administrativa SaaS conectada: contrato, identidade/RBAC, testes e gates operacionais em andamento. Micro-plano: `micro-plano-gestao-administrativa-saas-2026-09-15.md`.

- [~] 13/09/2026 — Prontidão SaaS com WAssisBE: Segurados e Oportunidades persistidos e validados por Playwright nas telas originais; build/adapter impedem falso modo conectado. ADRs, inventário de memória e runbooks entregues; módulos restantes e operação publicada pendentes. Backend em repositório separado. Micro-plano: `micro-plano-prontidao-saas-2026-09-13.md`. Aceite anterior era frontend demonstrativo, não SaaS integrado completo.

- [x] 11/09/2026 — Encerramento documental da primeira versão concluído: hand-off consolidado, checklists históricos reconciliados e aceite de escopo registrado com limites explícitos. Micro-plano: `micro-plano-encerramento-frontend-v1-2026-09-11.md`.

- [x] 11/09/2026 — Frontend consolidado e DBML v3.1 publicados em Dev, integrações remotas conciliadas. [PR #47](https://github.com/Wassis-ERP/WassisCRM/pull/47) acompanha checks, merge e homologação. Micro-plano: `micro-plano-publicacao-consolidada-2026-09-11.md`.

  Exceção autorizada nesta conciliação: preservar as integrações HTTP de Segurados/Oportunidades já implementadas pela outra equipe em main. Isso não amplia o escopo para construir backend ou novas APIs; limitações do DTO remoto constam de `resultado-publicacao-2026-09-11.md`.

- [x] 11/09/2026 — Reconciliadas todas as diferenças de nulabilidade: 86 campos no inventário (resumo anterior dizia 87), zero divergências restantes; validações de escrita preservadas. Micro-plano: `micro-plano-nulabilidade-2026-09-11.md`.

- [x] 11/09/2026 — Aplicar recomendações da auditoria visual: reconciliação de plataforma/cadastros, acesso, permissões, contrato aditivo v3.1 e documentação. Micro-plano: `micro-plano-reconciliacao-front-2026-09-11.md`.

- [x] 11/09/2026 — Leitura visual da auditoria frontend × DBML: `revisao-front-dbml-visual.html`, com prioridades, evidências e inventário; filtros e layout desktop/mobile validados, sem correção de contrato/aplicação. Micro-plano: `micro-plano-revisao-visual-2026-09-11.md`.

O contrato de referencia e formado por:

- `.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml`
- `.codex/artefatos/instrucoes_projeto_wassis_v3_1.md`
- `.codex/artefatos/revisao_dbml_v2_0_vs_front.md`
- `.codex/plans/diagnostico-dbml-v1_1-vs-macro-plano.md` (historico analitico;
  não substitui o contrato vigente v3.1 nem o estado atual do código)
- `.contextos-mercado/portal_ajuda_quiver`
- `.contextos-mercado/portal_ajuda_segfy`

O hand-off versionável para backend fica em `relatorio-endpoints-campos.md` na
raiz. A consolidação da primeira versão foi autorizada em 11/09/2026 e reúne
todos os módulos entregues, operações propostas e as 68 tabelas do DBML v3.1.
A política de não atualizar por tela permanece para desenvolvimento futuro;
`.codex/artefatos/endpoints` e microplanos anteriores preservam o histórico.

O entregável é o **frontend da primeira versão**. Os módulos de domínio são
demonstrados em memória; autenticação e a integração HTTP legada de
Segurados/Oportunidades permanecem disponíveis nos modos já existentes.
Backend de domínio, novas APIs, SQL, migrations e RLS/RBAC pertencem à outra
equipe. Limitações da API estão em `resultado-publicacao-2026-09-11.md`.

## Regras de execucao

1. Antes de qualquer alteracao no frontend, deve existir micro-plano em
   `.codex/plans`.
2. Todo micro-plano deve declarar: objetivo, tabelas DBML envolvidas, legado atual,
   decisao de legado, arquivos frontend provaveis, criterios de aceite e notas que
   deverao alimentar o hand-off final de Endpoints & Campos.
3. O macro plano deve ser atualizado sempre que um micro-plano for criado,
   concluido ou tiver escopo alterado.
4. O backend deve ser tratado apenas como contrato/hand-off.
5. Reaproveitar antes de criar: hooks, adapters, `KanbanBoard`, `EntityTabsBar`,
   guias transversais, primitives, lookups e padroes de `SettingsPage`.
6. Para qualquer desenho, revisao, polimento, auditoria ou automacao visual de UI,
   usar `wassis-design-uiux` como autoridade do design system e `impeccable` como
   apoio de vocabulario, contexto (`PRODUCT.md`/`DESIGN.md`), detector e live mode.
   O Impeccable complementa o design W.Assis; nao substitui tokens, componentes ou
   decisoes ja mapeadas.
7. Quando houver lacunas de mapeamento de campos, contratos ou entidades no
   esqueleto, consultar tambem os portais de ajuda em
   `.contextos-mercado/portal_ajuda_quiver` e
   `.contextos-mercado/portal_ajuda_segfy`.
8. Respeitar as decisoes fechadas do contrato: grupo x corretoras, contrato x
   documento x item, multi-calculo, comissao diferente de repasse, campos
   personalizados EAV tipado, zero JSON para dado de negocio e fusao apenas na
   leitura.
9. Nao atualizar o Relatorio de Endpoints & Campos a cada tela. Registrar no
   micro-plano as decisoes, campos, operacoes e responsabilidades de backend e
   consolidar o relatorio quando o produto estiver estabilizado ou houver pedido
   explicito do usuario.

## Relatorio de Endpoints & Campos

A consolidação autorizada de 11/09/2026 está em [relatorio-endpoints-campos.md](../../relatorio-endpoints-campos.md). Cobre plataforma/cadastros, configurações, EAV/guias, contratos/importação/agendas, financeiro, sinistros, pós-venda e comercial, com inventário de 68 tabelas/1.164 colunas do DBML v3.1.

As rotas descritas são propostas de implementação, salvo a seção que identifica a API HTTP existente. Este hand-off não certifica backend pronto. Os arquivos de `.codex/artefatos/endpoints` são históricos; notas antigas de “consolidar futuramente” nos microplanos foram atendidas por esta rodada e permanecem como contexto da época.

## Estado atual do projeto

**Primeira versão do frontend funcionalmente entregue; fechamento documental de 11/09/2026 registrado no [aceite](../../aceite-frontend-v1-2026-09-11.md).** Código de referência: `6059e829da9793d2d7ff584e4ef24ab711ba39c2`.

- Fases 0–4 concluídas no escopo front/mock: cadastros, perfis/permissões, configurações/funis, EAV/guias, contratos/documentos, importação/cadastro manual, itens/coberturas, agendas, financeiro, sinistros e pós-venda.
- Financeiro 3.1–3.6 e 3.4R-A concluídos; sinistros e pós-venda usam apólice como origem. Cobrança usa parcela. Processos canônicos derivam funil por etapa.
- Comercial 6.2–6.5R e finalização de setembro concluídos: pedido por versão, execuções por seguradora, resultados, registro manual, seleção de até cinco cotações, apresentação/PDF e origem da proposta por cadastro manual ou importação.
- Tipagem alinhada estruturalmente ao DBML v3.1: 67 tabelas no frontend, zero colunas ausentes/extras e zero divergências de nulabilidade no inventário. `integracao_logs` é técnico de backend.
- Emissão como módulo separado e `user_roles/app_role` aposentados. `metadata` de negócio removido do contrato aplicado; DTOs remotos legados são traduzidos na fronteira HTTP.
- Guias transversais preservam autoria humana, auditoria técnica e valores personalizados separados; anexos e integrações reais têm dependências de serviço explicitadas no hand-off.

## Painel executivo para as proximas sessoes

Atualizado em **11/09/2026**. Este painel substitui o resumo de julho; os detalhes datados abaixo preservam o histórico de cada fase.

### Situação de entrega

Construção principal do frontend encerrada no escopo da primeira versão. Hand-off consolidado e aceite de escopo documentado; não significa homologação operacional do sistema integrado. Evidências de código reaproveitadas: 304 testes, TypeScript/build e jornadas de navegador da última publicação. Novas alterações exigem validação proporcional ao risco.

### Ordem recomendada a partir daqui

1. Usar o relatório consolidado e o par DBML/instruções v3.1 para o alinhamento com a equipe de backend.
2. Abrir recortes próprios para integração e homologação de cada módulo quando houver API concreta; não implementar backend neste repositório.
3. Tratar correções e melhorias de UX, desempenho e lint como manutenção/evolução, com microplano quando funcional.
4. Retomar os itens adiados apenas por decisão explícita de produto; não escolher 6.6 como próxima implementação automática.

### Itens estacionados deliberadamente

- `3.4R-B`: mesa de exceções/retomada, condicional a feedback de uso.
- `5.1–5.4`: dashboards reais, visão de grupo, cliente cruzado e relatórios SaaS, adiados para preparação comercial.
- `6.6`: Agger/Aggilizador, condicionado à API/backend concretos.
- `G9`: Central Técnica e Suporte, sem execução autorizada nesta entrega.
- Busca em portais, credenciais de seguradoras, scraping/robôs, fila durável, storage/antivírus/retenção, OCR/parser homologado, anexo real de baixa e envio externo de mensagens dependem de frentes próprias/backend.

### Como iniciar uma nova sessao

1. Ler este painel, o aceite e as limitações de integração da seção 7 do hand-off.
2. Confirmar contrato vigente e escopo autorizado; criar microplano para mudanças funcionais.
3. Não reabrir funcionalidades pela simples presença de critérios históricos ou versões antigas em planos encerrados.
4. Preservar backlog adiado e atualizar este painel quando houver nova decisão de produto.

## Ordem executiva histórica — sequência já executada no núcleo

Decisao apos diagnostico V1/V2: priorizar o **core de gestao** antes do comercial
avancado.

Sequência histórica usada na construção (não é fila vigente de novas tarefas):

1. Fundacao restante: catalogos essenciais e funis.
2. Infra transversal: campos personalizados e guias polimorficas.
3. Eixo contratual inicial: painel real e shell do detalhe da apolice.
4. Importacao assistida de documentos oficiais alimentando o painel real.
5. Completar a Fase 2 com itens/coberturas, agendas contratuais, documentos
   derivados e aposentadoria de Emissao como modulo proprio.
6. Financeiro securitario para baixa, conciliacao, pagamento e cobranca.
7. Sinistros e pos-venda sobre apolice.
8. Dashboards, visao de grupo e relatorios futuros do SaaS.
9. Comercial avancado, coberturas cotadas, multi-calculo, cotacoes e integracoes
   futuras com Agger/seguradoras quando houver projeto de API concreto.

O comercial básico e o multicálculo foram concluídos após o núcleo operacional.
A integração Agger continua adiada; o painel executivo acima define o estado vigente.

Ficam fora do roadmap atual: contas a pagar/receber empresariais, fluxo de caixa,
tesouraria, busca automatica de parcelas atrasadas, fila automatica de documentos
dos portais das seguradoras, modulo generico de monitoramento de integracoes,
WhatsApp, e-mail e IA. Relatorios operacionais para o SaaS ficam mapeados como
futuro de baixa prioridade, pois o uso inicial tera acesso direto ao banco.

---

## Fase 0 — Fundacao ja iniciada: plataforma e cadastros base

- [x] 0.1 **Multi-corretora**
  - Relatorio historico: `.codex/artefatos/endpoints/0.1-plataforma-corretoras.md`
  - Inclui `filiais`, seletor de corretora ativa, `profile_filiais`, `perfis`,
    `role_permissions` e autoria de perfis/permissoes no front.
  - Backend deve aplicar RLS/RBAC; front apenas simula/autora.

- [x] 0.2 **Produtores**
  - Relatorio historico: `.codex/artefatos/endpoints/0.2-produtores.md`
  - Produtor interno com `profile_id`; produtor externo sem login.
  - Usado por Segurados e futuro Financeiro/Repasses.

- [x] 0.3 **Segurados reconciliado**
  - Relatorio historico: `.codex/artefatos/endpoints/0.3-segurados.md`
  - Cadastro PF/PJ qualificado por corretora; `pessoa_contato`; produtor/gerente;
    LGPD; lead sem documento fica em Oportunidades, nao em `segurados`.

- [x] 0.4a **Ramos reconciliados**
  - Atualizar Ramos em Configuracoes para refletir o DBML: categoria do risco
    (`risk_type`) fixa no codigo, `is_monthly` e ramo comercial cadastravel.
  - Nao incluir coberturas nesta etapa.
  - Hand-off absorvido pelo relatorio raiz em G8, autorizado em 2026-07-08.

- [x] 0.4b **Catalogos auxiliares**
  - Micro-plano: `.codex/plans/micro-plano-0.4b-catalogos-auxiliares.md`
  - Seguradoras, origens e motivos de perda revisados como catalogos do grupo,
    com filtros/validacoes necessarios.
  - Hand-off absorvido pelo relatorio raiz em G8, autorizado em 2026-07-08.

- [x] 0.5 **Funis & Etapas reconciliados**
  - Micro-plano: `.codex/plans/micro-plano-0.5-funis-etapas-reconciliados.md`
  - `pipelines.filial_id` nullable: `NULL` = modelo do grupo; preenchido =
    funil da corretora.
  - `entidade_tipo`/modulo oficial aplicado em `database.ts`, mock e hooks.
  - Pos-venda ficou fora dos criterios deste recorte; o modulo permanece no
    produto e sera reconciliado sobre `apolices` na Fase 4.2.
  - Fechado em 2026-07-07: validado com vitest focado, TypeScript e comparacao
    mecanica de `pipelines`/`pipeline_stages` contra o DBML v2.0.

## Fase 1 — Infra transversal reutilizavel

- [x] 1.1 **Campos personalizados EAV tipado**
  - Micro-plano: `.codex/plans/micro-plano-1.1-campos-personalizados-eav-tipado.md`
  - Definicao em Configuracoes: `campo_definicoes`, `campo_opcoes`.
  - Decisao UX 2026-07-08: Configuracoes deve ter tela/formulario unico de
    campo personalizado; opcoes de lista aparecem no proprio formulario.
  - Preenchimento nas telas operacionais: `campo_valores`,
    `campo_valor_opcoes`.
  - O usuario final apenas preenche valores; gestao define campos, modulo, tipo,
    obrigatoriedade, ordem e opcoes.
  - Primeiro corte funcional concluido em 2026-07-08: Configuracoes autorando
    campo em tela unica e Segurado preenchendo valores por `entidade_tipo +
    entidade_id`.
  - Notas de hand-off preservadas no micro-plano para consolidacao final do
    Relatorio de Endpoints & Campos.

- [x] 1.2a **Guias transversais polimorficas**
  - Micro-plano: `.codex/plans/micro-plano-1.2a-1.2b-guias-transversais-atividades-anexos.md`
  - Planejamento aberto em 2026-07-08 junto com 1.2b, apos conclusao da 1.1.
  - Substituir estado de sessao por contrato/mocks baseados em
    `entidade_tipo + entidade_id`.
  - Para Segurado Joao: `entidade_tipo = 'segurado'` e `entidade_id = id-do-joao`.
  - Para Proposta X: `entidade_tipo = 'proposta'` e `entidade_id = id-da-proposta`.
  - Fechado em 2026-07-08: `EntidadeTipo`/`EntidadeContexto` centralizados e
    guias do detalhe de Segurado lendo/escrevendo por
    `entidade_tipo + entidade_id` no mock.

- [x] 1.2b **Atividades, observacoes, mencoes e anexos**
  - Micro-plano: `.codex/plans/micro-plano-1.2a-1.2b-guias-transversais-atividades-anexos.md`
  - Planejamento aberto em 2026-07-08 junto com 1.2a, sem execucao de frontend
    neste ciclo.
  - `atividades`: tarefas, notas, follow-ups e historico humano.
  - `atividade_mencoes`: mencoes `@usuario` normalizadas.
  - `anexos`: documentos/fotos por entidade polimorfica.
  - Fechado em 2026-07-08: `atividades`, `atividade_mencoes` e `anexos`
    reconciliados no `database.ts`/mock; Observacoes com campo sempre aberto,
    botao `Enviar`, autoria e cards compactos; Anexos grava metadados; logs
    demonstrativos derivam de tarefas, observacoes e anexos sem gravar
    `audit_logs`.

- [x] 1.2c **Timeline unificada**
  - Micro-plano: `.codex/plans/micro-plano-1.2c-timeline-unificada.md`
  - Planejamento aberto em 2026-07-08 apos conclusao da 1.2a/1.2b.
  - `audit_logs` permanece separado e tecnico.
  - `vw_timeline` une atividades + audit logs na leitura.
  - UI default: atividades/notas; toggle para todos os eventos quando permitido.
  - Fechado em 2026-07-08: `audit_logs` reconciliado no front/mock e timeline
    unificada consumida pela guia "Anexos e logs", com toggle para logs
    tecnicos.
  - Drift residual: hooks administrativos legados ainda escrevem `audit_logs`
    com payload antigo e devem ser reconciliados em recorte proprio.

- [x] 1.2d **Mencoes e notificacoes**
  - Micro-plano: `.codex/plans/micro-plano-1.2d-mencoes-notificacoes.md`
  - Planejamento aberto em 2026-07-08 junto com 1.2c, sem execucao de frontend
    neste ciclo.
  - Autocomplete de usuarios/perfis ao digitar `@` em observacoes/notas.
  - Persistir mencoes resolvidas em `atividade_mencoes`.
  - Sino no header com contador de mencoes/notificacoes nao lidas.
  - Dropdown do sino com as notificacoes recentes e navegacao para o registro de
    origem, preferencialmente abrindo a aba Observacoes.
  - Pagina `/notificacoes` com lista completa, filtros basicos e acao
    de marcar como lida/nao lida.
  - Acoes de marcar como lida e marcar todas como lidas.
  - Backend futuro responde por notificacoes reais, leitura por usuario, RLS/RBAC
    e entrega de eventos; front valida o fluxo contra mock em memoria.
  - Fechado em 2026-07-08: autocomplete de mencoes em Observacoes, notificacoes
    derivadas de `atividade_mencoes`, sino no header e pagina `/notificacoes`.

O hand-off de 1.1 e 1.2a-1.2d fica deliberadamente adiado para a consolidacao
final do Relatorio de Endpoints & Campos, conforme decisao de 2026-07-10.

## Fase 2 — Eixo contratual: apolice, proposta e item

Esta fase vira o marco estrutural obrigatorio antes de Financeiro e Sinistros
reais. Ao final da Fase 2, a pagina unica da apolice deve representar o contrato
completo, e nao somente sua capa documental.

Revisao de fronteira aprovada em 2026-07-11:

- tudo que compoe, explica ou nasce com o contrato pertence a Fase 2: apolice,
  documentos, itens segurados, coberturas, parcelas do segurado, agenda de
  comissoes e agenda de repasses;
- a Fase 2 aplica os moldes configurados em `recebimento_grades` e
  `repasse_regras` no momento correto do ciclo contratual e materializa os fatos
  em `parcelas`, `comissoes` e `repasses`;
- a Fase 3 nao cria a composicao do contrato. Ela fornece o modulo financeiro
  para operar sobre fatos ja materializados: baixa, conciliacao, pagamento,
  estorno, cobranca, tratamento de divergencias e operacoes em lote;
- a mesma entidade pode aparecer nas duas fases sem duplicacao: na Fase 2, em
  contexto da apolice/proposta; na Fase 3, em filas e rotinas financeiras
  transversais a varias apolices.
- vinculo com a apolice nao transforma todo modulo relacionado em parte da Fase
  2: Sinistros e Pos-venda continuam com ciclo operacional proprio na Fase 4;
  a pagina contratual pode oferecer resumo/link, mas nao duplica seus fluxos.

Arquitetura final da pagina da apolice na Fase 2, sem rolagem horizontal:

- quatro guias especificas do contrato: `Visao geral`, `Itens segurados`,
  `Parcelas e comissoes` e `Repasses`;
- quatro guias transversais identicas as da Fase 1: `Tarefas`,
  `Campos personalizados`, `Anexos e logs` e `Observacoes`;
- `Visao geral` concentra capa contratual, documento selecionado e historico;
- `Itens segurados` absorve tambem as coberturas de cada risco;
- `Parcelas e comissoes` exibe lado a lado duas agendas diferentes, sem fundi-las;
- `Repasses` permanece separado porque representa despesa e beneficiarios, nao
  receita da corretora;
- PDF e imagem do documento continuam em `Anexos e logs`, nao em guia propria.

Plano transversal da fase:
`.codex/plans/micro-plano-fase-2-completude-contratual.md`.

Regra transversal fechada em 2026-07-10 apos revisao SegFy/Quiver:

- `apolices.status` representa somente a vida contratual; `propostas.stage_id`
  representa a tramitacao do documento.
- Endosso em andamento nao cria `ENDOSSADA` no status persistido. A apolice
  permanece `VIGENTE` e o Painel deriva a situacao operacional
  `Endosso em tramitacao` ou `Documento do endosso pendente`.
- Mover proposta/endosso para stage `Emitida` nao altera a apolice. Somente a
  importacao/registro do documento oficial, com numero e datas coerentes, aplica
  a transicao contratual e os efeitos do documento.
- Item fica ancorado em `apolice_itens`. Inclusao/exclusao/substituicao e
  versionamento de cobertura carimbam a proposta/endosso responsavel e preservam
  o historico.

Revisao geral da pagina aprovada para planejamento em 2026-07-11:

- executar 2.2f antes de retomar a importacao 2.3, por pedido explicito do
  usuario, sem alterar a conclusao historica de 2.1/2.2/2.4/2.5;
- reduzir o cabecalho ao numero da apolice e dados essenciais do segurado, com
  link para abrir o segurado em nova aba;
- mover seguradora, ramo, produtor, status, vigencia e premios para a guia
  `Visao geral`;
- manter leitura por padrao e adicionar edicao inline auditada separadamente
  para `apolices` e `propostas`;
- renderizar campos documentais por tipo, incluindo subtipo de endosso e motivo
  de cancelamento;
- manter `stage_id` no contrato, mas mostrar Etapa somente durante
  tramitacao/recusa;
- versionar o contrato para remover `data_efeito`, `premio_adicional` e
  `premio_restituicao`; `vigencia_inicio` passa a marcar o inicio dos efeitos do
  documento e premio total/liquido preserva sinal negativo para restituicao;
- antecipar em 2.2f somente contrato, seeds, leitura e selecao dos catalogos de
  subtipo/motivo; o CRUD administrativo e a criacao de documentos permanecem em
  2.7.

- [x] 2.1 **Painel Propostas/Apolices real**
  - Micro-plano: `.codex/plans/micro-plano-2.1-painel-propostas-apolices-real.md`
  - Concluido em 2026-07-11: `database.ts`/`inMemoryDb` normalizados e
    `PropostasContext` mantido somente como projecao derivada de leitura.
  - Reconstruir o Painel sobre `apolices` + `propostas`.
  - Aposentar gradualmente `PropostasContext` achatado.
  - Separar contrato (`apolices`) de documento (`propostas`).
  - Criar a base minima de tipos/mock para que o painel seja a superficie
    alimentada por criacao manual, detalhe e importacao.

- [x] 2.1.1 **Arvore de apolices e documentos vinculados**
  - Micro-plano:
    `.codex/plans/micro-plano-2.1.1-arvore-apolices-documentos.md`.
  - Substituir a lista plana transitoria por uma linha principal por apolice,
    com propostas/documentos filhos expansíveis.
  - Preservar a lista plana somente na perspectiva documental e no Kanban.
  - Exibir no filho resumo proprio conforme o tipo de endosso, sem limitar a
    leitura ao caso de substituicao de veiculo.
  - Preparar a acao `ArrowUpRight` do documento para a rota real da 2.2, sem
    criar link quebrado nem antecipar a tela de detalhe.
  - Revisao de 2026-07-11: a 2.2 restaura uma coluna compacta `Acoes`. Chevron
    fica exclusivo para expansao; a linha principal e os filhos abrem a mesma
    pagina da apolice, ja selecionando o documento vigente ou o filho clicado.
  - Sublinha deve usar fundo neutro, indentacao e menor peso visual para nao se
    confundir com a proxima linha principal.
  - Em ramos faturaveis, manter a apolice como raiz e compactar as faturas por
    competencia, sem despejar todo o historico mensal na primeira expansao.
  - Concluido em 2026-07-10 sobre a ponte tipada existente: arvore de carteira,
    perspectiva documental plana, resumos por endosso e faturas compactas
    validados. A normalizacao restante de `database.ts` e `inMemoryDb` foi
    concluida no ciclo da 2.2, permitindo fechar a Fase 2.1.

- [x] 2.2 **Detalhe unico da apolice e seus documentos**
  - Micro-plano:
    `.codex/plans/micro-plano-2.2-detalhe-capa-proposta-apolice.md`.
  - Shell, navegacao, seletor documental e primeiro corte da `Visao geral`
    concluidos em 2026-07-11. A completude do modulo depende de 2.4 e 2.5.
  - Criar uma pagina unica em `/apolices/:id`; o parametro
    `?documento=:propostaId` seleciona emissao original, endosso, cancelamento ou
    fatura sem sair do contexto contratual.
  - Apolice: status, vigencia, numero, segurado, seguradora, ramo, produtor.
  - Proposta: tipo (`NOVA`, `RENOVACAO`, `ENDOSSO`, `CANCELAMENTO`, `FATURA`),
    stage de tramitacao, numeros oficiais, vigencia documental, premio total e
    liquido com sinal, forma de pagamento e quantidade de parcelas.
  - O primeiro corte priorizou a capa revisavel. A pagina e o shell definitivo
    que receberao as demais guias contratuais ainda nesta Fase 2.
  - Restaurar a coluna `Acoes`: linha principal abre o documento vigente; filhos
    abrem a mesma pagina no documento especifico.
  - Usar seletor horizontal/combobox no topo do conteudo, sem coluna lateral;
    agrupar e pesquisar faturas quando o volume justificar.
  - Preservar numeracao oficial `Endosso 0` quando vier da seguradora.
  - Chevron controla somente expansao inline. A rota de detalhe usa link real:
    clique comum na mesma guia; Ctrl/Cmd+clique ou botao do meio em nova guia,
    pelo comportamento nativo de um link sem `target`.
  - Antes de concluir 2.2, fechar a normalizacao de `database.ts`/`inMemoryDb`
    ainda pendente na 2.1.
  - Validado com TypeScript, lint focado, build, Vitest 64/64 e navegador em
    1440x900, sem overflow horizontal nem erros no console.

- [x] 2.2f **Revisao da Visao geral e edicao auditada**
  - Micro-plano:
    `.codex/plans/micro-plano-2.2f-revisao-visao-geral-edicao-auditada.md`.
  - Contrato v2.1 criado antes de alterar o front, preservando v2.0 como historico.
  - Simplificar cabecalho, campos documentais e premios.
  - Adicionar subtipo de endosso e motivo de cancelamento por catalogo.
  - Implementar edicao inline de apolice/documento com `audit_logs` por campo.
  - Reconciliar impactos em selectors, importacao 2.3, itens 2.4 e agendas 2.5.
  - Concluido em 2026-07-11: cabecalho compacto, leitura condicional, edicao
    auditada, catalogos, premios com sinal e reconciliacao de selectors/mocks.
    Validado localmente e na PR #38 (CI + CodeQL), mesclada em `main`.
  - Nao executou 2.3, 2.6, criacao de documentos 2.7 ou operacoes da Fase 3.

- [x] 2.3 **Importacao de propostas, apolices e endossos**
  - Micro-plano: `.codex/plans/micro-plano-2.3-importacao-documentos.md`
  - Observacao: este micro-plano ja existia como
    `.codex/plans/micro-plano-2a-importacao-documentos.md` e foi renumerado
    apos decisao de sequenciar Painel real e Detalhe/capa antes da importacao.
  - Concluido em 2026-07-11 no primeiro corte frontend/mock, em pagina dedicada
    `/propostas/importar` e sem modal, para permitir revisao prolongada do lote e
    permanencia na conclusao.
  - Fluxo em 4 etapas:
    1. carregamento de arquivos;
    2. de-para de corretora, seguradora, ramo e tipo de documento;
    3. revisao de percentual de comissao da corretora e produtor;
    4. conclusao da importacao.
  - Escopo fechado em documentos de seguro: propostas, apolices e endossos.
    Nao importar comissoes avulsas nem anexos avulsos.
  - Usar WassisFE e prints do SegFy como referencia de fluxo, mas reconstruir
    sobre o contrato v2.1: `apolices` = contrato, `propostas` = documento,
    `apolice_itens` = risco.
  - A importacao deve alimentar o Painel real e abrir/encaminhar para o detalhe
    do documento importado.
  - Primeiro corte deve simular extracao contra mock em memoria; backend, OCR,
    storage real e APIs reais ficam fora do repositorio.
  - Preservar no micro-plano as notas necessarias para a consolidacao final do
    Relatorio de Endpoints & Campos; nao atualizar o relatorio por tela.

- [x] 2.3.1 **Cadastro manual de proposta e apolice**
  - Micro-plano:
    `.codex/plans/micro-plano-2.3.1-cadastro-manual-proposta-apolice.md`.
  - Pendencia identificada em 2026-07-11: a 2.1 criou a base do Painel, mas o
    botao `Novo` permaneceu como placeholder sem fluxo funcional.
  - Transformar `Novo` em cadastro guiado de proposta original em tramitacao ou
    apolice original ja emitida, gravando `apolices` + `propostas` no mock.
  - Permitir selecionar ou cadastrar rapidamente o segurado e revisar documento,
    itens/coberturas, parcelas, comissoes e repasses antes da confirmacao.
  - Manter a importacao na 2.3 e renovacao, endosso, cancelamento, fatura e
    duplicacao na 2.7. OCR permanece responsabilidade exclusiva do backend e
    nao entra no frontend.
  - Usar SegFy e Quiver como referencia de fluxo e campos, reconstruindo sobre o
    contrato v2.1 e os componentes ja entregues em 2.2, 2.4 e 2.5.
  - Registrar as necessidades de backend no micro-plano; nao atualizar o
    Relatorio de Endpoints & Campos por esta tela.
  - Concluido em 2026-07-11: wizard em cinco etapas, proposta em tramitacao,
    apolice emitida, segurado rapido, riscos/coberturas, agendas contratuais,
    escrita transacional no mock e navegacao ao detalhe validados no navegador.

- [x] 2.4 **Itens segurados e coberturas importaveis**
  - Micro-plano:
    `.codex/plans/micro-plano-2.4-itens-segurados-coberturas.md`.
  - `apolice_itens` + especializacoes por `risk_type`:
    `item_veiculo`, `item_imovel`, `item_empresa`, `item_vida`.
  - Vida Global/PME conforme DBML.
  - Sem `proposta_itens`; item e identidade do risco no contrato.
  - Coberturas podem ser importadas quando a leitura do documento for confiavel;
    quando nao for, manter o PDF vinculado ao documento e deixar a cobertura para
    revisao manual/fase propria.
  - Alimentar a leitura `Antes x Depois` dos documentos filhos para todos os
    movimentos aplicaveis: inclusao, exclusao, alteracao, substituicao, mudanca
    de importancia segurada e inclusao/exclusao de clausulas ou coberturas.
  - Concluido em 2026-07-11: guia funcional com itens vigentes/historicos,
    especializacoes por `risk_type`, coberturas por item, documentos de
    inclusao/exclusao e substituicao real preservando o item anterior e o novo.

- [x] 2.5 **Parcelas, comissoes e repasses no contexto contratual**
  - Micro-plano:
    `.codex/plans/micro-plano-2.5-agendas-contratuais.md`.
  - Completar as guias especificas `Parcelas e comissoes` e `Repasses` na pagina
    unica da apolice.
  - `parcelas` representa a cobranca do segurado e permanece ancorada na
    proposta/documento selecionado.
  - `comissoes` representa a receita da corretora, com agenda propria por
    proposta; nao espelha automaticamente as parcelas do segurado.
  - `repasses` representa a despesa com produtores/gerentes, com agenda e
    beneficiarios proprios; permanece em guia separada.
  - Aplicar `recebimento_grades` para materializar a agenda de comissoes e
    `repasse_regras` para materializar repasses como snapshots no ciclo de
    emissao/importacao do documento.
  - Mostrar origem do molde/regra, valores previstos, competencias, datas,
    beneficiarios e status atuais sem transformar a pagina da apolice em fila
    financeira.
  - Alterar grade ou regra nunca reescreve fatos ja materializados.
  - Baixa, conciliacao por extrato, pagamento, estorno, cobranca e operacao em
    lote permanecem na Fase 3.
  - Concluido em 2026-07-11: agendas materializadas de forma idempotente no mock,
    grade/regra rastreaveis, leitura por documento ou consolidado e oito guias
    sem overflow, sem antecipar operacoes financeiras da Fase 3.

- [x] 2.6 **Emissao como tramitacao da proposta**
  - Micro-plano:
    `.codex/plans/micro-plano-2.6-emissao-como-tramitacao-proposta.md`.
  - Planejamento concluido em 2026-07-11 e execucao concluida em 2026-07-12.
  - Remover Emissao como modulo/rota propria depois que o Painel real estiver
    funcional.
  - Acompanhamento de emissao fica no Painel por `propostas.stage_id`.
  - `/emissoes`, tabela mock `emissoes`, adapter e detalhe viram legado a
    aposentar.
  - Concluido: sidebar e implementacao legada removidas; rotas antigas
    redirecionam ao Kanban do Painel; recusa tipada preserva historico; contrato
    aplicado e mock nao possuem mais `emissoes`. Validado com TypeScript, ESLint,
    Vitest 86/86, build e navegador em 1440x900 sem overflow ou erros no console.

- [x] 2.7 **Renovacao e documentos derivados**
  - Micro-plano:
    `.codex/plans/micro-plano-2.7-renovacao-documentos-derivados.md`.
  - Planejamento e execucao concluidos em 2026-07-12, depois da 2.6, preservando
    uma unica fila de tramitacao.
  - Renovacao = nova oportunidade/apolice com `renovada_de_id`.
  - Endosso, cancelamento e fatura = novas linhas em `propostas`.
  - Reutilizar os catalogos de subtipos de endosso e motivos de cancelamento
    definidos em 2.2f; implementar aqui o CRUD administrativo completo e os
    fluxos de criacao dos documentos, sem permitir que um label configuravel
    altere sozinho a semantica contratual.
  - Cadastrar/registrar faturas por competencia nos ramos `is_monthly`; cada
    fatura pode materializar suas proprias parcelas, comissoes e repasses no
    contexto contratual da Fase 2.
  - A operacao financeira posterior desses fatos permanece na Fase 3.
  - Entregue: renovacao por oportunidade e apolice sucessora, cadeia navegavel,
    nao renovacao explicita, documentos derivados, efeitos contratuais
    atomicos, catalogos administrativos e restricao de fatura por ramo mensal.
  - Validado com TypeScript, ESLint focado, Vitest 100/100, build e navegador em
    desktop/dark mode sem overflow ou erros no console. O lint global permanece
    com divida legada fora do recorte.
  - Refinamento de 2026-07-13 ampliou a massa do Painel com quatro apolices
    simples emitidas, duas vigencias proximas e uma renovacao em tramitacao;
    o card de renovacoes pendentes agora deriva do documento `RENOVACAO`.

- [x] 2.8 **Edicao produtiva das guias contratuais**
  - Micro-plano:
    `.codex/plans/micro-plano-2.8-edicao-guias-contratuais.md`.
  - Pedido aberto em 2026-07-13 para retirar o modo somente leitura de
    `Itens segurados`, `Parcelas e comissoes` e `Repasses`.
  - Itens/coberturas devem preservar movimentos e versoes por documento, sem
    apagar historico.
  - Parcelas, comissoes e repasses devem permitir criacao, edicao e exclusao
    logica, com selecao multipla, `Alterar selecionados` e
    `Excluir selecionados` em uma unica confirmacao.
  - Comissoes devem distinguir somente `NORMAL`, `AGENCIAMENTO`, `VITALICIA`,
    `ADICIONAL` e `RESTITUICAO`; nao criar outras categorias por analogia com
    SegFy ou Quiver.
  - Antes de implementar o editor de comissoes, versionar DBML e instrucoes em
    conjunto para incluir `propostas.agenciamento_pct`,
    `recebimento_grade_parcelas.tipo_comissao` e
    `comissoes.tipo_comissao`; `propostas.comissao_pct` ja existe no v2.1.
  - Nao ampliar `item_veiculo` com campos legados observados no SegFy/Quiver;
    os formularios de item permanecem limitados ao esqueleto vigente.
  - Fatos pagos/recebidos/baixados permanecem protegidos e dependem das
    reversoes da Fase 3; toda mutacao e auditada.
  - Concluido em 2026-07-13: DBML/instrucoes v2.2 e `database.ts` alinhados;
    itens/coberturas editaveis e versionados; parcelas, comissoes e repasses com
    criacao, edicao individual, selecao multipla, previa e exclusao logica com
    motivo; grade e fatos distinguem os cinco tipos canonicos de comissao.
  - Validado com TypeScript, ESLint focado, Vitest 109/109, build e navegador em
    desktop/dark mode sem overflow ou erros no console. O lint global permanece
    com divida legada fora do recorte.

- [x] 2.9a **Fechamento das grades de recebimento**
  - Micro-plano:
    `.codex/plans/micro-plano-2.9a-fechamento-grades-recebimento.md`.
  - Reconciliar e fechar o cadastro ja existente em Configuracoes; nao criar
    uma segunda superficie administrativa.
  - Validar integridade, compatibilidade por seguradora/ramo, simulacao e os
    cinco tipos canonicos de grade e de comissao.
  - Grades permanecem moldes; regras de repasse permanecem tabela de decisao
    separada e nenhum fato contratual e materializado neste recorte.
  - Concluido em 2026-07-13 com validacao/compatibilidade centralizada,
    simulacao sem persistencia e duplicacao produtiva de grades.

- [x] 2.9b **Geracao consolidada das agendas contratuais**
  - Micro-plano:
    `.codex/plans/micro-plano-2.9b-geracao-consolidada-agendas.md`.
  - Aplicar a grade real de Configuracoes e as regras de repasse para gerar, em
    uma unica operacao, parcelas, comissoes e repasses aplicaveis.
  - Manter os tres fatos e suas leituras separados, com previa unica, geracao
    atomica/idempotente e tratamento coletivo de agendas parciais.
  - Caso de aceite obrigatorio: proposta Rafael com 10 parcelas deve gerar 1 a
    10, a grade completa de recebimento da corretora e os repasses aplicaveis,
    sem duplicar a parcela 10 existente.
  - Baixa, conciliacao, pagamento, estorno e cobranca continuam na Fase 3.
  - Concluido em 2026-07-13: assistente consolidado, previa pura, aplicacao
    atomica/auditada e correcao coletiva; Rafael validado com 10 parcelas, 3
    comissoes e 3 repasses ativos.

Fechamento historico da Fase 2 em 2026-07-12: os recortes 2.1 a 2.7 foram
concluidos e o eixo contratual ficou funcionalmente estabilizado. Em 2026-07-13,
a fase foi reaberta pelo recorte 2.8 para adicionar autoria produtiva nas tres
guias e novamente pelos recortes 2.9a/2.9b para fechar os moldes e a geracao
consolidada das agendas. Esses recortes foram concluidos em 2026-07-13, com
TypeScript, ESLint focado, 113 testes, build e navegador validados. A
consolidacao do Relatorio de Endpoints & Campos
continua reservada para depois desses ajustes, antes do hand-off ao backend.

## Fase 3 — Financeiro securitario

Depende do eixo contratual da Fase 2. Recebe `parcelas`, `comissoes` e `repasses`
ja materializados pelo ciclo da apolice/proposta e os transforma em filas e
operacoes financeiras.

Plano transversal da fase:
`.codex/plans/micro-plano-fase-3-financeiro-securitario.md`.

Escopo fechado: este modulo controla fatos financeiros do seguro. Nao inclui
contas a pagar/receber da empresa, despesas administrativas, fluxo de caixa,
contas bancarias, tesouraria, conciliacao bancaria ou contabilidade.

Arquitetura operacional aprovada em 2026-07-13 e refinada em 2026-07-14:

- manter uma unica opcao `Financeiro` no menu lateral, apontando para
  `/financeiro`; nao criar uma segunda entrada de menu para a Fase 3;
- reconstruir `/financeiro` como um cockpit unico, denso e operacional, com
  navegacao interna entre `Parcelas`, `Comissoes`, `Repasses` e `Cobrancas`;
- manter o kanban exclusivamente na visao `Cobrancas`, para acompanhamento de
  inadimplentes e follow-up. Parcelas, comissoes e repasses usam listas/tabelas
  operacionais, filtros e acoes individuais ou em lote;
- refatorar a superficie legada no lugar. Nao manter um Financeiro novo em
  paralelo com o kanban antigo; a rota atual passa a hospedar o cockpit e o
  kanban existente e reconciliado como uma de suas visoes;
- o detalhe de cobranca reutiliza as guias transversais de `cobranca` quando
  aplicavel: `Tarefas`, `Campos personalizados`, `Anexos e logs` e
  `Observacoes`.

Regras transversais da fase:

- a Fase 3 nao cria a composicao original de parcela, comissao ou repasse. Ela
  opera fatos materializados na Fase 2;
- comissao `ADICIONAL`, `RESTITUICAO` e repasse manual de co-producao nascem no
  contexto contratual da Fase 2; a Fase 3 apenas baixa, concilia, libera, paga,
  estorna ou reverte esses fatos conforme seu ciclo;
- toda mudanca financeira deve ser auditada com usuario, data/hora, origem,
  valores anterior/novo e motivo quando houver reversao, divergencia,
  cancelamento ou estorno;
- operacoes em lote devem ser atomicas quando a regra exigir tudo-ou-nada, ou
  devolver resultado item a item sem esconder falhas. Reprocessamentos devem ser
  idempotentes e nunca duplicar baixa;
- nenhum dado de negocio novo pode voltar para `metadata` JSON. Acesso por
  grupo/corretora deriva do eixo proposta/apolice e o backend futuro aplica o
  enforcement de autorizacao;
- os status e transicoes de `parcelas`, `comissoes`, `repasses` e
  `financeiro_cobrancas` devem ser tipados no front e aderentes ao DBML vigente;
- a baixa de comissao deve oferecer dois modos obrigatorios sobre o mesmo
  dominio de extrato/itens: `Baixa manual` e `Importar PDF/Excel`;
- no modo automatico, o operador fornece o arquivo e o sistema faz leitura,
  extracao e conciliacao assistida. Isso nao se confunde com acessar ou baixar
  arquivos automaticamente nos portais das seguradoras;
- cada layout automatico e especifico por seguradora/formato e deve ter parser
  identificado/versionado. Arquivo ou layout nao reconhecido segue para baixa
  manual, sem baixa silenciosa nem perda do arquivo original;
- desfazer uma baixa de comissao precisa reconciliar os repasses vinculados: se
  houver repasse pago, a reversao da comissao fica bloqueada ate o repasse ser
  revertido; repasse apenas liberado pode voltar ao estado previsto de forma
  auditada.

Regra contratual registrada em 2026-07-13 para materializacao na Fase 2 e
operacao posterior na Fase 3:

- a proposta deve persistir separadamente `% comissao` em `comissao_pct` e
  `% agenciamento` em `agenciamento_pct`;
- o cadastro/revisao da proposta deve exibir os dois campos; `% agenciamento`
  fica condicionado aos ramos em que se aplica, especialmente Saude e Vida,
  sem ser inferido de observacoes ou do nome da grade;
- a grade de recebimento deve tipar cada linha somente como `NORMAL`,
  `AGENCIAMENTO`, `VITALICIA`, `ADICIONAL` ou `RESTITUICAO`, e o fato gerado em
  `comissoes` deve carregar o mesmo tipo como snapshot editavel;
- linhas de agenciamento usam a distribuicao explicita da grade e devem fechar
  o total informado em `propostas.agenciamento_pct`; linhas normais ou
  vitalicias com percentual nao informado na grade usam
  `propostas.comissao_pct`;
- exemplo canonico de Saude: proposta com `agenciamento_pct = 300` e
  `comissao_pct = 2`; a grade gera os tres primeiros eventos como
  `AGENCIAMENTO` a `100%` cada e, a partir do quarto, eventos `VITALICIA` a
  `2%`;
- alterar o cadastro da grade nao reescreve comissoes ja materializadas. A
  materializacao continua no ciclo contratual; a Fase 3 opera baixa e
  conciliacao inclusive sobre fatos ja gerados dos tipos `ADICIONAL` e
  `RESTITUICAO`.

Revisao de 2026-07-11, refinada em 2026-07-13: a antiga aplicacao das grades de
recebimento (3.1) e das regras de repasse (3.2) saiu da Fase 3, pois materializar
essas agendas faz parte da composicao do documento/contrato. O recorte 2.5
entregou a leitura contextual; 2.9a fecha os moldes e 2.9b fecha a geracao
consolidada. Revisao cronologica de 2026-07-14: como os antigos recortes 3.1 e
3.2 foram absorvidos pela Fase 2, os recortes ativos da Fase 3 foram renumerados
em sequencia continua de 3.1 a 3.6. Numeracoes anteriores permanecem apenas em
documentos explicitamente historicos.

- [x] 3.1 **Parcelas do seguro**
  - Micro-plano executavel:
    `.codex/plans/micro-plano-3.1-parcelas-seguro.md`.
  - `parcelas` como cobranca do segurado, penduradas em `propostas`.
  - Primeiro recorte da fase: reconstruir a casca de `/financeiro` como cockpit
    unico e entregar a visao operacional `Parcelas`.
  - A agenda nasce e e consultavel na Fase 2; aqui entram confirmacao manual de
    pagamento, desfazimento, vencimento, cancelamento/estorno financeiro e
    operacoes em lote auditadas.
  - Permitir filtros por corretora, segurado, seguradora, ramo, proposta/apolice,
    vencimento e status, preservando acesso rapido ao documento de origem.
  - Parcela vencida alimenta a abertura e o acompanhamento da cobranca em 3.6;
    o kanban de inadimplencia nao fica duplicado dentro da visao de parcelas.

- [x] 3.2 **Contrato de extratos e conciliacao**
  - Micro-plano executavel:
    `.codex/plans/micro-plano-3.2-contrato-extratos-conciliacao.md`.
  - Concluido em 2026-07-14 com o par contratual v2.3: cria
    `comissao_extratos`, `comissao_extrato_itens`, `comissao_conciliacoes` e
    `comissao_conciliacao_ocorrencias`, sem JSON de negocio.
  - Item de extrato e comissao formam N:N pela entidade associativa, cobrindo
    1:1 exato, parcialidade e agregacao; o par item+comissao e unico.
  - Hash/chaves idempotentes impedem duplicidade por arquivo, item e associacao;
    ocorrencias preservam divergencias e resolucao auditavel.
  - Ingestao, normalizacao, associacao, conciliacao, ocorrencia e baixa ficam
    separadas. Conciliar nao altera recebimento/status da comissao.
  - `comissoes.extrato_numero` e `seguradora_lote` foram removidos do v2.3 e de
    `database.ts`; o v2.2 permanece como historico para migracao futura.
  - Snapshot de pagamento do favorecido de repasse permanece fora deste recorte
    e deve ser decidido em 3.5.

- [x] 3.3 **Comissoes e baixa manual**
  - Micro-plano executado e encerrado em 2026-07-15:
    `.codex/plans/micro-plano-3.3-comissoes-baixa-manual.md`.
  - `comissoes` como receita da corretora, com agenda propria por proposta.
  - A agenda prevista e sua leitura por apolice/documento pertencem a Fase 2;
    esta etapa entrega a lista operacional, filtros, conferencia e baixa manual.
  - Concluido com o par contratual v2.4: `comissao_baixas` registra eventos
    imutaveis e `comissao_baixa_conciliacoes` suporta N conciliacoes por baixa.
  - A baixa manual sem conciliacao cria origem/item/associacao `MANUAL`; quando
    existem conciliacoes confirmadas, consome-as sem duplicar o extrato.
  - O cockpit preserva previsto, bruto/liquido/descontos informados,
    conciliado, efetivamente recebido, saldo e diferenca; suporta baixa total,
    parcial, divergencia justificada, historico, idempotencia e estorno.
  - `PARCIAL` entrou no estado persistido da comissao. A baixa libera repasse
    `PREVISTO -> LIBERADO`; estorno total pode reabrir `LIBERADO -> PREVISTO` e
    fica bloqueado por repasse `PAGO`.
  - Validado com 24 testes financeiros focados, TypeScript, ESLint focado e
    fluxo real no navegador desktop. Upload/parser continua exclusivamente no
    3.4 e pagamento de repasses no 3.5.

- [x] 3.4 **Leitura automatica de PDF/Excel e conciliacao por extrato**
  - Micro-plano frontend concluido em 2026-07-15:
    `.codex/plans/micro-plano-3.4-leitura-automatica-extratos.md`.
  - Depende obrigatoriamente do contrato 3.2 versionado e refletido em
    `database.ts`/mock.
  - Aceitar extratos fornecidos pelo operador em PDF, XLS ou XLSX para layouts
    de seguradora explicitamente suportados.
  - Extrair automaticamente cabecalho e itens, apresentar previa editavel,
    conciliar e classificar cada item antes de qualquer baixa.
  - Comparar cada item do extrato com a comissao prevista. Item sem vinculo,
    documento/comissao nao encontrado, valor diferente, duplicidade, item ja
    baixado ou identificacao insuficiente vira uma ocorrencia explicita.
  - Arquivo protegido, corrompido, escaneado sem camada de texto ou com layout
    ainda nao suportado deve informar a causa e oferecer continuidade pela baixa
    manual. OCR nao pertence ao frontend; qualquer tratamento desse tipo e
    responsabilidade exclusiva do backend.
  - Permitir tratar o vinculo/dado da ocorrencia e reprocessar a conciliacao sem
    duplicar baixas.
  - Entregue em pagina dedicada `/financeiro/importar-demonstrativo`, aberta por
    `Comissoes`, com quatro etapas, fila independente por arquivo, previa
    editavel, associacao/ocorrencia tipadas, confirmacao idempotente e
    encaminhamento separado ao fluxo de baixa do 3.3. A pagina evita perda
    acidental do trabalho por fechamento de modal.
  - O frontend aceita PDF/XLS/XLSX e usa resposta mockada identificada; nenhum
    layout de seguradora e declarado homologado sem fixtures anonimizadas.
    Parser autoritativo e reconhecimento de imagem permanecem no backend.
  - Permitir baixa em lote somente dos itens conciliados e deixar divergencias
    fora do lote ate tratamento.
  - Preservar historico de importacoes, arquivo original, parser/versao, resumo
    do processamento e resultado da baixa.
  - Nao inclui login, scraping, robo ou download automatico nos portais das
    seguradoras; essa exclusao nao limita a leitura automatica dos arquivos
    enviados pelo operador.

- [x] 3.4R-A **Historico e conferencia de extratos — complemento pos-HAR**
  - Concluido em 2026-07-21 sem reabrir o core da Fase 3 nem alterar o contrato
    DBML v2.6.
  - Micro-plano:
    `.codex/plans/micro-plano-3.4R-A-historico-conferencia-extratos.md`.
  - Leitura operacional de `comissao_extratos`, itens, conciliacoes e ocorrencias
    entregue sobre a persistencia em memoria existente.
  - Cabecalho da previa concluido com referencia, periodo, datas, bruto, liquido,
    descontos, moeda e comparacao entre total informado e soma dos itens.
  - Lista e detalhe entregues em rotas internas do Financeiro, acessiveis a
    partir de `Comissoes`, sem nova entrada lateral.
  - Usar somente o contrato v2.6 vigente; qualquer coluna/enum novo exige revisao
    contratual antes da implementacao.
  - Excluir expressamente credenciais, scraping, robo, portal, conta corrente,
    fluxo de caixa, OCR, armazenamento real e download funcional.

- [ ] 3.4R-B **Mesa de excecoes e retomada — condicional**
  - Nao possui micro-plano executavel e nao deve ser iniciado antes da conclusao
    e avaliacao de uso do 3.4R-A.
  - Candidato futuro para fila concentrada de ocorrencias, correcoes,
    descartes, reprocessamento e contrato de retomada assincrona.
  - Persistencia depois de recarga, processamento em background, armazenamento
    e URL do original dependem do backend; nao simular como dado definitivo no
    frontend.
  - Se nao houver prioridade comprovada, manter pendente e seguir para 5.1.

- [x] 3.5 **Repasses e baixa em lote**
  - Micro-plano executado e encerrado em 2026-07-16:
    `.codex/plans/micro-plano-3.5-repasses-baixa-lote.md`.
  - `repasses` como despesa securitaria para produtores/gerentes.
  - A agenda e sua leitura no contrato pertencem a Fase 2; esta etapa controla
    liberacao, pagamento, desfazer baixa e operacoes em lote.
  - Consumir beneficiario/split ja materializados como linhas separadas. A
    criacao de repasse manual de co-producao continua na Fase 2 e nao altera
    `apolices.produtor_id`.
  - Respeitar a dependencia de `comissao_id`: baixa de comissao libera o repasse
    quando a regra exigir; reversao deve seguir a trava transversal da fase.
  - Relatorios PDF/Excel comuns sao somente leitura. A baixa integral ocorre
    apenas em `Emitir recibo e marcar como pago`, com checkbox explicito de
    confirmacao, recibo reemitivel e cancelamento auditavel.
  - Pagamento parcial, multiplos pagamentos e rateio financeiro ficam fora do
    MVP do recorte.
  - Concluido com o par contratual v2.5: `repasse_recibos` e
    `repasse_recibo_itens` preservam cabecalho, itens e snapshots auditaveis,
    idempotencia, autoria e cancelamento sem exclusao.
  - Cockpit `Repasses` integrado a `/financeiro`, com filtros operacionais,
    selecao individual/em lote, recibos separados por filial, beneficiario e
    sentido, consulta, reemissao e resultado por recibo.
  - `database.ts` e mock em memoria alinhados ao v2.5. Validado com TypeScript,
    ESLint focado, 170/170 testes, build e navegador desktop em 1280 x 720,
    zoom 100%, sem overflow global nem erros de console.
  - Checkpoint `cf2891f` criado na `Dev` em 2026-07-20.

- [x] 3.6 **Cobrancas securitarias**
  - Micro-plano concluido em 2026-07-20:
    `.codex/plans/micro-plano-3.6-cobrancas-securitarias.md`.
  - Reconciliar `financeiro_cobrancas` para apontar para `parcela_id`, nao
    `oportunidade_id`.
  - Preservar o kanban como ferramenta de acompanhamento de inadimplentes,
    dentro da visao `Cobrancas` do cockpit Financeiro.
  - Abrir cobranca a partir de parcela vencida e evitar mais de uma cobranca
    ativa equivalente para a mesma parcela; a constraint final deve ser fechada
    no micro-plano/contrato.
  - Controlar responsavel, etapa, prioridade, ultima/proxima cobranca, canal e
    status sem `metadata`, com link para parcela, documento, apolice e segurado.
  - Reutilizar as guias transversais oficiais de `entidade_tipo = cobranca`.
  - Controlar follow-up de parcela do seguro em atraso sem prometer consulta
    automatica aos portais das seguradoras.
  - Contrato v2.6 fechado com status `ATIVA | QUITADA | CANCELADA`, etapa
    independente, encerramento escalar e unicidade parcial de uma cobranca
    ativa por `parcela_id` como responsabilidade final do backend.
  - Legado por oportunidade/metadata substituido por dominio tipado no mock,
    adapter e hooks; abertura, manutencao, movimentacao, quitacao, cancelamento
    e reabertura auditadas.
  - Kanban entregue exclusivamente na visao `Cobrancas`, com detalhe, links
    para parcela/documento/apolice/segurado e as quatro guias transversais.
  - Validado com TypeScript, ESLint focado, 208/208 testes, build e navegador
    desktop em 1280 x 720, zoom 100%, sem overflow global nem erros de console.
  - Checkpoint local `15e3b10` criado na `Dev` em 2026-07-21; publicacao nao foi
    executada nesta rodada.

## Fase 4 — Sinistros e pos-venda sobre apolice

- [x] 4.1 **Sinistros sobre apolice**
  - Execucao iniciada em worktree/branch isoladas em 2026-07-15 e integrada na
    `Dev` em 2026-07-16, depois do checkpoint do Financeiro.
  - Primeiro recorte: `.codex/plans/micro-plano-4.1a-fundacao-sinistros-apolice.md`.
  - [x] `4.1a` fundacao contratual, kanban derivado por etapa e detalhe de
    leitura sobre apolice concluido em 2026-07-15.
  - [x] `4.1b` abertura e manutencao contratual concluida.
  - [x] `4.1b-I` abertura contratual essencial concluida e validada em
    2026-07-15: rota dedicada, selecao de apolice/item, envolvidos, auditoria e
    rollback atomico no mock.
  - [x] `4.1b-II` manutencao contratual, envolvidos atomicos, auditoria e escrita
    das quatro guias transversais concluidos e validados em 2026-07-15.
  - [x] `4.1c` fechamento operacional concluido, validado e integrado na `Dev`
    em 2026-07-20 pelo checkpoint `3f406bf` e merge `5838394`.
  - Micro-plano:
    `.codex/plans/micro-plano-4.1c-fechamento-operacional-sinistros.md`.
  - Micro-plano:
    `.codex/plans/micro-plano-4.1b-abertura-manutencao-sinistros.md`.
  - Encadeamento vigente: `4.1a` fundacao e leitura -> `4.1b-I` abertura
    contratual essencial -> `4.1b-II` manutencao e guias -> `4.1c` fechamento
    operacional.
  - `sinistros.apolice_id`.
  - `sinistro_envolvidos` para segurado/terceiro.
  - Terceiro fica fora de `segurados`, com campos descritivos proprios.
  - Nao criar `sinistro_auto`, `sinistro_vida` etc. agora; usar
    `sinistros + sinistro_envolvidos + campos personalizados/anexos` ate haver
    necessidade comprovada de especializacao.

- [x] 4.2 **Pos-venda sobre apolice**
  - Reconstruido como modulo proprio sobre `pos_vendas.apolice_id`, sem a
    ancoragem legada em `oportunidade_id`.
  - Onboarding do segurado e acompanhamento mensal de contratos elegiveis
    concluidos com pipelines, tarefas, observacoes, anexos e EAV tipado.
  - Micro-plano: `.codex/plans/micro-plano-4.2-pos-venda-sobre-apolice.md`.
  - Checkpoint `aa8645a` integrado na `Dev` em 2026-07-20 pelo merge `5838394`.
  - Validado com TypeScript, 193 testes, ESLint focado, build e navegador; o
    arraste HTML5 permanece coberto por dominio/testes devido a limitacao da
    automacao visual.
  - Regressao consolidada da integracao: TypeScript, 202 testes, ESLint focado,
    build e smoke no navegador de Financeiro, Sinistros e Pos-venda aprovados.

## Fase 5 — Dashboards, grupo e consolidacoes

Decisao de produto de 2026-07-21: fase adiada ate a preparacao comercial do
SaaS. No uso inicial de uma unica corretora, o acesso direto ao banco atende as
consultas gerenciais; os KPIs demonstrativos atuais nao devem ser tratados como
fonte gerencial autoritativa. Os itens permanecem pendentes, nao cancelados.

- [ ] 5.1 **Dashboards alinhados ao modelo real**
  - Substituir KPIs hardcoded por leituras sobre contratos, propostas, parcelas,
    comissoes, repasses e sinistros.

- [ ] 5.2 **Visao de grupo**
  - Consolida producao entre corretoras do mesmo grupo.
  - Preservar isolamento entre corretoras.

- [ ] 5.3 **Notificacao de cliente cruzado**
  - UI para mostrar apenas o fato de vinculo cruzado, conforme parametrizacao do
    grupo.
  - Backend implementa funcao privilegiada; front documenta contrato.

- [ ] 5.4 **Relatorios operacionais do SaaS — baixa prioridade**
  - Planejar no futuro relatorios de producao, renovacao, comissoes, repasses,
    sinistros e necessidades regulatorias/SUSEP.
  - Nao e prioridade do uso inicial, que tera acesso direto ao banco.
  - Abrir micro-planos somente depois do core, dos fatos financeiros e das
    consultas de backend estarem estabilizados.

## Fase 6 — Comercial avancado, coberturas e integracoes

- [x] Recorte de finalização frontend solicitado em 2026-09-10: revisão do multicalculo,
  apresentação com até cinco cotações, PDF e auditoria geral front × DBML v3.0.
  Micro-plano: `micro-plano-finalizacao-front-2026-09-10.md`.
  Escopo ampliado pelo usuário: cotação manual e ponte para proposta também
  pela importação existente, somente no frontend/mock.
  Concluído com TypeScript, testes, lint focado, build e fluxos no navegador.
  PDFs horizontal/vertical conferidos em todas as páginas. Revisão geral em
  `revisao-front-dbml-2026-09-10.md`: 57/68 tabelas compatíveis; drift de
  cadastros/plataforma e `calc_auto.chassi_remarcado` documentado para recorte
  próprio. A conclusão desta revisão não declara o banco integralmente alinhado.

Esta fase foi deliberadamente movida para depois do core de gestao. Oportunidades
basicas podem continuar funcionando antes disso.

- [x] 6.1 **Coberturas catalogo**
  - `coberturas_catalogo` por ramo foi concluido no front/mock em G8.4.
  - O CRUD/fundacao do catalogo esta concluido; a completude dos registros e o
    de-para com as chaves documentadas pela API Agger entram em 6.2–6.3.
  - O uso operacional das coberturas no contrato e na cotacao permanece em 6.2.

- [x] 6.2 **Coberturas contratadas/cotadas**
  - Fundacao concluida com 6.3 em 2026-07-21:
    `.codex/plans/micro-plano-6.2-6.3-fundacao-comercial-oportunidades-coberturas.md`.
  - `item_coberturas` no contrato.
  - `calculo_coberturas` na cotacao.
  - Versionamento por documento: excluir + incluir, nunca update destrutivo.
  - O lado contratado preserva autoria/versionamento funcional desde 2.8; o
    recorte completou o catalogo com de-para tipado da API Agger e manteve
    `calculo_coberturas` para a implementacao funcional de calculos em 6.4.

- [x] 6.3 **Oportunidades reconciliadas**
  - Micro-plano combinado com 6.2:
    `.codex/plans/micro-plano-6.2-6.3-fundacao-comercial-oportunidades-coberturas.md`.
  - Lead = `segurado_id` NULL com dados minimos.
  - Conversao para segurado qualificado.
  - Oportunidade exibe premio/comissao/seguradora como visao/resumo do que esta em
    jogo, mas dados oficiais ficam em calculos, cotacoes e propostas.
  - Direcao de UI: Visao geral + quatro guias transversais neste recorte;
    `Calculos` entra funcionalmente em 6.4 como a unica area do multi-calculo.
    As cotacoes entram aninhadas em cada calculo no 6.5, sem guia irma.
  - Concluido em 2026-07-21 com contrato v2.6, captura curta, qualificacao de
    lead, Kanban/lista reconciliados e cockpit transversal validado.

- [x] 6.4 **Calculos e especializacoes**
  - Micro-plano concluido e validado em 2026-07-21:
    `.codex/plans/micro-plano-6.4-calculos-especializacoes.md`.
  - `calculos` como versoes.
  - `calc_auto`, `calc_residencia`, `calc_condominio`, `calc_vida`,
    `calc_empresa`, `calc_diversos`.
  - A UI vive na guia unica `Calculos` dentro da oportunidade; cada versao
    agrupa perfil, risco, coberturas e, quando 6.5 entrar, suas cotacoes.
  - Usar `.codex/.har/app.segfy.comgui.har` apenas como referencia sanitizada de
    fluxo e comparar tudo com o contrato vigente e o PDF da API Aggilizador.
  - Entregue com guia unica, rotas dedicadas, seis especializacoes, coberturas
    por versao, duplicacao independente e confirmador interno, sem cotacoes,
    orcamento composto, Agger no frontend ou mudanca de backend/contrato.

- [x] 6.4R **Realinhamento da jornada de multi-calculo**
  - Revisao de produto aberta em 2026-07-22 depois da analise do fluxo real do
    HFy Auto/SegFy, dos portais de ajuda SegFy e Quiver, do video oficial e das
    anotacoes do usuario sobre a tela entregue no 6.4.
  - O 6.4 permanece concluido como registro historico da implementacao aderente
    ao contrato v2.6; o realinhamento nao apaga aquela evidencia.
  - Cada oportunidade pode ter de zero a muitos calculos; cada calculo pertence
    obrigatoriamente a uma unica oportunidade. O acompanhamento no Kanban nao
    depende da existencia de calculo, inclusive em novo, renovacao e endosso.
  - [x] 6.4R-A **Reconciliacao contratual — solicitacao x resultado**
    - Micro-plano:
      `.codex/plans/micro-plano-6.4R-A-reconciliacao-contratual-multicalculo.md`.
    - Separar preferencias/dados informados pelo corretor dos valores devolvidos
      por cada seguradora, incluindo coberturas, franquias, premio e pagamento.
    - Concluido em 2026-07-22 no par v3.0: pedido, execucao, resultado,
      coberturas/parcelamentos e apresentacao ficaram normalizados e separados.
    - Nenhum arquivo de frontend foi alterado neste gate contratual.
  - [x] 6.4R-B **Jornada Auto condicional e assistida**
    - Micro-plano:
      `.codex/plans/micro-plano-6.4R-B-jornada-auto-condicional.md`.
    - Refatorar o formulario Auto sobre o contrato reconciliado, com defaults,
      consultas assistidas, renovacao condicional e pedido de coberturas enxuto.
    - Nao extrapolar automaticamente as decisoes de Auto para os demais ramos.
    - Concluido em 2026-07-22 com `database.ts`, dominio e mock aderentes ao v3.0,
      244 testes aprovados e os tres fluxos Auto exercitados no navegador.

- [x] 6.5 **Resultados aninhados, comparativo e apresentacao comercial**
  - `cotacoes` como resultado por seguradora.
  - Este recorte so se aplica quando o usuario optar por criar um calculo; a
    oportunidade pode seguir seu fluxo comercial sem passar pelo multi-calculo.
  - Cotacoes ficam dentro do calculo que as originou, nunca em guia independente.
  - [x] 6.5A **Execucoes e resultados simulados por seguradora**
    - Micro-plano:
      `.codex/plans/micro-plano-6.5A-execucoes-resultados-seguradoras.md`.
    - Permitir comissao padrao com override por seguradora, acompanhar estados de
      execucao e exibir resultados deterministas no mock do frontend.
    - Concluido em 2026-07-22 com contrato/mock tipados, 252 testes aprovados e
      fluxo misto, detalhes, ordenacao e historico validados no navegador.
  - [x] 6.5B **Comparativo e apresentacao comercial**
    - Micro-plano:
      `.codex/plans/micro-plano-6.5B-comparativo-apresentacao-comercial.md`.
    - Permitir selecionar cotacoes de calculos diferentes da mesma oportunidade,
      comparar até cinco produtos (ampliação de 10/09/2026) e montar uma apresentação única agrupada por
      versao/perfil.
    - Concluído inicialmente em 22/07/2026 com bandeja, comparativo de três
      produtos e apresentação normalizada; ampliado para cinco em 10/09/2026,
      com revisão do PDF e origem da proposta manual/importada. As evidências
      iniciais (258 testes) são históricas; a publicação posterior tem 304 testes.
  - [x] 6.5R **Refinamento operacional da tela de calculo**
    - Micro-plano:
      `.codex/plans/micro-plano-6.5R-refinamento-operacional-calculo.md`.
    - Permitir editar uma versao salva como rascunho de novo snapshot, aplicar
      mascaras e consultas assistidas e reorganizar coberturas/layout.
    - Preservar a fronteira v3.0: pedido alterado cria novo calculo; comissao e
      retry sem alteracao do pedido criam somente novas execucoes.
    - Concluido em 2026-07-23 com coberturas diretas sem checkbox/observacao,
      toggles de caracteristicas do veiculo, condicionais de kit gas/blindagem,
      262 testes aprovados, build e fluxo completo validados no navegador.
  - O HAR confirma selecao de resultados e geracao de visualizacao/PDF. O
    contrato v3.0 ja normaliza execucao por seguradora, detalhes de
    cobertura/pagamento por cotacao e apresentacao composta; a implementacao
    foi concluida em sequencia: 6.4R-B, 6.5A e 6.5B estao implementados e
    validados.
  - Aprovar cotacao cria ponte para `propostas.cotacao_id` quando aplicavel.

- [ ] 6.6 **Agger/Aggilizador**
  - UI de disparo do multi-calculo quando backend expuser.
  - `integracao_logs` fica sem UI por ora: responsabilidade tecnica de banco/backend.
  - Payload cru em TEXT; dado util normalizado em calculos/cotacoes/coberturas.
  - Integracoes com seguradoras so entram por micro-plano futuro quando houver
    projeto de API concreto; nao criar antes disso configuracao generica, fila de
    documentos, busca de parcelas ou monitoramento de integracoes.
  - A captura do SegFy nao constitui projeto de API e nao autoriza busca em
    portais, armazenamento de credenciais ou automacao nesta fase sem nova
    decisao explicita.

## Backlog transversal de limpeza e governanca

- [x] G6 **Confirmacoes e feedback do sistema**
  - Micro-plano: `.codex/plans/micro-plano-g6-confirmacoes-sistema.md`
  - Substituir dialogos nativos do navegador por confirmador/feedback interno
    reutilizavel.

- [x] G7 **Configuracoes como cockpit administrativo**
  - Micro-plano: `.codex/plans/micro-plano-g7-configuracoes-cockpit-administrativo.md`
  - Refatorar a tela de Configuracoes apos critique do Impeccable: navegacao
    agrupada, acoes administrativas visiveis/acessiveis, modal base, matriz de
    permissoes mais segura e Funis & Etapas com menor carga cognitiva.
  - Escopo transversal de UX/front; nao substitui a reconciliacao contratual de
    0.5 Funis & Etapas.
  - Fechado em 2026-07-03: validado com TypeScript, build, vitest, lint focado,
    detector Impeccable e QA visual desktop/mobile.

- [x] G8 **Configuracoes V2 como hub de cadastros**
  - Micro-plano: `.codex/plans/micro-plano-g8-configuracoes-v2-hub-cadastros.md`
  - Micro-plano ativo: nenhum; recortes planejados concluidos.
  - Transformar Configuracoes em hub pesquisavel no corpo da pagina e abrir
    cadastros densos em telas proprias aderentes ao DBML V2.
  - Primeiro recorte concluido em 2026-07-06: G8.1/G8.2, hub +
    Seguradoras V2 completa.
  - Recorte concluido em 2026-07-06: G8.3, catalogos enxutos V2 para
    `origens` e `motivos_perda`.
  - Recorte concluido em 2026-07-06: G8.4, Ramos e Coberturas V2.
  - Recorte concluido em 2026-07-06: G8.5, Financeiro configuravel V2.
  - Recorte concluido em 2026-07-06: G8.6, Campos personalizados V2.
  - Recorte concluido em 2026-07-07: G8.7, reorganizacao visual de Ramos,
    Coberturas, Seguradoras, Regras de Repasse e Campos Personalizados no fluxo
    lista/detalhe de Grades de Recebimento, sem mudanca de contrato.
  - Ajuste pos-review em 2026-07-07: catalogos G8 usam ordem alfabetica por
    padrao; `ordem` fica tecnico para futura reordenacao via drag and drop e nao
    deve aparecer como campo numerico enquanto o drag and drop nao existir.
  - Relatorio de Endpoints & Campos consolidado no arquivo raiz em 2026-07-08.
  - Nao substitui 0.5 Funis & Etapas reconciliados; e frente transversal de
  experiencia/contrato de Configuracoes.

- [ ] G9 **Central Tecnica e Suporte**
  - Backlog futuro; nao possui micro-plano ativo e nao deve ser implementado
    antes de autorizacao explicita do usuario.
  - Criar area tecnica separada das Configuracoes operacionais, visivel apenas
    para perfis de plataforma autorizados, como Suporte/Dev; ocultar o item de
    navegacao nao substitui autorizacao real de rota e backend.
  - Separar ferramentas de diagnostico, preferencialmente somente leitura, de
    operacoes de suporte que alterem dados. Acoes sensiveis devem exigir previa,
    confirmacao, motivo e auditoria.
  - Centralizar nesta area a identidade visual das seguradoras: cadastrar,
    substituir e inativar logos; manter aliases por codigo SUSEP, codigo interno
    e nome normalizado; prever fallback por iniciais quando nao houver logo ou
    quando o arquivo falhar.
  - O logo deve complementar o nome da seguradora nos pontos de uso do sistema,
    nunca substituir sua identificacao textual.
  - A implementacao futura depende de micro-plano proprio, permissoes dedicadas,
    armazenamento de arquivos, validacao de formato/tamanho, historico de
    alteracoes e enforcement pelo backend. Enquanto isso, nao criar upload,
    rota oculta nem catalogo administravel no frontend atual.

- [x] G10 **Massa demo integrada e relacional**
  - Micro-plano:
    `.codex/plans/micro-plano-g10-massa-demo-integrada.md`.
  - Pedido aberto em 2026-07-22 para popular amplamente o mock com calculos,
    sinistros, contratos, financeiro, pos-venda e vinculos transversais.
  - Preserva o trabalho em andamento do 6.4R-B e cobre as superficies ja
    implementadas; resultados por seguradora e apresentacao comercial continuam
    sequenciados em 6.5A/6.5B.
  - Concluido em 2026-07-22 com massa deterministica, teste de integridade,
    244 testes Vitest, ESLint focado e build aprovados.

- [x] G1 **Estrutura do Relatorio unico de Endpoints & Campos**
  - Micro-plano: `.codex/plans/micro-plano-g1-relatorio-unico-endpoints-campos.md`
  - Arquivo unico versionavel: `relatorio-endpoints-campos.md`
  - Relatorio movido para a raiz em 2026-07-08 para versionamento no GitHub.
  - Relatorios 0.1, 0.2 e 0.3 consolidados; 0.4a/0.4b absorvidos por G8;
    G8 e 0.5 consolidados.
  - Consolidação dos demais módulos autorizada e concluída em 11/09/2026,
    com 68 tabelas/1.164 colunas inventariadas. A política de julho permanece
    como histórico; o relatório atual cobre o escopo entregue da V1.

- [x] G2 **Aposentar `user_roles/app_role`**
  - Micro-plano: `.codex/plans/micro-plano-g2-aposentar-user-roles-app-role.md`
  - Manter `perfis`, `profile_filiais` e `role_permissions`.
  - `user_roles/app_role` removido de `database.ts` e do mock em memoria.

- [x] G3 **Aposentar `emissoes`**
  - Concluido pelo recorte 2.6 em 2026-07-12: menu, pagina, adapters, hooks,
    tabela mock e tipagem legados foram removidos.
  - `/emissoes` e `/emissoes/:id` permanecem somente como redirecionamentos de
    compatibilidade para o Painel.

- [x] G4 **Retirar `metadata` JSON de dados de negocio**
  - Concluido no recorte 6.3 em 2026-07-21: Oportunidades deixou de persistir
    `metadata`; dados escalares usam colunas canonicas e extensoes usam o EAV
    tipado transversal.

- [x] G5 **Limpeza tecnica sem impacto funcional**
  - Concluido em 2026-07-21. Micro-plano:
    `.codex/plans/micro-plano-g5-limpeza-tecnica.md`.
  - `SettingsProvider`/`useSettings` se confirmado sem consumidor.
  - Assets orfaos (`react.svg`, `vite.svg`, `hero.png`) apos verificacao.
  - README e comentarios obsoletos (`.claude`, `planos`, `stitch_screens`,
    "Fase 4 - n8n").
  - Dependencias candidatas, como `zustand`, apenas com verificacao.

## Politica documental vigente

G8/0.5 e plataforma iniciaram o relatório único em julho. A decisão de 10/07/2026 adiou novas consolidações até a estabilização do frontend. Em 11/09/2026, o usuário autorizou e esta rodada executou a consolidação de todas as frentes entregues, com inventário canônico completo e limites de integração.

Os microplanos históricos preservam notas e resultados da sua época; não se deve interpretar “handoff futuro” nesses registros como pendência atual quando o tema já estiver no relatório consolidado. Evoluções futuras continuam documentadas em microplanos e só geram nova consolidação quando estabilizadas ou solicitadas.

## Proximo micro-plano recomendado

Nenhuma nova construção funcional é aberta automaticamente. O [microplano de encerramento](micro-plano-encerramento-frontend-v1-2026-09-11.md) formaliza esta entrega. A próxima frente dependerá da prioridade do usuário e do contrato de API disponível; manutenção, integração e homologação são recortes próprios. Fase 5, 3.4R-B, 6.6 e G9 permanecem adiados.

## Criterio para considerar o DBML integralmente mapeado

Cada tabela do DBML deve estar em pelo menos um destes estados:

- implementada no front/mock, com seus relacionamentos essenciais, e com notas
  suficientes no micro-plano para o hand-off final;
- mapeada para micro-plano pendente com escopo claro;
- explicitamente adiada por design, com justificativa e impacto;
- responsabilidade exclusiva do backend, com contrato registrado para a futura
  consolidacao do hand-off.

Critério documental atendido na consolidação de 11/09/2026: todas as tabelas
e fluxos estabilizados estão mapeados no relatório. Isso não certifica enforcement,
integração real nem edição de cada coluna pela interface.

## Template minimo de micro-plano

```md
# <fase> — <tela/subtela>

## Objetivo

## Tabelas DBML envolvidas

## Legado atual
- Reconstruir sobre o esqueleto | refatorar no lugar | manter temporariamente

## Arquivos frontend provaveis

## Mock/tipos necessarios

## UX/fluxo esperado

## Regras e validacoes

## Notas para o hand-off final de Endpoints & Campos

## Criterios de aceite

## Verificacao
```

## Verificacao por micro-plano

Quando houver alteracao de codigo, rodar as verificacoes relevantes:

- `npm run build`
- `npm run lint`
- `npm test`

Se o `npm` global falhar neste ambiente, usar os binarios locais de
`nexus-crm/node_modules/.bin` e registrar o motivo no fechamento.
