# Product

## Register

product

## Users

Corretores, gestores, produtores, operadores e equipes administrativas de corretoras de seguros brasileiras. Eles trabalham em rotinas de alta densidade operacional: cadastrar segurados, acompanhar oportunidades, emitir propostas e apolices, tratar sinistros, cobrar parcelas, controlar comissoes e preparar renovacoes entre corretoras de um mesmo grupo.

O contexto de uso e de mesa de trabalho: comparacao rapida, decisao com prazo, consultas repetidas e pouca tolerancia a ambiguidade. A interface deve permitir leitura de carteira, funis e detalhes sem ornamentacao ou etapas desnecessarias.

## Product Purpose

WassisCRM e o frontend operacional do ERP/CRM da W.Assis para corretoras de seguros. O produto organiza o ciclo de vida do relacionamento: segurado, oportunidade, calculo, cotacao, proposta, apolice, item segurado, sinistro, pos-venda, financeiro, produtores, perfis e configuracoes.

O sucesso do produto e uma experiencia previsivel e aderente ao contrato do esqueleto DBML vigente, rodando contra mock em memoria neste repositorio e preparando hand-offs claros para a equipe de backend. O design deve servir o trabalho, nao competir com ele.

## Brand Personality

Profissional, direto e confiavel.

A voz e de ferramenta de trabalho: pt-BR, termos do mercado de seguros, rotulos objetivos, pouca conversa, nenhuma promessa vaga. A sensacao desejada e de cockpit operacional: denso, legivel, consistente e pronto para uso diario.

## Anti-references

- Landing page SaaS generica, hero marketing ou layout promocional.
- Gradientes decorativos, glassmorphism, bokeh, fundos ilustrativos ou textura sem funcao.
- Paletas monocromaticas sem hierarquia ou excesso de roxo/azul decorativo.
- Cards excessivamente arredondados, sombras largas com borda fina e UI com aparencia de geracao automatica.
- Emoji, ilustracoes improvisadas e icones fora de lucide.
- Dialogos nativos do navegador em fluxos do produto.
- Qualquer tela que use cor de ramo como status ou reabra decisoes fechadas do contrato de dados sem fato novo.

## Design Principles

1. Operacao antes de apresentacao. A primeira tela deve resolver o fluxo de trabalho, com densidade, hierarquia e controles claros.
2. Aderencia ao contrato. Nomes, entidades e estados de negocio seguem os artefatos oficiais, nao o legado quando houver drift.
3. Sistema antes de invencao. Reutilizar tokens, componentes, hooks, tabs e padroes existentes antes de criar uma linguagem nova.
4. Cor com responsabilidade. Azul W.Assis guia acao e selecao; cores de ramos categorizam seguros; cores semanticas comunicam status.
5. Previsibilidade em cada fluxo. Modais, feedback, validacoes e estados devem ser internos ao sistema, acessiveis e reversiveis quando aplicavel.

## Accessibility & Inclusion

Alvo minimo: contraste WCAG AA, foco visivel, navegacao por teclado nos fluxos interativos e respeito a `prefers-reduced-motion`. Informacao critica nao deve depender somente de cor; status e ramos precisam de texto, icone ou rotulo. Layouts devem ser validados em desktop comum, zoom 100%, sem texto cortado, sobreposicao ou estouro em botoes, cards, tabelas e formularios.
