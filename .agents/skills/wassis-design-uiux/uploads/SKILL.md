---
name: wassis-design
description: Use this skill to generate well-branded interfaces and assets for W.Assis (W.Assis Corretora de Seguros) — a Brazilian insurance brokerage and its WassisCRM product — either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files (`tokens/`, `components/`, `ui_kits/`, `guidelines/`, `assets/`).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view — link `styles.css` and load `_ds_bundle.js` to use the React components from `window.WAssisDesignSystem_502d77`. If working on production code, copy the `tokens/` CSS and read the rules here to become an expert in designing with this brand.

Key facts to keep in mind:
- Everything is in **Brazilian Portuguese (pt-BR)** — insurance domain terms: segurado, apólice, prêmio, sinistro, ramo, vigência, cotação.
- Brand blue is `#004FC2`; each insurance line ("ramo") has its own official color. Use ramo colors for categorization, never for status (use StatusBadge tones).
- Type: Rubik (display) + Mulish (text, substitutes the licensed Gilroy) + JetBrains Mono. Icons: lucide only. **No emoji** (only `★` for win-eligible stages).
- Signature UI traits: dense "operational cockpit" feel, compact corner radii, soft shadows, and UPPERCASE micro-labels with wide tracking next to normal-case titles.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
