# Intro
Dever is a cross platform desktop application (macOS, Linux, Windows) designed to help developers with everyday tasks, provide overviews, and automate tedious tasks.

## Stack
Dever is built using:

Tauri v2 (Rust backend + system webview): https://v2.tauri.app/
React 19 + Vite + TypeScript for the frontend UI.
Plain CSS for styling — the design palette lives as CSS variables in `src/styles.css` (Atlassian dark theme tokens).
Bun as the node package manager.

## Layout
- `src/` — React frontend (`App.tsx`, `components/`, `data/`, `theme/`, `styles.css`).
- `src-tauri/` — Rust backend, Tauri config, native commands.

## Running
- `bun run desktop` — launch the native desktop app (Tauri dev).
- `bun run dev` — frontend only, in a browser at http://localhost:1420.
- `bun run desktop:build` — produce a distributable native bundle.
