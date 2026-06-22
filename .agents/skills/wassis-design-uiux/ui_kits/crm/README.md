# UI Kit — WassisCRM

Recriação de alta fidelidade do **WassisCRM** (`nexus-crm`), o frontend de CRM/Kanban da W.Assis. Baseado no código real do repositório `Wassis-ERP/WassisCRM` (React 19 + Tailwind CSS 4).

## Telas

`index.html` é um app interativo com navegação real entre módulos:

- **Dashboard** (`DashboardScreen.jsx`) — KPIs, gráfico de produção mensal, ranking de produtores, feed de atividades.
- **Oportunidades** (`KanbanScreen.jsx`) — funil Comercial com colunas, filtros e **arrastar-e-soltar** entre etapas.
- **Segurados** (`SeguradosScreen.jsx`) — tabela da carteira com avatar, ramos e status.
- Demais módulos (Sinistros, Emissão, Pós-Venda, Financeiro, Painel, Configurações) mostram um placeholder — usam o mesmo funil Kanban, omitido aqui.

O shell (`Shell.jsx`) reproduz a sidebar colapsável (com logo que troca em dark mode), o header com busca global + seletor de filial + avatar, e o **toggle de tema claro/escuro** (botão "Alterar Tema" na sidebar).

## Como funciona

- Componentes do design system vêm do bundle: `window.WAssisDesignSystem_502d77` (`Button`, `KanbanCard`, `KpiCard`, `Card`, `StatusBadge`, `RamoBadge`, `Avatar`, `Input`, `Select`).
- Ícones: `icons.js` traz o set do lucide (mesmo usado no app) como SVG inline, sem CDN.
- Cada arquivo de tela é envolto numa IIFE e se expõe em `window.<Screen>` para evitar colisão de escopo entre blocos Babel.

## Fonte

Código original: https://github.com/Wassis-ERP/WassisCRM (`nexus-crm/src`). Esta recriação é cosmética — sem backend, dados em memória/mock.
