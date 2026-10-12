# Fundação HTTP do cálculo — 12/10/2026

Escopo governado/contratual após merges BE #33 e FE #52. Referências: DBML/instruções v3.1, macro-plano, contratos das execuções manuais e código dos domínios de cálculo/apresentação. Usuário autorizou novas features e prefere PRs pequenos.

Recorte desta branch: lookups comerciais autorizados por oportunidade no WAssisBE e adapter HTTP tipado no frontend. Nenhuma tela nova ou redesenho; hooks/páginas entram no bloco seguinte, após validar este contrato. Demonstração permanece isolada e o adapter não usa memória como fallback. A skill de design continua ausente; este bloco não depende de decisão visual.

Tabelas conferidas: `oportunidades`, `ramos`, `seguradoras`, `coberturas_catalogo`, `filiais`, `tenants`, `apolices`, `segurados`; pedidos, execuções, cotações e apresentações do v3.1. `database.ts` não receberá tabelas de infraestrutura ou campos de wire fora do contrato.

- [x] Lookups de seguradoras/coberturas com escopo do grupo/oportunidade, paginação e permissão comercial; calendário do grupo herdado pela filial. GETs do BE descritos no plano `docs/calculation-http-foundation-plan.md`.
- [x] Adapter HTTP de pedido/execução/resultado/apresentação, com validação da resposta e chaves explícitas de idempotência; revisão obrigatória em PUT. GET antes de PUT confirma oportunidade e revisão sem gravar em contexto indevido. UUIDs aceitam caixa diferente; campos técnicos do pedido e autoria da apresentação não são enviados pelo cliente.
- [x] Testes de contrato, autorização e paginação; gates locais relevantes e checkpoint separado da integração das telas. BE: 161 + oito PostgreSQL/TLS. FE: tsc, 348 testes, ESLint focado e build conectado aprovados; build usa as variáveis de processo do CI, sem editar arquivos .env.
- [ ] Etapa seguinte: ligar hooks e manual quote, desligar assistência/transmissão simulada no modo conectado e validar criar → recarregar → cotar manualmente → comparar.

Não acionar seguradoras, não publicar documentos e não criar proposta/apólice. Busca de pessoas usa o módulo Segurados e sua própria permissão, não o catálogo de Configurações nem um bypass de PROPRIO. Contextos de mercado ausentes; sem inferência de contratos individuais. Backend/SQL permanecem exclusivamente no WAssisBE. Prompts de continuidade somente no chat.

Arquivos entregues: `backendCalculationApi.ts`, `calculationHttpContracts.ts`, testes de contrato. Respostas são projetadas por schemas tipados completos com `database.ts`, descartando propriedades extras; validam vínculos pedido/risco, execução/cotação/coberturas/parcelamentos e apresentação/oportunidade. Valores zero/nulos permanecem distintos, datas impossíveis e links de proposta inseguros são rejeitados, números NaN/Infinity não são serializados como ausência. Nenhum any, diálogo nativo ou fallback em memória foi introduzido. `database.ts` segue v3.1 sem alteração.

Limites do checkpoint: funções ainda não foram ligadas aos hooks/páginas; não declarar multicálculo conectado completo nem reutilizar evidência antiga de navegador. O próximo bloco deve revisar dependências administrativas dos lookups de `useOportunidade`, obter calendário no contexto e retirar simulações de assistência/motores no modo conectado. Localizar `wassis-design` antes de alterações de tela que exijam a skill; arquivos de design atuais estão no repositório. Validar a jornada real criar → reload → cotação manual → comparativo e permissões com sessão atual.
