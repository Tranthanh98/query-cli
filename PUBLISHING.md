# Publishing `query-cli` to npm

`query-cli` is a [Bun](https://bun.com) + [OpenTUI](https://opentui.com) app.
OpenTUI is currently **Bun-exclusive** (it loads native Zig libraries via
`Bun.dlopen()`), so the published package can't be plain JS that runs on Node.

Instead we use the **opencode distribution model**: compile a self-contained
binary per platform with `bun build --compile` (which embeds *both* the Bun
runtime and OpenTUI's native libs), publish one package per platform, and wire
them together with a tiny Node launcher via `optionalDependencies`.

**Result:** end users run `npm i -g query-cli` (or pnpm/yarn/bun) and get a
working CLI — **without installing Bun themselves**.

---

## How it fits together

```
query-cli                      ← main package users install
├── bin/query-cli.mjs          ← Node launcher (#!/usr/bin/env node)
└── optionalDependencies:
    ├── query-cli-linux-x64    ← each holds ONE prebuilt binary in bin/
    ├── query-cli-linux-arm64
    ├── query-cli-darwin-x64
    ├── query-cli-darwin-arm64
    └── query-cli-win32-x64
```

- Each platform package declares `"os"` + `"cpu"`, so npm installs **only** the
  one matching the user's machine; the rest are skipped silently.
- The launcher ([bin/query-cli.mjs](bin/query-cli.mjs)) runs on plain Node. It
  resolves `query-cli-<platform>-<arch>/bin/query-cli[.exe]` and re-execs it with
  the real TTY. The binary is self-contained, so no Bun is needed at runtime.

This is verified to work: `bun build --compile` of this app produces a binary
that renders the full TUI with OpenTUI's native renderer intact.

---

## One-time setup

1. **Create an npm automation token**
   npm → *Access Tokens* → *Generate New Token* → **Automation**.

2. **Add it to the repo**
   GitHub → *Settings* → *Secrets and variables* → *Actions* → *New repository
   secret* → name it **`NPM_TOKEN`**.

3. **Confirm the names are free** (they currently are):
   `query-cli`, `query-cli-linux-x64`, `query-cli-linux-arm64`,
   `query-cli-darwin-x64`, `query-cli-darwin-arm64`, `query-cli-win32-x64`.
   If `query-cli` ever gets taken, switch to a scope (e.g. `@your-org/query-cli`)
   in both [package.json](package.json) and the workflow, and the platform
   package names accordingly.

---

## Cutting a release

The version comes from the git tag. Bump it, tag it, push the tag:

```bash
# set the version in package.json, then:
git commit -am "release: v0.1.0"
git tag v0.1.0
git push origin main --tags
```

Pushing the `v*` tag triggers
[.github/workflows/release.yml](.github/workflows/release.yml), which:

1. **builds** each platform on its own runner — one per OS/arch so the correct
   OpenTUI native lib is installed and embedded — and publishes each
   `query-cli-<platform>` package;
2. **publishes** the main `query-cli` package, pinning each
   `optionalDependency` to the exact release version.

You can also run it manually from the **Actions** tab (*workflow_dispatch*) and
type the version.

> Re-running with a version already on npm will fail (npm forbids overwriting a
> published version). Always bump the version for a new release.

---

## Platforms built

| npm package              | runner             | bun target          |
| ------------------------ | ------------------ | ------------------- |
| `query-cli-linux-x64`    | `ubuntu-latest`    | `bun-linux-x64`     |
| `query-cli-linux-arm64`  | `ubuntu-24.04-arm` | `bun-linux-arm64`   |
| `query-cli-darwin-x64`   | `macos-13`         | `bun-darwin-x64`    |
| `query-cli-darwin-arm64` | `macos-14`         | `bun-darwin-arm64`  |
| `query-cli-win32-x64`    | `windows-latest`   | `bun-windows-x64`   |

Windows arm64 is omitted (limited Bun support). Add a matrix entry if needed.

---

## Testing locally before you publish

Compile a binary for your own machine and run it — no install needed:

```bash
bun run compile        # → dist/query-cli (or dist/query-cli.exe on Windows)
./dist/query-cli       # runs the standalone binary
```

To dry-run the actual npm tarball contents without publishing:

```bash
npm pack --dry-run     # from a generated dist/query-cli or dist/query-cli-* dir
```

---

## Notes & gotchas

- **Local dev is unchanged.** [package.json](package.json) still points `bin` at
  `src/index.tsx`, so `bun run dev`, `bun start`, and `bun link` keep working as
  before. The launcher and platform packages are assembled by CI only; the repo's
  own `package.json` is **not** what gets published as the main package — the
  workflow generates that.
- **Provenance.** The workflow publishes with `--provenance` (needs
  `id-token: write`, already set). If it causes issues on a private repo, drop
  the `--provenance` flag from both publish steps.
- **License.** No license is set yet. Add a `LICENSE` file and a `"license"`
  field if you intend this to be public/open-source — npm will warn until you do.
- **Adding a platform.** Add a row to the build matrix in the workflow and a line
  to `optionalDependencies` in the main-package step. The launcher already maps
  any `process.platform`-`process.arch` to `query-cli-<that>`.
