---
name: WassisCRM
description: CRM operacional para corretoras de seguros da W.Assis, denso, claro e aderente ao contrato do produto.
colors:
  brand-blue: "#004FC2"
  brand-blue-deep: "#053D96"
  brand-ink: "#303030"
  neutral-0: "#FFFFFF"
  neutral-50: "#F8FAFC"
  neutral-100: "#F1F5F9"
  neutral-200: "#E2E8F0"
  neutral-300: "#CBD5E1"
  neutral-500: "#64748B"
  neutral-700: "#334155"
  neutral-900: "#0F172A"
  neutral-950: "#060B17"
  success: "#16A34A"
  warning: "#F59E0B"
  danger: "#DC2626"
  ramo-saude: "#005938"
  ramo-vida: "#FF5400"
  ramo-residencia: "#5C4091"
  ramo-empresarial: "#AB120D"
  ramo-previdencia: "#F09957"
typography:
  display:
    fontFamily: "Rubik, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Rubik, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Rubik, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Mulish, Gilroy, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Mulish, Gilroy, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.06em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Code, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 500
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.neutral-0}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
  button-secondary:
    backgroundColor: "{colors.neutral-0}"
    textColor: "{colors.brand-blue}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
  card:
    backgroundColor: "{colors.neutral-0}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.neutral-0}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
---

# Design System: WassisCRM

## 1. Overview

**Creative North Star: "Cockpit Operacional W.Assis"**

WassisCRM e uma ferramenta de trabalho para corretoras de seguros. A interface deve parecer uma cabine de operacao bem calibrada: informacao visivel, acoes evidentes, densidade controlada e pouca decoracao. O design serve a triagem, o acompanhamento e a decisao; ele nao transforma telas operacionais em paginas de apresentacao.

A linguagem visual vem do sistema W.Assis existente: azul institucional, superficies claras, suporte completo a dark mode, tipografia Rubik/Mulish/JetBrains Mono, ramos como categorizacao e semantica propria para status. O produto rejeita landing page SaaS generica, gradientes decorativos, glassmorphism, emoji, ilustracoes improvisadas, cards arredondados demais e qualquer fluxo dependente de dialogos nativos do navegador.

**Key Characteristics:**
- Denso, operacional e escaneavel.
- Azul W.Assis como acento de acao e selecao.
- Cores de ramo somente para categoria de seguro.
- Estados semanticos claros para sucesso, alerta, perigo e informacao.
- Componentes familiares, consistentes e reaproveitados entre telas.

## 2. Colors

A paleta e restrita por padrao: neutros azulados sustentam leitura, o azul W.Assis marca acao e selecao, e as cores de ramo aparecem apenas como classificacao do seguro.

### Primary
- **Azul W.Assis**: cor primaria institucional. Use em CTAs, links, navegacao ativa, foco de acao e elementos selecionados.
- **Azul Profundo**: estado hover/pressionado, surfaces de marca e apoio em avatar, barra ou indicador quando houver necessidade real de contraste.

### Secondary
- **Ink W.Assis**: texto forte, dados de alta prioridade e ramo Portateis.
- **Ramos de Seguro**: Saude, Vida, Auto, Moto, Residencia, Empresarial e Previdencia. Use em badges, cards de negocio e cabecalhos de contexto; nunca use essas cores para status.

### Neutral
- **Canvas Claro**: fundo geral do app.
- **Surface Branca**: cards, modais, sidebars e paineis.
- **Linha Neutra**: bordas, divisores e hover de tabela.
- **Ink Escuro**: texto principal e dados.

### Named Rules

**The Ramo-Is-Category Rule.** Cor de ramo categoriza seguro; status sempre usa sucesso, alerta, perigo, info ou neutro.

**The Restrained Accent Rule.** Azul W.Assis e raro o bastante para apontar acao. Nao use azul como decoracao de fundo sem funcao.

## 3. Typography

**Display Font:** Rubik, com fallback Helvetica/Arial.
**Body Font:** Mulish, substituindo Gilroy quando a fonte licenciada nao estiver disponivel.
**Label/Mono Font:** JetBrains Mono para IDs, CPF/CNPJ, datas e valores tecnicos.

**Character:** Rubik entrega titulos e KPIs firmes; Mulish mantem formularios, tabelas e textos legiveis; JetBrains Mono separa dados auditaveis e identificadores.

### Hierarchy
- **Display** (700, 44px, 1.15): titulos de pagina e destaques raros.
- **Headline** (600, 30px, 1.3): secoes principais, modais grandes e grupos de configuracao.
- **Title** (600, 24px, 1.3): cards, paineis e subtitulos.
- **Body** (400-600, 14-16px, 1.5): formularios, tabelas, listas e texto operacional.
- **Label** (600-700, 10-12px, 0.06em, caixa-alta): labels de campo, micro-rotulos e cabecalhos compactos.
- **Mono** (400-600, 12-14px): identificadores, documentos, datas e valores onde alinhamento ajuda a leitura.

### Named Rules

**The Product-Scale Rule.** Produto usa escala fixa, nao tipografia fluida. Titulos grandes demais dentro de cards, tabelas ou sidebars sao erro de hierarquia.

## 4. Elevation

O sistema usa sombras suaves e bordas discretas para separar superficies. Em light mode, a elevacao e sutil; em dark mode, sombras ganham opacidade e uma linha interna leve. Borda e sombra larga no mesmo elemento devem ser evitadas quando virarem decoracao.

### Shadow Vocabulary
- **Shadow 1**: superficie em repouso, cards e paineis comuns.
- **Shadow 2**: hover de card, menus, dropdowns e elementos temporariamente acima do plano.
- **Shadow 3**: modal, drag ativo e superficies realmente elevadas.
- **Shadow Brand**: CTA primario e destaque pontual de marca.

### Named Rules

**The Flat-At-Rest Rule.** Superficies operacionais ficam quietas em repouso. Elevacao aparece para hover, drag, modal, foco ou prioridade real.

## 5. Components

### Buttons
- **Shape:** pilula para CTAs e botoes primarios de comando; raio compacto para botoes dentro de listas e ferramentas.
- **Primary:** azul W.Assis com texto branco, peso forte e sombra de marca apenas quando o botao e a acao principal da area.
- **Hover / Focus:** hover escurece ou troca para `--accent-primary-hover`; foco usa ring azul com contraste; disabled reduz opacidade sem mudar semantica.
- **Secondary / Ghost:** superficies neutras, texto azul ou `fg-2`, borda fina e hover em `bg-surface-2`.

### Chips
- **Style:** badges compactos, texto forte, raio pill. RamoBadge usa cor do ramo; StatusBadge usa semantica.
- **State:** filtros ativos usam azul W.Assis; filtros por ramo mantem cor de ramo so como categoria.

### Cards / Containers
- **Corner Style:** cantos compactos, normalmente 8px.
- **Background:** `--bg-surface` sobre `--bg-app`.
- **Shadow Strategy:** `--shadow-1` em repouso, `--shadow-2` apenas quando houver hover ou destaque.
- **Border:** `--border-1`; acento lateral grosso e proibido salvo componente legado ja documentado como temporario.
- **Internal Padding:** 16-24px na maioria dos paineis, ajustando para tabelas densas.

### Inputs / Fields
- **Style:** superficie branca ou `bg-surface-2`, borda `border-1`, raio 8-12px conforme contexto.
- **Focus:** borda azul e foco visivel; placeholder precisa manter contraste.
- **Error / Disabled:** erro usa danger com texto claro; disabled preserva layout e reduz affordance.

### Navigation
- Sidebar fixa com logotipo W.Assis, icones lucide, item ativo em `accent-primary-soft` e texto azul. Itens inativos usam `fg-3` e hover neutro. Rotulos permanecem em pt-BR e devem caber quando a sidebar estiver expandida; no modo colapsado, o `title` assume o nome.

### Kanban Card

Componente assinatura dos funis. Deve ser compacto, arrastavel, com hierarquia clara para segurado, ramo, premio, prazo, responsavel e status. A cor do ramo ajuda a reconhecer categoria, mas nao comunica ganho, perda, atraso ou erro.

## 6. Do's and Don'ts

### Do:
- **Do** usar `nexus-crm/src/design-system/colors_and_type.css` como fonte visual normativa quando implementar telas React/Tailwind.
- **Do** consultar `.agents/skills/wassis-design-uiux` antes de desenhar ou alterar telas do WassisCRM.
- **Do** usar lucide-react para icones, com stroke consistente e tamanho entre 12px e 20px na maioria dos controles.
- **Do** validar contraste, foco, fechamento por Esc/clique fora em modais e estados de loading/empty/error nos fluxos principais.
- **Do** manter copy em portugues do Brasil, objetiva e com termos do mercado de seguros.

### Don't:
- **Don't** usar landing page SaaS generica, hero marketing ou layout promocional em telas operacionais.
- **Don't** usar gradiente decorativo, glassmorphism, bokeh, fundo ilustrativo, grid decorativo ou textura sem funcao.
- **Don't** usar emoji ou icones fora de lucide.
- **Don't** usar `window.confirm`, `window.alert`, `window.prompt` ou `alert` em fluxos do produto.
- **Don't** usar cor de ramo como status.
- **Don't** criar cards com raio maior que 12px em superficies operacionais, exceto pills de badge/botao.
- **Don't** combinar borda fina e sombra larga como decoracao em cards ou botoes.
- **Don't** inventar estrutura visual que contrarie os artefatos oficiais do contrato de dados.
