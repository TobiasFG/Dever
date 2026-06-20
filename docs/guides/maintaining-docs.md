# Maintaining the docs

Dever's documentation has one home — `/docs` — and reaches agents through thin **adapters**
that point back to it, never by copying. This guide is how to add, edit, or extend any of
it. (It is itself an example of the pattern: a guide in `/docs`, surfaced by a
pointer-skill.)

## Where knowledge goes — and how it reaches an agent

| Knowledge                                                         | Lives in                                                     | Reaches the agent via                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Conventions for a specific tree                                   | `docs/conventions/<area>.md`                                 | a nested `CLAUDE.md` `@import` — auto-loads while working in that tree |
| A procedure done on request                                       | `docs/guides/<name>.md`                                      | a pointer-skill                                                        |
| Project overview, architecture, principles, contribution workflow | `README.md` + `docs/` (`ARCHITECTURE.md`, `CONTRIBUTING.md`) | `@import`ed eagerly by the project `.claude/CLAUDE.md`                 |

Content always lives in `/docs` (or `README.md`). `CLAUDE.md` files and skills hold only
references — `@import`s or pointers — never their own copy: the project `.claude/CLAUDE.md`
imports the always-on docs, each nested `CLAUDE.md` imports its tree's conventions, and
skills point to a guide. Pick exactly one channel per doc; if two fit, it's probably two
docs.

## Add or extend a convention

1. Write or edit `docs/conventions/<area>.md`.
2. Make sure the right nested `CLAUDE.md` imports it — e.g. `@../docs/conventions/<area>.md`.
   A new tree gets a new nested `CLAUDE.md` containing only `@import` lines; an existing
   tree (`src-tauri/`, `src-ui/`) already imports its area.
3. `bun run check`.

## Add a guide (a procedure)

1. Write `docs/guides/<name>.md` — the full procedure, for humans and agents alike.
2. Create `.claude/skills/<name>/SKILL.md` with nothing but the frontmatter and a pointer:

   ```
   ---
   name: <name>
   description: <sharp trigger — what task makes an agent reach for this>
   ---

   # <Title>

   Read `docs/guides/<name>.md` and follow it.
   ```

3. Reload skills so the new one registers (`/reload-skills`, or restart the session).
4. `bun run check`.

## Edit an existing doc

Edit the file in `/docs`. It is live immediately — agents read it on demand or re-import
it; no reload. The **only** thing that needs a skills reload is editing a skill body, which
should be rare because skills are pure pointers.

## Invariants

- **Single source.** Content lives once, in `/docs` (or `README.md`). Adapters point or
  import — never copy.
- **One channel per doc** (a nested-`CLAUDE.md` import _or_ a skill, not both).
- **Adapters carry no prose.** A skill body is its `description` plus `Read … and follow it`;
  every `CLAUDE.md` (the project `.claude/CLAUDE.md` and the nested ones) is `@import` lines
  only.
- **Hyphenate filenames; never use `_`** — the Markdown formatter escapes underscores and
  breaks `@import` paths.
- `@import` paths are relative to the importing file (`@../docs/...`).

## Definition of done

- `bun run check` is green.
- If you added or renamed a skill, skills have been reloaded.
- No prose is duplicated between an adapter and `/docs`.
