---
target: tela de configurações
total_score: 21
p0_count: 0
p1_count: 4
timestamp: 2026-07-03T20-45-31Z
slug: nexus-crm-src-pages-settingspage-tsx
---
Method: dual-agent (A: 019f29b4-0cd7-7850-bdec-d4056a8dc7db · B: 019f29b4-3f7b-75a1-bd1f-41d7424042c1)

## Design Health Score

| # | Heurística | Score | Ponto-chave |
|---|---:|---:|---|
| 1 | Visibilidade do status | 2 | Há loading/erros, mas autosave, toggles e mudanças de permissão têm pouco feedback de sucesso. |
| 2 | Correspondência com o mundo real | 3 | Boa linguagem de corretora; “Edit/Del” quebra pt-BR na matriz. |
| 3 | Controle e liberdade | 2 | Modais têm cancelar/X, mas não há evidência de fechamento por Esc/clique fora. |
| 4 | Consistência e padrões | 2 | Abas usam padrões diferentes: cards, tabela, listas inline, matriz e modais próprios. |
| 5 | Prevenção de erros | 2 | Há confirmação para inativar, mas permissões e etapas mudam com pouco contexto de impacto. |
| 6 | Reconhecimento em vez de memória | 2 | Nove abas planas exigem saber onde cada configuração mora. |
| 7 | Flexibilidade e eficiência | 2 | Busca existe em algumas abas, mas falta busca global/favoritos/atalhos de configuração. |
| 8 | Estética e minimalismo | 3 | Visual limpo e aderente; a carga vem da arquitetura, não de decoração. |
| 9 | Recuperação de erros | 2 | Mensagens existem, mas são genéricas e nem sempre próximas da ação. |
| 10 | Ajuda e documentação | 1 | Pouca ajuda contextual nos pontos críticos: permissões, acesso por corretora e etapas. |
| **Total** |  | **21/40** | **Aceitável: base visual sólida, mas decisões críticas precisam de mais segurança.** |

## Anti-Patterns Verdict

**Parece IA?** Não no sentido visual mais óbvio. A tela evita gradientes decorativos, glassmorphism, hero SaaS, raios exagerados e paleta sem função. Ela parece uma UI operacional real do WassisCRM.

**LLM assessment:** o problema é menos “slop visual” e mais “configuração como gaveta única”. A interface empilha nove destinos equivalentes, mistura cadastros simples com permissões críticas e esconde ações administrativas em hover.

**Deterministic scan:** o detector local retornou `[]`: 0 achados, 0 regras acionadas, nenhum arquivo/linha reportado. Isso confirma que não há padrões automáticos óbvios de slop no alvo.

**Visual/browser evidence:** o in-app Browser/overlay não estava disponível; o subagente B usou Chrome headless como fallback. A tela abriu em `http://127.0.0.1:5173/configuracoes`, viewport 1440x900, sem sobreposição ou estouro horizontal visível. Screenshot gerado em `C:\tmp\wassis-settings-assessment-b-chrome-wait.png`. O servidor Vite iniciado para a inspeção foi encerrado.

## Impressão Geral

A tela está visualmente no caminho certo: densa, limpa, com token de marca e cara de ferramenta de trabalho. A maior oportunidade é transformar Configurações de uma lista plana de abas em um cockpit de administração por grupos, com mais segurança em ações de acesso, permissões e funis.

## O Que Funciona

- A linguagem visual respeita o WassisCRM: superfícies claras/escuras por token, azul para ação/seleção, lucide icons e cantos compactos.
- Produtores dentro de Configurações está correto para o modelo operacional e evita poluir a navegação principal.
- A tela já usa confirmador/feedback interno em ações destrutivas, em vez de `window.confirm`.

## Problemas Prioritários

**[P1] Navegação interna plana demais**

Por que importa: nove abas no mesmo nível misturam organização, usuários, permissões, funis e catálogos. Um gestor precisa formar um mapa mental para decidir se deve entrar em “Usuários e Perfis”, “Matriz de Permissões” ou “Corretoras/Filiais”.

Correção: agrupar a sidebar em “Organização”, “Acessos”, “Operação” e “Catálogos”; manter as rotas/ids atuais, mas adicionar cabeçalhos compactos e, se possível, busca de configuração.

Comando sugerido: `$impeccable layout nexus-crm/src/pages/SettingsPage.tsx`

**[P1] Ações escondidas no hover prejudicam teclado, touch e descoberta**

Por que importa: editar/inativar aparece com `opacity-0 group-hover` em cartões e listas. Isso cria botões focáveis porém invisíveis e tira controle de quem usa teclado, zoom, tablet ou touch.

Correção: deixar ações administrativas sempre visíveis em tabelas/listas, ou usar um botão “Mais ações” visível com `aria-label`, foco claro e menu previsível.

Comando sugerido: `$impeccable audit nexus-crm/src/pages/SettingsPage.tsx`

**[P1] Modais parecem não cumprir Esc/clique fora**

Por que importa: o AGENTS e o design system exigem fechamento por clique fora e `Esc`, exceto durante salvamento ou risco explícito. Os modais locais têm overlay e X, mas não mostram handler de backdrop/teclado.

Correção: criar/reusar um modal de sistema comum com `Esc`, clique fora, foco inicial e bloqueio durante `isSaving`; migrar ProdutorModal, modal de membro, PerfilNameDialog, FilialModal e StepsConfigModal gradualmente.

Comando sugerido: `$impeccable harden nexus-crm/src/pages/SettingsPage.tsx`

**[P1] Matriz de permissões é poderosa, mas arriscada**

Por que importa: os toggles `Ler/Criar/Edit/Del` alteram permissões imediatamente, sem rastro forte de “salvando/salvo” por célula. Em corretora, erro de permissão vira problema operacional.

Correção: trocar labels para `Ler/Criar/Editar/Excluir`, mostrar estado por célula ou por linha, explicar “Master bloqueado” no próprio ponto de uso e considerar resumo lateral por perfil selecionado.

Comando sugerido: `$impeccable clarify nexus-crm/src/components/admin/PermissionsMatrix.tsx`

**[P2] Funis & Etapas concentra decisões demais**

Por que importa: o modal de etapas combina ordem, nome, cor, flags de ganho/perda e exclusão em uma linha. Isso aumenta erro em uma configuração que altera funis operacionais.

Correção: separar “ordem e nome” de “regras de conclusão”; dar labels visíveis a ganho/perda; reduzir cores a presets nomeados por módulo.

Comando sugerido: `$impeccable shape nexus-crm/src/components/modals/StepsConfigModal.tsx`

## Persona Red Flags

**Alex, usuário avançado/gestor:** não tem busca global de configurações nem atalho para “permissões de Fulano”. Ele perde tempo navegando por abas.

**Sam, acessibilidade/teclado:** ações por hover e botões icon-only pequenos podem ficar invisíveis no foco, difíceis no zoom e pouco claros para leitor de tela.

**Gestor de corretora:** consegue mexer em permissões e etapas sem uma síntese clara do impacto operacional da mudança.

## Observações Menores

- O item ativo da sidebar interna usa `translate-x-1` e sombra de marca; funciona, mas pode parecer movimento excessivo para tela administrativa.
- “Gerencie os parâmetros, regras e automações do seu CRM” é genérico; melhor nomear cadastros, acessos e fluxos.
- Há variação entre “Corretoras/Filiais” e “Corretoras / Filiais”.
- O detector não acusou uso problemático de cores de ramo; o mapeamento de módulos parece categórico, aceitável no sistema W.Assis.

## Perguntas Para Considerar

- Configurações deve abrir como lista de abas ou como mapa agrupado por responsabilidade?
- Quais mudanças precisam de revisão explícita antes de salvar: permissões, funis, etapas ou todas?
- O gestor consegue responder em 5 segundos onde controla acesso por corretora?
