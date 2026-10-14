# Comandos canônicos de cálculo — sessões HTTP — 12/10/2026

Escopo governado/contratual, autorizado pelo usuário para deixar a camada de dados
pronta e reservar design/telas para Renato. Base FE #55 / BE #35. Sem alteração
de componentes visuais. Instruções/DBML/database.ts v3.1 conferidos para pedidos
Auto, execuções, cotação/coberturas/parcelamentos e apresentação comercial.

## Objetivo

Preparar serviço/hooks de criação do pedido, tentativa MANUAL, retry/cancelamento,
resultado manual e gravação do comparativo. Reutilizar adapters canônicos, sem
simulação/memória como fallback, sem calcular comissão/prêmio não informados.

- [x] Sessão de gravação: snapshot do input, chave reaproveitada após erro de rede,
  clique duplicado compartilha a requisição e alteração concorrente é recusada.
  Novo comando confirmado recebe nova chave. Estado só em memória da sessão,
  separado por usuário/grupo/filial; nenhum draft/credencial em WebStorage.
- [x] Remover bloqueio local por revisão após GET da apresentação: manter validação
  da oportunidade antes de PUT, enviar a revisão original e deixar o servidor
  distinguir replay idempotente de edição obsoleta. Nunca substituir pela revisão
  mais nova automaticamente. Servidor já consulta receipt antes do gate de revisão.
- [x] Comandos tipados, leitura da execução para verificar contexto antes da cotação
  manual, invalidação de caches e testes de perda de resposta/concorrência.
- [x] Leitura/projeção do workspace comercial com revisão explícita, comparação
  entre versões da mesma oportunidade e nomes/coberturas de retorno históricos.
  Nomes inativos só entram pelo opt-in de referências do histórico desta
  oportunidade, implementado no BE em `codex/calculation-historical-insurers`.
  Drift corrigido: chave de retorno sem FK de catálogo identifica a cobertura
  somente dentro da cotação (DBML v3.1); códigos iguais em cotações diferentes não
  estabelecem equivalência. Domínio/mock e leitura HTTP usam a mesma chave isolada.
- [x] Gates e checkpoint da camada de dados. Componentes existentes serão conectados por Renato,
  incluindo chaves/revisões e await/feedback; não declarar jornada visual pronta.

Retry gera nova execução; alteração do pedido gera nova versão. Null mantém padrão
de comissão desconhecido e zero é sobrescrita explícita. Selecionar cotação não
aprova nem cria proposta/apólice. Não transmitir a seguradoras ou publicar PDF.

## Validação e consumo — 14/10/2026

`tsc -b`, 394 testes Vitest, ESLint nos 17 arquivos TypeScript do recorte e Vite
em modo backend aprovados. O primeiro comando de lint recebeu caminhos relativos
à raiz em vez de `nexus-crm`; corrigido o comando e repetido somente o lint. Build
mantém os avisos conhecidos de fontes Rubik/Mulish. Sem alteração de configuração,
`database.ts`, páginas ou componentes. Tipos usados aderem ao DBML v3.1.

- `useCanonicalCalculationEditorData`: calendário/fuso da corretora, origem da
  apólice e catálogos comerciais ativos; não inventa ramo nem consulta assistida.
  Lookup de pessoas continua separado e exige autorização em Segurados.
- `useCanonicalCalculationCommands`: criar pedido e tentativa MANUAL,
  reexecutar/cancelar, registrar resultado e salvar apresentação. Manter o hook
  montado durante tentativa/retry; aguardar `mutateAsync` antes de navegar.
  A chave de recuperação permanece apenas na memória desta sessão.
- `useCanonicalCommercialPresentation`: resultados persistidos, itens ordenados,
  rótulos históricos e revisão recebida. `buildCanonicalPresentationSelection`
  prepara inclusão/remoção de até cinco cotações, sem alterar o workspace original
  nem aprovar resultados. Enviar sua revisão original ao salvar; conflito 409
  exige releitura/decisão explícita. Retorno confirmado fornece a revisão nova.

Os hooks antigos de escrita simulada continuam recusando modo backend. Renato
precisa substituir essas chamadas nas páginas do editor, cotação manual e
comparativo, preservar null/zero nos campos e exercitar criar → recarregar →
cotação manual → comparação no navegador, inclusive layout desktop/zoom 100%.
Essa jornada e o cutover das páginas seguem pendentes; o checkpoint isolado não
representa liberação do fluxo conectado. Depende do BE histórico além de #35.
