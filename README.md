# Dev'er 👨‍💻

Dever is a cross-platform **desktop** app (macOS, Linux, Windows) that helps developers with everyday tasks, provides overviews, and automates tedious work.

Built with **[Tauri v2](https://v2.tauri.app/)** (Rust backend + the OS's native webview) and a **React 19 + Vite + TypeScript** frontend.

## Install it (you just want to use Dever)

1. Grab the latest `Dever_x.y.z_x64-setup.exe` from
   [Releases](https://github.com/TobiasFG/Dever/releases/latest).
2. Run it. Windows shows "Windows protected your PC" because the installer isn't
   code-signed yet — **More info → Run anyway**. It installs for your user only, so no
   admin rights are needed.

After that, Dever updates itself: it checks on launch, and the version chip next to the
wordmark turns into **Update to x.y.z** when a new release is out. Click it, then restart.
No more warnings after the first install.

## Prerequisites (you want to work on Dever)

- [Bun](https://bun.sh)
- [Rust toolchain](https://www.rust-lang.org/tools/install) (`rustup`)
- Platform build deps — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)
  (macOS: Xcode Command Line Tools; Linux: WebKitGTK + build essentials; Windows: WebView2 + MSVC)

## Get started

1. Install dependencies:

   ```bash
   bun install
   ```

2. Launch the desktop app (opens a native window, hot-reloads on change):

   ```bash
   bun run desktop
   ```

## Scripts

| Command                 | What it does                                                                    |
| ----------------------- | ------------------------------------------------------------------------------- |
| `bun run desktop`       | Launch the native desktop app (Tauri dev)                                       |
| `bun run desktop:build` | Build a distributable native bundle (`.app`/`.dmg`, `.deb`/`.AppImage`, `.msi`) |
| `bun run dev`           | Run the frontend only in a browser at http://localhost:1420                     |
| `bun run build`         | Type-check and build the frontend                                               |

## Project layout

- `src-ui/` — React frontend (`App.tsx`, `features/`, `components/`, `lib/`, `theme/`, `styles.css`)
- `src-tauri/` — Rust backend, Tauri config, and native commands

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the feature-sliced structure and conventions.

## Contributing

See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) for the workflow, conventions, and the quality gate.
