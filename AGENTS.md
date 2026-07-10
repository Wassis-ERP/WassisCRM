# AGENTS.md

## Idioma e postura
- Responda em portugues do Brasil.
- Seja conciso por padrao, mas explique melhor quando houver decisao tecnica, risco ou trade-off.
- Trabalhe em modo equilibrado: avance sem travar, mas nao assuma demais quando o contexto estiver ambiguo.
- Se houver duvida relevante, pergunte antes de seguir.
- Priorize seguranca, previsibilidade e mudancas pequenas.
- Nunca altere ou apague arquivos de configuracao sem permissao explicita.
- Antes de acoes destrutivas ou dificeis de reverter, peca confirmacao.

## Fontes de verdade do projeto
- Antes de planejar ou implementar qualquer tela nova, fluxo, tipo, mock, relatorio ou contrato, leia os artefatos mais atuais em `.codex\artefatos`.
- Observe sempre `instrucoes_projeto_wassis_v2_0.md` e `wassis_erp_esqueleto_v2_0.dbml`, ou arquivos equivalentes com versao mais recente.
- As instrucoes do projeto e o DBML sobem juntos e compartilham o mesmo numero de versao. Se existir `v1_2`, `v2_0` ou versao superior, use a mais recente.
- Consulte `relatorio-endpoints-campos.md` na raiz como snapshot parcial do hand-off ja consolidado. Por decisao de 2026-07-10, ele nao acompanha cada tela e pode estar defasado em relacao ao front; valide sempre contra DBML/instrucoes, macro/micro-plano e codigo atual. `.codex\artefatos\endpoints` guarda historicos ja emitidos.
- Consulte tambem `.contextos-mercado\portal_ajuda_quiver` e `.contextos-mercado\portal_ajuda_segfy` quando o trabalho envolver mapeamento de campos, contratos ou validacao de lacunas no esqueleto.
- Respeite as decisoes fechadas do contrato, especialmente: grupo x corretoras, contrato x documento x item, multi-calculo, comissao diferente de repasse, EAV tipado para campos personalizados, zero JSON para dado de negocio e fusao apenas na leitura.

## Sincronizacao do `database.ts`
- `nexus-crm\src\types\database.ts` e a tipagem aplicada ao mock/front devem refletir o contrato vigente do esqueleto DBML e das instrucoes do projeto.
- Sempre que uma tarefa alterar ou criar tela, fluxo, tipo, hook, adapter, mock ou comportamento ligado a dados de negocio, compare as tabelas, nomes, enums, FKs e estruturas usadas com o DBML/instrucoes mais recentes.
- Ao mexer em um modulo especifico, por exemplo Sinistros, Financeiro, Apolices, Propostas, Segurados ou Configuracoes, confirme ao final se o trecho correspondente de `database.ts` esta aderente ao esqueleto.
- Se houver divergencia entre `database.ts` e o esqueleto, trate como legado/drift: ajuste o front/mock para refletir o contrato quando isso estiver dentro do escopo seguro da tarefa, ou registre a divergencia no micro-plano quando a correcao exigir fase propria.
- Nao use `database.ts` como fonte de verdade para decidir nomes ou estruturas de negocio quando ele divergir do DBML/instrucoes.

## Classificacao de escopo e modo enxuto
- Antes de carregar contexto amplo, classifique a tarefa como: `micro-enxuta`, `enxuta`, `normal` ou `governada/contratual`.
- Use modo `micro-enxuto` para pedidos pontuais vindos de comentario visual, print, captura do browser ou indicacao direta de elemento, por exemplo badge, chip, alinhamento, espacamento, cor, texto, icone ou quebra visual localizada.
- Uma tarefa `micro-enxuta` deve atender aos mesmos limites do modo `enxuto` e tambem:
  - nao ser tratada como criacao, desenho ou redesenho de tela;
  - nao carregar DBML, instrucoes completas, endpoints, memoria, macro-plano, micro-plano, contextos de mercado, Impeccable ou artefatos completos de skill;
  - usar a pista do comentario/browser antes de fazer busca ampla;
  - usar no maximo: localizar arquivo alvo, abrir trecho pequeno, editar e revisar diff;
  - manter mensagens ao usuario no minimo necessario: inicio, bloqueio real e final.
- Use modo `enxuto` para ajustes pequenos em tela existente quando a mudanca:
  - nao cria tela, subtela, rota, fluxo, hook, adapter, mock, tipo ou contrato;
  - nao altera dados de negocio, permissoes, validacoes, persistencia, filtros, ordenacao ou regras funcionais;
  - limita-se a apresentacao, espacamento, alinhamento, cor, hierarquia visual, texto visivel, icone, estado visual simples ou correcao cosmetica localizada.
- No modo `enxuto`, economize contexto:
  - nao releia DBML/instrucoes completas, endpoints ou contextos de mercado;
  - nao crie micro-plano novo;
  - nao rode varreduras amplas no repo se o arquivo alvo ja estiver claro;
  - consulte apenas o componente/arquivo afetado e, se necessario, padroes visuais proximos;
  - trate `database.ts` como fora de escopo, salvo se a mudanca tocar dados de negocio;
  - registre no resumo final que foi uma mudanca enxuta e quais validacoes focadas foram feitas ou puladas.
- Se durante uma tarefa `micro-enxuta` ou `enxuta` surgir alteracao funcional, dado de negocio, contrato, mock, hook, adapter ou duvida de produto, pare e reclassifique para modo `normal` ou `governada/contratual` antes de continuar.
- Use modo `normal` para ajustes de UI ou comportamento em tela existente que nao mudam contrato, mas exigem fluxo funcional, testes ou validacao de navegacao.
- Use modo `governada/contratual` para tela/subtela nova, contrato, dados de negocio, mocks, tipos, hooks, adapters, endpoints, DBML/instrucoes, relatorios ou qualquer mudanca que possa afetar o backend futuro.

## Limites operacionais para modo micro-enxuto
- Em modo `micro-enxuto`, use comandos pequenos e saidas curtas. Evite `rg .`, leituras de arquivos inteiros e `max_output_tokens` alto quando um trecho especifico basta.
- Leia preferencialmente ate 120 linhas em torno do alvo. Abra mais contexto apenas se o primeiro trecho nao explicar a causa.
- Nao faca busca em memoria para micro-ajuste visual/copy, salvo pedido explicito do usuario ou falta total de contexto local.
- Nao investigue configuracao de ferramenta em profundidade. Se `npm`, lint, browser ou Playwright falhar por ambiente, faca no maximo uma alternativa conhecida e registre risco residual.
- Nao rode build, lint e testes amplos juntos para mudanca cosmetica de baixo risco. Escolha a menor validacao que cubra o risco real.
- Nao faca multiplas medicoes DOM, screenshots ou tentativas de browser para o mesmo ajuste. Uma tentativa visual automatizada basta; se falhar, encerre com risco residual.
- Se o arquivo alterado ja estiver nao rastreado ou houver arvore suja fora do escopo, nao investigue a historia do Git salvo se isso bloquear a edicao.

## Planos e acompanhamento
- Leia `.codex\plans\macro_plano.md` antes de iniciar uma fase, tela ou subtela.
- Crie todos os subplanos e micro-planos dentro de `.codex\plans`.
- Nao execute alteracoes no frontend (tela nova, subtela, fluxo, tipo, hook, adapter, mock, rota ou comportamento funcional) sem existir micro-plano correspondente em `.codex\plans`.
- Para ajuste `enxuto` de UI/copy em tela existente, nao crie micro-plano novo; se ja houver micro-plano ativo diretamente relacionado, apenas mencione o ajuste nele quando isso for barato e seguro.
- Sempre que criar, concluir ou mudar o escopo de um subplano, atualize o plano macro em `.codex\plans\macro_plano.md`.
- Use o status do macro plano de forma consistente: `[ ]` pendente, `[~]` em andamento e `[x]` concluido.
- Registre decisoes de legado no subplano: reconstruir sobre o esqueleto, refatorar no lugar ou manter temporariamente.

## Ritmo das automacoes de engenharia
- Ate o fechamento da Fase 0, as automacoes devem permanecer conservadoras:
  priorizar recortes pequenos, respeitar a ordem do macro plano e bloquear quando
  houver mudanca local no mesmo arquivo, fluxo, hook, tipo, mock, plano ou
  contrato que o proximo trabalho precise tocar.
- Depois que a Fase 0 estiver concluida e a base de Configuracoes/Funis estiver
  estabilizada, as automacoes podem operar em modo acelerado com trilhos:
  criar ou ajustar micro-planos pequenos e implementar na mesma rodada quando o
  escopo estiver claro, seguro e alinhado ao DBML/instrucoes.
- No modo acelerado, e permitido tocar arquivos ja assumidos pelo recorte/epic
  ativo sem parar a cada mudanca local conhecida da propria automacao. Mudancas
  de terceiros no mesmo recorte continuam exigindo classificacao; bloqueie apenas
  se houver conflito real de produto, contrato, validacao ou autoria.
- Para a Fase 1, preferir fatiamento por sub-recortes executaveis, por exemplo:
  definicoes de campos personalizados, preenchimento de valores, contrato/mock de
  guias polimorficas e UI reutilizavel das guias.
- Nao acelerar os limites estruturais: nunca pular micro-plano obrigatorio, nunca
  alterar contrato sem comparar com DBML/instrucoes, nunca misturar backend, SQL
  ou migrations, e nunca concluir tela/subtela sem validar o fluxo principal.
- Dividas catalogadas fora do escopo podem ser toleradas quando nao impedirem
  build, testes relevantes nem o fluxo principal do recorte atual. Registre o
  risco residual e siga com o proximo passo seguro.

## Regra para endpoints
- Nao atualize o Relatorio de Endpoints & Campos ao finalizar cada tela ou subtela.
- Durante o desenvolvimento, registre no micro-plano as entidades, campos, operacoes, filtros, lookups, validacoes e responsabilidades de backend que deverao alimentar o hand-off final.
- Consolide ou atualize o relatorio unico versionavel na raiz, `relatorio-endpoints-campos.md`, quando as telas e contratos estiverem estabilizados, antes da entrega ao backend, ou mediante pedido explicito do usuario.
- Use `.codex\artefatos\endpoints` apenas para historicos ou anexos antigos, salvo instrucao explicita diferente.
- O relatorio deve mapear entidades do esqueleto, campos de negocio, endpoints esperados, filtros, lookups, regras de validacao e responsabilidades do backend.
- Depois de consolidar o relatorio, atualize o estado documental correspondente no macro plano.

## Design de telas e UI/UX
- Sempre que for desenhar, redesenhar ou implementar alguma tela no frontend, use a skill `wassis-design-uiux`.
- A skill fica em `.agents\skills\wassis-design-uiux`.
- Antes de criar uma tela nova, leia as instrucoes da skill e siga seus padroes visuais, fluxos, componentes e criterios de usabilidade.
- Correcao cosmetica localizada em modo `micro-enxuto` nao conta como desenhar, redesenhar ou implementar tela; use o padrao visual ja presente no arquivo/componente.
- Para ajuste `enxuto`, use o design system ja conhecido e os padroes proximos do componente; carregue a skill `wassis-design-uiux` ou seus artefatos apenas se a decisao visual depender disso.
- Use tambem a skill `impeccable` quando o trabalho envolver desenho, revisao, polimento, auditoria ou automacao visual de UI. Nos modos `micro-enxuto` e `enxuto`, use `impeccable` apenas se o usuario pedir, se houver redesenho/polimento amplo, ou se a inspecao local nao for suficiente. O contexto do Impeccable fica em `PRODUCT.md`, `DESIGN.md` e `.impeccable\design.json`; ele complementa a `wassis-design-uiux`, mas nao substitui o design system W.Assis.
- Ao aplicar comandos ou heuristicas do Impeccable, preserve os tokens, componentes e decisoes da `wassis-design-uiux` como fonte visual de marca/produto.
- Preserve consistencia com a experiencia existente do WassisCRM e priorize telas operacionais, claras e eficientes para corretoras de seguros.
- Fluxos de produto nao devem usar dialogos nativos do navegador (`window.confirm`, `window.alert`, `window.prompt` ou `alert`). Use o confirmador/feedback interno do sistema para confirmacoes, erros e placeholders temporarios.
- Modais devem permitir fechamento por clique fora e tecla `Esc`, exceto quando houver salvamento em andamento ou risco explicito de perda de dados.

## Escopo tecnico
- Este projeto e puramente frontend. O backend sera desenvolvido por outra equipe.
- Os dados de dominio do front rodam contra mock em memoria e devem evoluir o minimo necessario para demonstrar a tela. A autenticacao ja pode consumir o WAssisBE quando `VITE_AUTH_MODE=backend`; isso nao autoriza implementar outras APIs reais neste repositorio.
- Tudo que for relacionado ao backend deve ser tratado apenas como contrato/hand-off: durante o desenvolvimento, registrar no micro-plano; na consolidacao final, levar ao Relatorio de Endpoints & Campos.
- Nao implementar backend, SQL, migrations, APIs reais, funcoes de servidor, RLS/RBAC de banco ou codigo .NET neste projeto.
- O entregavel final de hand-off para o backend e `relatorio-endpoints-campos.md` na raiz do projeto; durante o desenvolvimento ele permanece como snapshot parcial.
- Antes de criar abstracoes novas, procure reaproveitar hooks, componentes, adapters, tabs e padroes existentes.
- Preserve a separacao entre autoria no front e enforcement no backend quando o contrato assim definir, especialmente RBAC/RLS.

## Qualidade de tipos e lint
- Nao introduzir novos `any` em codigo de producao, hooks, adapters, mocks, testes ou componentes.
- Preferir tipos explicitos, generics, `unknown`, `Record<string, unknown>`, `Partial<T>` ou tipos derivados de `database.ts`/DBML conforme o caso.
- Se um `any` parecer inevitavel por integracao externa ou API ainda instavel, limitar ao menor ponto possivel, documentar o motivo e converter para tipo seguro logo na fronteira.
- Nao silenciar regras de ESLint com `eslint-disable` sem justificativa explicita.
- Ao mexer em arquivo que ja possui divida de lint, nao ampliar a divida existente; corrigir o trecho tocado quando isso couber no escopo seguro.
- Quando `eslint .` falhar por problemas legados fora do recorte, classificar como divida tolerada, mas garantir que o recorte atual nao introduziu novos erros.
- Evitar `setState` sincronamente dentro de `useEffect` quando o estado puder ser derivado de props, params ou dados carregados.
- Manter dependencias de hooks estaveis; quando necessario, usar `useMemo`/`useCallback` com criterio.
- Arquivos de componentes devem exportar componentes; constantes ou helpers compartilhados devem ir para arquivos separados quando o Fast Refresh reclamar.
- Testes novos devem ser tipados com os mesmos contratos usados pelo codigo testado, evitando mocks soltos com `any`.

## Verificacao
- Ao concluir mudancas de codigo, execute as verificacoes relevantes do projeto.
- Ao concluir mudancas ligadas a dados de negocio, confirme explicitamente se `database.ts` esta alinhado ao esqueleto DBML/instrucoes para o modulo alterado, ou registre a divergencia e o motivo de nao corrigi-la no mesmo ciclo.
- Quando aplicavel, rode `npm run build`, `npm run lint` e `npm test`.
- Para ajuste `micro-enxuto`, valide nesta ordem e pare quando o risco estiver coberto:
  1. revisar diff do arquivo alterado;
  2. fazer checagem visual leve se a mudanca depender de layout real;
  3. rodar `tsc` local uma vez se houver risco de tipo em TS/TSX;
  4. nao rodar lint/build/testes amplos salvo risco real ou pedido explicito.
- Para ajuste `enxuto`, prefira validacao focada: inspecao do diff, lint/tsc do arquivo ou componente quando viavel, e uma checagem visual leve apenas se o resultado depender de layout real.
- Para telas, fluxos, hooks, adapters e mocks, inclua teste funcional do comportamento principal alterado: criar, editar, inativar/remover, filtrar ou navegar conforme o escopo. Quando houver UI, valide no navegador/local app alem de build/testes estaticos.
- Para telas, valide tambem o layout visual no navegador em zoom 100% e em pelo menos um viewport desktop comum. Confirme que botoes, campos, textos e cards nao estouram, nao ficam cortados e nao se sobrepoem.
- Evite multiplas capturas, medicoes DOM ou validacoes visuais repetidas em ajuste `enxuto`, salvo quando a primeira checagem falhar ou o usuario pedir evidencia visual detalhada.
- Nao considere uma subtela funcional concluida apenas com `tsc`, build ou testes unitarios se o fluxo principal nao foi exercitado.
- Se algum comando nao puder ser executado, informe o motivo e o risco residual.

## Contexto rapido
- Artefatos principais: `.codex\artefatos\instrucoes_projeto_wassis_v2_0.md` e `.codex\artefatos\wassis_erp_esqueleto_v2_0.dbml`.
- Planos: `.codex\plans\macro_plano.md` e micro-planos na mesma pasta.
- Relatorio de endpoints versionavel e parcial durante o desenvolvimento: `relatorio-endpoints-campos.md`; historicos em `.codex\artefatos\endpoints`.
- Skill de UI/UX: `.agents\skills\wassis-design-uiux`.
- Aplicacao principal: `nexus-crm`.
