---
name: jellyfin-components
description: Use Jellyfin's React primitives and tokens so new UIs stay consistent with the modern audio-first rewrite.
---

## What I do

- Capture the current thinking around `ui-primitives`/Radix-based controls, responsive layouts, and typography tokens so component work stays intentional.
- Explain how to compose reusable pieces (`Button`, `Dialog`, `Select`, `VolumeSlider`, `QueueTable`, etc.) without reintroducing legacy DOM hacks.
- Outline the form, table, and animation patterns (TanStack Form/Query/Table/Virtual, DnD-kit, purposeful motion) that the team expects.

## When to use me

- Starting or iterating on a new route/component and you want to keep layout, spacing, typography, and motion consistent.
- Replacing legacy markup with primitives (preferring `vars.spacing`, `vars.typography`, `Radix` components, and `Zustand`/`react-query` for state).
- Evaluating whether to build a new primitive or consume an existing one from `src/components/ui-primitives`.

## Key rules

- Import tokens from `src/styles/tokens.css.ts` and layout utilities from `styles/layout.css.ts`; hardcode px only for rare, one-off cases.
- Avoid `querySelector`/`document.*`; keep everything in React state/hooks and refs.
- Prefer expressive typography and spacing tokens instead of raw numbers, and wrap inputs with `FormControl`/`FormLabel`/`FormHelperText` for accessibility.
- When a component needs animation, favor Radix motion or targeted Framer Motion; avoid generic “smooth” transitions that hide purpose.
- Use TanStack tooling for forms/tables/virtual lists and dnd-kit for drag handles so the modern UX stays consistent.
