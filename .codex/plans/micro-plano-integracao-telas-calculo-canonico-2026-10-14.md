# Integração das telas de cálculo canônico — 14/10/2026

Escopo **governado/contratual** sobre o CRM `codex/calculation-screen-integration`,
baseado no FE #56 e no BE #36. A referência funcional é o contrato/DBML v3.1; a
referência visual é a skill `wassis-design`, aplicada aos componentes reais do
produto sem importar o bundle de protótipo.

## Objetivo

Conectar editor, cotação manual e comparativo às leituras e comandos HTTP
canônicos já preparados, preservando autorização, idempotência, revisão otimista e
a distinção entre desconhecido, zero e falso.

## Contrato e tabelas

- `oportunidades`, `calculos`, `calc_*`, `calculo_coberturas`;
- `calculo_execucoes`, `cotacoes`, `cotacao_coberturas`,
  `cotacao_parcelamentos`;
- `apresentacoes_comerciais` e `apresentacao_cotacoes`.

Pedido, tentativa, resultado e apresentação permanecem fatos independentes.
Selecionar uma cotação não aprova o resultado nem cria proposta/apólice.

## Legado e decisão

As páginas atuais ainda acionam escrita e catálogos em memória. O modo
demonstrativo permanece para a experiência local, mas o modo conectado será
reconstruído sobre `useCanonicalCalculationEditorData`,
`useCanonicalCalculationCommands` e
`useCanonicalCommercialPresentation`, sem fallback silencioso para o mock.
Nenhum contrato, SQL, migration ou endpoint será criado no frontend.

## Arquivos prováveis

- `nexus-crm/src/pages/CalculoOportunidadePage.tsx`;
- `nexus-crm/src/pages/ManualQuotePage.tsx`;
- `nexus-crm/src/pages/CommercialPresentationPage.tsx`;
- hooks e helpers canônicos existentes, componentes de execução/comparação;
- testes funcionais das páginas e jornada conectada.

## Critérios de aceite

- [x] Editor usa calendário/fuso, catálogos ativos e apólice de origem do BE;
  criação/duplicação gera snapshot canônico e consultas de pessoas preservam a
  autorização de Segurados.
- [x] Cotação manual prepara tentativa, registra resultado e oferece
  reexecução/cancelamento; perda de resposta reutiliza chave e payload; navegação
  ocorre somente após `mutateAsync`.
- [x] Comparativo usa nomes/coberturas históricos, alterna até cinco resultados
  por `buildCanonicalPresentationSelection` e salva com a revisão carregada.
- [x] Conflito 409 exige releitura e decisão explícita, sem trocar a revisão
  silenciosamente.
- [x] Testes cobrem rede, clique duplicado, revisão, null/zero e sexto resultado.
- [x] Jornada real criar → recarregar → tentativa/resultado → recarregar →
  selecionar/remover → salvar/reabrir exercitada, com layout desktop a 100%.
- [x] `tsc -b`, Vitest completo, ESLint focado e build Production aprovados.

## Evidência e hand-off

Registrar aqui os comandos, resultados, capturas e qualquer pendência de ambiente.
Os endpoints permanecem os já tipados na camada canônica; não atualizar o relatório
geral neste recorte. `database.ts` deve permanecer aderente às tabelas v3.1 acima.
Transmissão a seguradoras, aprovação/proposta/apólice e geração/publicação de PDF
ficam explicitamente fora do escopo.

## Implementação e evidência — 14/10/2026

- Editor ligado aos hooks canônicos; criação/duplicação utiliza o agregado e
  `duplicateCalculationInput`, calendário/fuso do servidor e catálogos comerciais.
  Consultas de pessoas exigem leitura em Segurados. Placa/CEP não consultam
  fixtures no modo conectado. Booleanos usam três estados; coberturas conservam
  zero e não preenchem quantidades desconhecidas.
- Sessão manual permanece montada. Preparação, cancelamento, reexecução e
  resultado aguardam `mutateAsync`. Falha ambígua conserva o comando capturado,
  bloqueia edição e permite recuperação com a mesma chave/payload; trava imediata
  também evita submissão duplicada. O resultado não inventa comissão monetária,
  prêmio líquido, IOF, validade ou parcelamento.
- Comparativo carrega nomes/coberturas históricos, usa
  `buildCanonicalPresentationSelection` sobre o rascunho, limita cinco e salva a
  revisão carregada. Refetch de cache não remonta o editor nem adota outra
  revisão. 409 mostra aviso persistente e confirmação interna para descartar o
  rascunho/reler; escolher resultado não cria proposta/apólice.
- Shell e guia Cálculos habilitam apenas as rotas implementadas. Escritas legadas
  em memória recusam modo backend. Simulação automática, propostas e publicação
  de PDF não são oferecidas nessa jornada. Confirmador interno recebeu nome e
  semântica acessível de diálogo.
- Regressão encontrada no BE: atualização sem troca de etapa anulava a FK pelo
  fixup do EF. Corrigida na PR incremental de apoio
  [WAssisBE #37](https://github.com/Wassis-ERP/WAssisBE/pull/37), sobre #36.
  Fixture recebe somente fuso/catálogos sintéticos em banco descartável.

### Checks executados

| Gate | Resultado |
| --- | --- |
| `npx tsc -b --pretty false` | Aprovado |
| `npm test` | 57 arquivos, 395 testes aprovados |
| ESLint dos TS/TSX alterados e E2E | Aprovado, sem desabilitar regras |
| `npm audit --audit-level=moderate` | Zero vulnerabilidades reportadas |
| `npm run build` com backend/Auth0/URL HTTPS/SHA | Aprovado |
| `npx playwright test --config playwright.production.config.ts` | 1/1 aprovado; identidade 401 interceptada, não login real no IdP |
| BE restore locked sem cache + build Release | SDK 10.0.401 / EF 10.0.12, aprovado sem avisos/erros |
| BE testes sem PostgreSQL + categoria PostgreSQL real | 161 + oito aprovados, zero ignorados |
| BE auditoria NuGet | Sem pacotes vulneráveis reportados |
| BE `test-security-postgres.ps1 -ConnectedOnly -ConnectedCrmDirectory <nexus-crm>` | Jornada real 2/2 aprovada; não executa a categoria PostgreSQL nessa invocação |

Última jornada: cálculo e cotação com zero/false/null após reload; tentativa
MANUAL preparada, cancelada e reexecutada; resposta descartada depois do commit
real e replay com chave/payload idênticos; duas submissões compartilham uma
gravação; seis resultados exercitam limite de cinco, remoção, reabertura e 409
entre abas. A retomada por ID de tentativa conserva a sobrescrita zero e a
recuperação ambígua impede um cancelamento concorrente. Capturas
`calculo-editor-desktop.png`, `cotacao-manual-desktop.png`,
`comparativo-desktop.png` e `comparativo-conflito-desktop.png` em
`nexus-crm/.screens/e2e/canonical-calculations.pw.-95c0f--persistem-pelo-BE-canônico`.
Inspeção visual a 1440×900, escala 1 (100%), foco/controles sem overflow horizontal;
notificações transitórias são fechadas antes das capturas de conferência.

O navegador recusou conexões fora das origens locais da API/CRM e terminou com
zero conexões externas e zero erros de página. Isso comprova BE nessa jornada,
sem acesso remoto ao Supabase. Não comprova a integração de todos os módulos.
Dados/credenciais são sintéticos; cluster/banco/role exclusivos, TLS `VerifyFull`
e aplicação sem ownership/BYPASSRLS. Logs brutos não foram versionados.

`database.ts` conferido para as tabelas/enums/FKs do recorte v3.1; sem alteração de
contrato ou migration no CRM. A skill `wassis-design` orientou tokens, controles
de três estados e feedback/confirmador do produto. O contexto local Impeccable
foi consultado; a skill executável não estava disponível.

### Pendências e publicação

CI do HEAD será executado por `workflow_dispatch`: o workflow atual aceita PR
somente para main, enquanto esta PR usa a base incremental #56. Resultados e URLs
dos runs serão registrados na descrição da PR. Docker/Testcontainers/scans de
imagem locais não foram executados; devem ser comprovados pelo CI do BE/CRM.
Auth0 real/MFA, transmissão a seguradoras, aprovação/propostas, PDF, OCR e os
bloqueadores de segurança/infraestrutura existentes permanecem em suas fases.
Nenhum deploy, backfill ou migration em dados reais foi realizado.
