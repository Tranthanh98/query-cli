# Installation

## Requirements

- **Bun** (used for development & compilation)
- Or no runtime at all if you use the prebuilt binary

## Install from npm

```bash
# npm
npm i -g query-cli

# pnpm
pnpm add -g query-cli

# yarn
yarn global add query-cli

# bun
bun add -g query-cli
```

## Run without installing

```bash
npx query-cli
```

## Prebuilt binary

`query-cli` is distributed as a self-contained binary per platform. See the [GitHub Releases](https://github.com/Tranthanh98/query-cli/releases) page to download the binary for your OS.

> **Homebrew** and **Winget** distribution is planned.

## Development

If you want to build from source:

```bash
git clone https://github.com/Tranthanh98/query-cli.git
cd query-cli
bun install
bun run start
```

## Configuration files

Saved connections and queries are stored in:

```
~/.config/query-cli/
├── connections.json
└── queries/
```

AI provider settings are configured in-app via the **AI Config** modal (`Ctrl + P` → "Configure AI").
