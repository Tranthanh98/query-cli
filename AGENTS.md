# Agent Instructions for `query-cli`

## Runtime

- **Bun-only.** The app uses OpenTUI, which loads native Zig libraries via `Bun.dlopen()`. It will not run on Node.js.
- Entry point: `src/index.tsx` (also the `bin` target in `package.json`).

## Development Commands

```bash
bun run dev          # watch mode
bun run start        # run once
bun run typecheck    # tsc --noEmit
bun run compile      # bun build --compile → dist/query-cli (standalone binary)
```

There are **no tests, no linter, and no formatter** in this repo.

## Architecture

- **TUI app** with screen-based routing (`select` → `form` → `main`) via React Context in `src/app-context.tsx`.
- **Drivers** (`src/drivers/`): postgres, sqlite, mysql. Registered in `src/drivers/index.ts`.
- **State** is spread across React Contexts: `app-context`, `queries-context`, `schema-context`, `toast-context`, `ai-context`.
- **Slash commands** are defined in `src/commands/index.ts`.
- **AI providers**: Anthropic, Google, OpenAI (`src/ai/`).

## TypeScript Quirks

- `jsxImportSource` is `@opentui/react` (not `react-dom`). JSX elements render to OpenTUI primitives (`<box>`, `<text>`, etc.).
- `types` includes `bun-types`.
- `noUncheckedIndexedAccess` is `false`.

## Documentation Site

- Built with **VitePress** inside `docs-page/`.
- Run locally: `cd docs-page && bun install && bun run dev`
- Build: `cd docs-page && bun run build` → output at `docs-page/.vitepress/dist`
- Deployed automatically via `.github/workflows/deploy-docs.yml` on every push to `main`.

## Distribution & Publishing

- The published npm package is **not** the repo's `package.json`. CI generates a separate launcher package.
- Release model: `bun build --compile` produces a self-contained binary per platform. Binaries are uploaded as GitHub Release assets. The main `query-cli` npm package contains only a thin Node.js launcher (`bin/query-cli.mjs`) that downloads the correct platform binary on first run and caches it in `~/.cache/query-cli/`.
- **Release trigger:** push a `v*` tag, or run the `Release` workflow manually. Uses npm Trusted Publishing (OIDC) — no `NPM_TOKEN` needed.
- CI uses `bun install --frozen-lockfile` on each platform runner to ensure the matching OpenTUI native library is embedded.
- See `PUBLISHING.md` for full details.
