# Registro de aceite e encerramento — Frontend V1 do WassisCRM

**Data:** 11/09/2026. **Estado:** primeira versão do frontend concluída no escopo de interfaces, fluxos e mocks, com hand-off documental consolidado.

Este registro atende à autorização do usuário para formalizar o encerramento após a conferência do macroplano e demais planos. É aceite do escopo da primeira versão e de sua documentação, apoiado nas evidências já registradas; não declara uma nova homologação operacional pelo usuário nem certifica o sistema integrado em produção.

## Referências da entrega

- Código avaliado: `6059e829da9793d2d7ff584e4ef24ab711ba39c2`, base resultante da [PR #47](https://github.com/Wassis-ERP/WassisCRM/pull/47).
- Contrato: [DBML v3.1](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml) e [instruções v3.1](.codex/artefatos/instrucoes_projeto_wassis_v3_1.md), sem alteração nesta rodada.
- [Relatório consolidado de endpoints e campos](relatorio-endpoints-campos.md): módulos, operações propostas, filtros, lookups, validações, responsabilidades e inventário das 68 tabelas/1.164 colunas.
- [Macroplano](.codex/plans/macro_plano.md) e [microplano deste encerramento](.codex/plans/micro-plano-encerramento-frontend-v1-2026-09-11.md).

## Escopo aceito

| Frente | Entrega aceita nesta versão |
|---|---|
| Plataforma e cadastros | Grupo/corretoras, vínculos, perfis, matriz de permissões, produtores, segurados e contatos; configuração e simulação no frontend. |
| Configurações e guias | Catálogos, funis/etapas, grades/regras, EAV tipado, atividades, observações, anexos demonstrativos, timeline e menções. |
| Contratos | Painel e detalhe de apólices/documentos, cadastro manual, importação assistida simulada, riscos/coberturas, edição auditada, renovação e documentos derivados. |
| Agendas e financeiro | Parcelas, comissões, conciliação/extratos, baixa e estorno, repasses/recibos e cobranças, com fatos separados e comportamento demonstrado no mock. |
| Sinistros e pós-venda | Abertura/manutenção/fechamento de sinistros, envolvidos, processos de pós-venda e atividades elegíveis sobre apólice. |
| Comercial | Oportunidade, versões do pedido, execuções simuladas, resultados/coberturas/pagamentos, cotação manual, até cinco cotações na apresentação e PDF. |
| Origem da proposta | Cotação escolhida pode iniciar cadastro manual ou importação de proposta; revisão explícita, validação dos vínculos e prevenção de duplicidade no mock. |
| Contrato e documentação | Reconciliação estrutural dos tipos representados com v3.1, hand-off consolidado e planos atualizados. |

A avaliação anterior de aproximadamente 95% refletia principalmente o fechamento documental ainda pendente. Com esta consolidação, o marco de entrega do frontend V1 pode ser considerado concluído. Isso não transforma o roadmap completo em 100% nem mede ausência de defeitos: manutenção, novas integrações e evoluções continuam previstas.

## Limites conhecidos preservados

1. **Dados em memória:** multicálculo e demais módulos de domínio continuam demonstrativos. Não há garantia de persistência entre sessões, concorrência distribuída ou operação multiusuário real desses módulos.
2. **API existente parcial:** autenticação e chamadas legadas de Segurados/Oportunidades são preservadas. Campos canônicos sem suporte no DTO ficam bloqueados/desabilitados. O [relatório de integração](resultado-publicacao-2026-09-11.md) discrimina os limites; testes HTTP locais interceptados não homologam ambientes remotos.
3. **Importações:** leitura de proposta e extrato é simulada/assistida. OCR, parser real, fixtures por layout/seguradora, storage, antivírus, fila durável e retenção dependem do backend. Não foi declarado suporte real a uma seguradora por aceitar sua fixture demonstrativa.
4. **Autorização e auditoria:** autoria de perfis/permissões e simulação no front estão entregues. RLS/RBAC, isolamento real, constraints, idempotência sob concorrência e auditoria imutável no servidor pertencem ao backend.
5. **PDF e recibos:** apresentação/PDF e recibo operacional demonstram a experiência. Emissão de recibo registra pagamento no mock; não executa transferência bancária. Armazenamento e geração autoritativa pelo serviço ficam para integração.
6. **Dashboard:** indicadores fixos são demonstrativos; não devem ser usados como consolidação gerencial real.
7. **Infraestrutura:** este aceite não atesta deploy ou ambiente operacional. A última pendência de homologação informada foi a autorização de pull GHCR pelo Portainer; não houve alteração de credenciais nem revalidação do deploy nesta rodada documental.

## Backlog adiado, preservado sem bloquear esta entrega

| Item do macro | Condição de retomada |
|---|---|
| 3.4R-B Mesa de exceções e retomada | Necessidade comprovada no uso e escopo próprio; histórico/conferência 3.4R-A já entregue. |
| 5.1 Dashboards reais | Preparação comercial do SaaS e consultas de backend. |
| 5.2 Visão de grupo | Preparação comercial e consolidação autorizada entre corretoras. |
| 5.3 Notificação de cliente cruzado | Função privilegiada e exposição mínima definida pelo grupo. |
| 5.4 Relatórios operacionais SaaS | Priorização específica de relatórios gerenciais. |
| 6.6 Agger/Aggilizador | Projeto concreto de API, integração segura e homologação. |
| G9 Central Técnica e Suporte | Autorização e recorte próprios. |

Esses sete itens permanecem pendentes no macro. Não foram cancelados nem marcados como implementados para aumentar o percentual de conclusão.

## Evidências reutilizadas e manutenção

- [Publicação consolidada](.codex/plans/micro-plano-publicacao-consolidada-2026-09-11.md): TypeScript/build aprovados; 44 arquivos e 304 testes Vitest; navegador desktop/mobile e verificação dos DTOs com HTTP interceptado.
- [Finalização comercial](.codex/plans/micro-plano-finalizacao-front-2026-09-10.md): cinco cotações, cadastro manual/importação a partir da cotação e PDF exercitados, incluindo impressão e revisão visual.
- [Reconciliação](resultado-reconciliacao-front-2026-09-11.md) e [nulabilidade](resultado-nulabilidade-2026-09-11.md): 67 tabelas representadas com zero campos ausentes/extras e zero diferenças de nulabilidade. A tabela técnica `integracao_logs` é exclusiva do backend. Isso não certifica toda semântica, FK executada ou edição de todas as colunas.
- Dívida conhecida: 32 ocorrências de lint legadas em três arquivos e aviso de tamanho dos chunks. Permanecem manutenção técnica; não foi afirmada uma baseline de lint global limpa.
- Esta rodada alterou apenas Markdown. Foram verificadas cobertura do inventário, referências locais, coerência dos checklists e diff; a matriz de testes da aplicação foi reutilizada por não haver mudança de código.

## Continuidade

A partir deste marco, novas demandas entram como manutenção, evolução ou integração/homologação, com escopo e validação correspondentes. Defeito descoberto em fluxo aceito deve ser corrigido e revalidado; a condição de encerramento da V1 não o oculta nem impede correções. Mudanças de contrato continuam exigindo par DBML/instruções versionado conjuntamente.

O hand-off está preparado para revisão e implementação pela equipe de backend. Este registro não afirma que a equipe já o recebeu ou aprovou. A documentação foi concluída localmente; o usuário autorizou sua publicação em seguida. O histórico Git e a PR correspondente registram o resultado da publicação, sem ampliar este aceite para o sistema integrado.
