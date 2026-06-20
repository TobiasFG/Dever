# Frontend conventions (`src-ui/`)

React 19 + Vite + TypeScript. The frontend owns presentation only — it never shells out
or touches the filesystem; all such work goes through Tauri commands. `features/repos` is
the reference implementation — copy its shape.

## Layout

```
src-ui/
  main.tsx, App.tsx, styles.css
  lib/                 cross-feature helpers (e.g. ipc.ts — typed invoke wrapper)
  components/          shared/presentational components (Icon, dashboard shell)
  theme/               design tokens
  features/
    <feature>/
      types.ts         TS mirror of the Rust model (camelCase — matches serde)
      api.ts           invoke() calls, typed returns. The only place invoke() is called.
      use<Feature>.ts  React hook: state, loading, error, actions
      derive.ts        pure presentation logic (raw model → view model)
      components/       feature-specific components
```

## Styling

Plain CSS. The design palette lives as CSS variables in `src-ui/styles.css` (Atlassian
dark theme tokens) — use those tokens, don't hard-code colors.

## Testing

Vitest + Testing Library. Test pure functions (`derive.ts`) directly and hooks/`api.ts`
with `invoke` mocked. Test files sit next to the code as `*.test.ts(x)`.

> The IPC surface (`types.ts` mirroring, the `api.ts` chokepoint) is governed by
> [`ipc-contract.md`](./ipc-contract.md), which loads alongside this file.
