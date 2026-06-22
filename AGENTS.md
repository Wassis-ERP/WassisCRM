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
- Antes de planejar ou implementar qualquer tela, fluxo, tipo, mock, relatorio ou contrato, leia os artefatos mais atuais em `.codex\artefatos`.
- Observe sempre `instrucoes_projeto_wassis_v1_1.txt` e `wassis_erp_esqueleto_v1_1.dbml`, ou arquivos equivalentes com versao mais recente.
- As instrucoes do projeto e o DBML sobem juntos e compartilham o mesmo numero de versao. Se existir `v1_2`, `v2_0` ou versao superior, use a mais recente.
- Consulte tambem `.codex\artefatos\endpoints` para entender os hand-offs ja emitidos antes de criar ou alterar telas relacionadas.
- Respeite as decisoes fechadas do contrato, especialmente: grupo x corretoras, contrato x documento x item, multi-calculo, comissao diferente de repasse, EAV tipado para campos personalizados, zero JSON para dado de negocio e fusao apenas na leitura.

## Planos e acompanhamento
- Leia `.codex\plans\macro_plano.md` antes de iniciar uma fase, tela ou subtela.
- Crie todos os subplanos e micro-planos dentro de `.codex\plans`.
- Sempre que criar, concluir ou mudar o escopo de um subplano, atualize o plano macro em `.codex\plans\macro_plano.md`.
- Use o status do macro plano de forma consistente: `[ ]` pendente, `[~]` em andamento e `[x]` concluido.
- Registre decisoes de legado no subplano: reconstruir sobre o esqueleto, refatorar no lugar ou manter temporariamente.

## Regra para endpoints
- Ao finalizar uma tela ou subtela funcional, pergunte ao usuario se pode criar o Relatorio de Endpoints & Campos.
- Nao crie automaticamente novos relatorios de endpoints sem essa confirmacao.
- Quando autorizado, crie o relatorio em `.codex\artefatos\endpoints`.
- O relatorio deve mapear entidades do esqueleto, campos de negocio, endpoints esperados, filtros, lookups, regras de validacao e responsabilidades do backend.
- Depois de criar o relatorio, atualize o item correspondente no macro plano.

## Design de telas e UI/UX
- Sempre que for desenhar, redesenhar ou implementar alguma tela no frontend, use a skill `wassis-design-uiux`.
- A skill fica em `.agents\skills\wassis-design-uiux`.
- Antes de criar uma tela nova, leia as instrucoes da skill e siga seus padroes visuais, fluxos, componentes e criterios de usabilidade.
- Preserve consistencia com a experiencia existente do WassisCRM e priorize telas operacionais, claras e eficientes para corretoras de seguros.

## Escopo tecnico
- Este projeto e puramente frontend. O backend sera desenvolvido por outra equipe.
- O front roda contra mock em memoria e deve evoluir o minimo necessario para demonstrar a tela.
- Tudo que for relacionado ao backend deve ser tratado apenas como contrato, hand-off ou requisito em Relatorio de Endpoints & Campos.
- Nao implementar backend, SQL, migrations, APIs reais, funcoes de servidor, RLS/RBAC de banco ou codigo .NET neste projeto.
- O entregavel de hand-off para o backend e o Relatorio de Endpoints & Campos.
- Antes de criar abstracoes novas, procure reaproveitar hooks, componentes, adapters, tabs e padroes existentes.
- Preserve a separacao entre autoria no front e enforcement no backend quando o contrato assim definir, especialmente RBAC/RLS.

## Verificacao
- Ao concluir mudancas de codigo, execute as verificacoes relevantes do projeto.
- Quando aplicavel, rode `npm run build`, `npm run lint` e `npm test`.
- Se algum comando nao puder ser executado, informe o motivo e o risco residual.

## Contexto rapido
- Artefatos principais: `.codex\artefatos\instrucoes_projeto_wassis_v1_1.txt` e `.codex\artefatos\wassis_erp_esqueleto_v1_1.dbml`.
- Planos: `.codex\plans\macro_plano.md` e micro-planos na mesma pasta.
- Relatorios de endpoints: `.codex\artefatos\endpoints`.
- Skill de UI/UX: `.agents\skills\wassis-design-uiux`.
- Aplicacao principal: `nexus-crm`.
