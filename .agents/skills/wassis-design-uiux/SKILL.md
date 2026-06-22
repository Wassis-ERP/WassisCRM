---
name: wassis-design-uiux
description: Use this skill for any UI/UX work on W.Assis and WassisCRM, including interface design, visual consistency, product patterns, design-system usage, prototypes, and front-end presentation aligned to the brand.
user-invocable: true
---

# W.Assis Design System

This is the UI/UX skill for the W.Assis ecosystem. Use it whenever you need to design, review, or implement interfaces for WassisCRM or any adjacent product surface.

## What this skill covers

- Product UI/UX decisions
- Visual language and design consistency
- Token-based styling and component usage
- Prototype and mock generation
- Production-facing front-end guidance
- Layout, spacing, typography, colors, and interaction patterns

## How to use it

1. Read `readme.md` first for the full design-system rules.
2. Explore `tokens/`, `components/`, `ui_kits/`, `guidelines/`, and `assets/` as needed.
3. For prototypes or throwaway mocks, use `styles.css` and `_ds_bundle.js`.
4. For production work, copy and apply the design tokens and follow the semantic naming already used by the system.

## Core rules

- Everything is in Brazilian Portuguese (`pt-BR`).
- Brand blue is `#004FC2`.
- Use ramo colors only for categorization, never for status.
- Use Rubik for display, Mulish for body text, and JetBrains Mono for IDs or numeric data.
- Use lucide icons only.
- Avoid emoji.
- Keep the interface dense, operational, and consistent with the W.Assis product language.

## When the skill is invoked

If the user does not specify the exact output format, assume they want the best UI/UX recommendation for the W.Assis system and proceed using the design-system rules.
