# W.Assis — Design System

Sistema de design da **W.Assis Corretora de Seguros**, uma corretora de seguros brasileira. Reúne os fundamentos visuais da marca, tokens, componentes React reutilizáveis e a recriação de alta fidelidade do produto principal (WassisCRM).

> **Idioma:** o produto é todo em **português do Brasil**. Copy, rótulos e nomes de componentes seguem o pt-BR.

---

## Fontes (materiais de origem)

Este sistema foi destilado a partir do código real do produto. Explore os repositórios para construir designs mais fiéis:

- **WassisCRM (frontend)** — https://github.com/Wassis-ERP/WassisCRM
  App principal em `nexus-crm/` (React 19, Vite, **Tailwind CSS 4**, TypeScript). O design system original vive em `nexus-crm/src/design-system/colors_and_type.css` e os componentes em `nexus-crm/src/components/`, `src/modules/`, `src/pages/`.
- Repositórios relacionados na mesma org (não usados diretamente aqui): `Wassis-ERP/WAssisBE` (backend), `Wassis-ERP/WassisFE`, `julianocalill/w.assis.crm`.

A paleta e a tipografia derivam do **Manual da Marca W.Assis** (`Apresentação_WAssis_LogoFinal.pdf`), referenciado nos comentários do CSS original.

### ⚠ Substituição de fonte sinalizada
A fonte de texto oficial é **Gilroy** (comercial/licenciada). Como não temos os arquivos, usamos **Mulish** (Google Fonts) — geometria humanista quase idêntica — como substituta. Os títulos usam **Rubik** (oficial, disponível no Google Fonts). **Se você tiver os arquivos do Gilroy**, troque o `@import` em `tokens/fonts.css` por `@font-face` locais e ajuste `--font-text` em `tokens/typography.css`.

---

## O produto

O **WassisCRM** ("nexus-crm") é um CRM operacional organizado em **funis Kanban por módulo**:

- **Comercial** — novas oportunidades de venda
- **Emissão** — apólices em processo de emissão
- **Pós-Venda** — atendimento e renovações
- **Financeiro** — cobranças e comissões
- **Sinistro** — acompanhamento de sinistros

Conceitos centrais: **segurados** (pessoas/empresas), **oportunidades**, **apólices**, **propostas** e **ramos de seguro**. Cada **ramo** (Auto, Vida, Saúde, Moto, Residência, Empresarial, Portáteis, Previdência) tem uma **cor oficial** usada de forma consistente em badges, cards e cabeçalhos.

---

## CONTENT FUNDAMENTALS — como escrevemos

- **Idioma:** português do Brasil, sempre. Termos do mercado de seguros em PT: *segurado, apólice, prêmio, sinistro, ramo, vigência, cotação, corretora, filial*.
- **Tom:** profissional e direto, de ferramenta de trabalho. Conciso, sem floreio. Não conversa com o usuário ("Bem-vindo de volta!") — rotula e informa.
- **Pessoa:** impessoal/imperativo nas ações ("Nova Oportunidade", "Buscar...", "Limpar", "Marcar como Ganho"). Sem "eu"; "você" raramente.
- **Caixa:** dois registros convivem:
  - **Títulos de página** em Rubik, *Title case* normal ("Dashboard", "Segurados").
  - **Micro-rótulos / cabeçalhos de coluna / labels de campo** em **CAIXA-ALTA com tracking largo** e peso forte ("PRÊMIO", "RETORNO", "TODOS OS RAMOS"). Esse contraste é uma assinatura da UI.
- **Números:** moeda em `R$ 1.234,56` (pt-BR); valores compactos em listas (`R$ 48,5K`, `R$ 2,8M`). Datas `dd/mm/aa`. CPF/CNPJ e IDs em fonte mono.
- **Status:** vocabulário fixo — *Ativo, Inativo, Prospecto, Renovar, Em cotação, Atrasada, Pendente, Concluída, Ganho, Perdido*. Cada um mapeia para um tom semântico (ver StatusBadge).
- **Emoji:** **não.** O único símbolo decorativo recorrente é a estrela `★` para "etapa elegível a ganho". Tudo o mais é ícone lucide.
- **Vibe:** denso, eficiente, "cockpit operacional" — muita informação por tela, hierarquia clara, zero ruído ilustrativo.

---

## VISUAL FOUNDATIONS

### Cor
- **Primária:** Azul W.Assis `#004FC2` — CTAs, links, estado ativo, acentos. Azul escuro `#053D96` para hover/pressionado e gradientes de avatar/barras.
- **Ink** `#303030` — texto forte e o ramo "Portáteis".
- **Ramos (secundárias):** Saúde verde `#005938`, Vida laranja `#FF5400`, Auto azul, Moto azul-escuro, Residência roxo `#5C4091`, Empresarial vermelho `#AB120D`, Previdência pêssego `#F09957`. Usadas como código de cor, **nunca** para status.
- **Sinais:** sucesso `#16A34A`, alerta `#F59E0B`, perigo `#DC2626`, info = azul da marca. Badges de status usam o tom em ~15% de alpha sobre o fundo.
- **Neutros:** cinzas levemente azulados (família Slate). Fundo do app é `--neutral-50` (quase branco), superfícies brancas.
- **Dark mode** completo: grade cinza-neutra estilo Discord (`#292B2F` canvas, `#36393F` superfície); acentos e ramos remapeiam para variantes OKLCH mais claras (`-on-dark`). Ative com `class="dark"` em qualquer ancestral.

### Tipografia
- **Display:** Rubik (títulos, KPIs, números grandes), peso 600–800, tracking levemente negativo.
- **Texto:** Mulish (corpo, formulários, tabelas), 400–700.
- **Mono:** JetBrains Mono (valores, CPF/CNPJ, IDs, datas).
- Escala 1.250 (Major Third), base 16px. Micro-rótulos a 9–11px em caixa-alta.

### Espaço, raio, sombra
- Grid de **4pt**. Raios **compactos** (4/6/8/12px) — cantos sóbrios, nada muito arredondado; `pill` (9999px) só em botões-CTA, badges e a busca.
- **Sombras suaves**, nunca pretas duras em light (`--shadow-1/2/3`); em dark viram pretos mais opacos + highlight interno sutil. `--shadow-brand` é uma sombra azul para CTAs.

### Superfícies & bordas
- Cards = `--bg-surface` + borda fina `--border-1` + `--shadow-1` + raio 8px. Sem borda colorida só na esquerda; o acento, quando existe, é uma **barra vertical fina** (`accentBar`) ou a borda inteira tingida por prazo (cards de Kanban).
- Linhas de tabela com hover em `--bg-surface-2`.

### Movimento
- Entradas suaves: `fadeIn` (8px de subida) e `slideInLeft`, com `--ease-out` `cubic-bezier(0.16,1,0.3,1)`, duração 200–320ms.
- **Hover:** botões escurecem via `brightness(0.94)`; cards sobem de `--shadow-1` para `--shadow-2`; itens de nav e linhas ganham fundo `--bg-surface-2`.
- **Press / drag:** o card de Kanban tem `cursor: grab` e a coluna-alvo destaca o fundo no drag-over.
- Sem bounce em UI; sem animações decorativas em loop. `--ease-bounce` existe mas é reservado.

### Imagem & ilustração
- Marca = **círculo azul com um "W" em onda branca**. A onda é o motivo central (movimento/continuidade/proteção).
- O produto é **livre de ilustração** — é uma ferramenta densa. Não invente ilustrações, gradientes decorativos ou fundos texturizados.

---

## ICONOGRAPHY

- **Sistema:** [**lucide**](https://lucide.dev) (lucide-react no código original), stroke `2`, linecap/linejoin `round`, tamanhos 12–20px. É a única biblioteca de ícones.
- No código: `import { LayoutDashboard, Users, Kanban, ... } from 'lucide-react'`. Para HTML estático, use o CDN do lucide ou o helper `ui_kits/crm/icons.js` (mesmo set como SVG inline).
- **Ícones de navegação:** Dashboard `LayoutDashboard`, Segurados `Users`, Oportunidades `Kanban`, Painel `LayoutGrid`, Sinistros `AlertTriangle`, Emissão `FileText`, Pós-Venda `LifeBuoy`, Financeiro `DollarSign`, Configurações `Settings`.
- **Emoji:** não se usa. **Unicode:** apenas `★` (estrela) para etapa de ganho. Ícones sempre herdam `currentColor`.
- Favicon/marca: `assets/brand/` (logo completo, versões clean/dark da sidebar, símbolo, favicon).

---

## Índice — o que há aqui

**Raiz**
- `styles.css` — ponto de entrada único (só `@import`s). Consumidores linkam este arquivo.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `base.css` (reset + helpers `.h1/.body/.eyebrow` + animações).
- `assets/brand/` — logos, símbolo, favicon. Inclui o **símbolo branco** (`wassis-mark-white.png`) para fundos escuros / dark mode. `assets/hero.png` (ilustração genérica de template, não-marca).
- `readme.md` (este arquivo), `SKILL.md`.

**Componentes** (`components/`) — `window.WAssisDesignSystem_502d77`
- `buttons/` — **Button** (primary/secondary/ghost/danger, `pill` CTA), **IconButton**
- `forms/` — **Input** (label/ícone/erro/pill), **Select**
- `feedback/` — **StatusBadge** (tom semântico), **RamoBadge** (cor de ramo)
- `data/` — **Card** (superfície de seção), **KpiCard**, **Avatar**
- `kanban/` — **KanbanCard** (componente-assinatura dos funis)

**UI kit** (`ui_kits/crm/`) — recriação interativa do WassisCRM: Shell + Dashboard + Kanban (drag-and-drop) + Segurados. Ver `ui_kits/crm/README.md`.

**Cards de fundamentos** (`guidelines/`) — specimens da aba Design System (Type, Colors, Spacing, Brand).

---

## Usando o design system

Em HTML, linke o CSS e carregue o bundle compilado:

```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
<script type="text/babel">
  const { Button, KanbanCard, StatusBadge } = window.WAssisDesignSystem_502d77
</script>
```

Em produção React/Tailwind, copie `tokens/` e referencie os tokens semânticos (`--accent-primary`, `--fg-1`, `--bg-surface`, `--ramo-*`) — eles já adaptam light/dark sozinhos.
