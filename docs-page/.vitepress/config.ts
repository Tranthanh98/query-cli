import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/query-cli/",
  title: "query-cli",
  description: "A terminal database client with a keyboard-driven TUI and built-in AI assistance",
  ignoreDeadLinks: true,
  head: [
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    ["link", { href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap", rel: "stylesheet" }],
  ],
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/introduction" },
      { text: "Features", link: "/guide/features" },
      { text: "Installation", link: "/guide/installation" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          items: [
            { text: "Introduction", link: "/guide/introduction" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Quick Start", link: "/guide/quick-start" },
          ],
        },
        {
          text: "Features",
          items: [
            { text: "Overview", link: "/guide/features" },
            { text: "Connection Manager", link: "/guide/connections" },
            { text: "Query Editor", link: "/guide/query-editor" },
            { text: "Schema Explorer", link: "/guide/schema-explorer" },
            { text: "Slash Commands", link: "/guide/slash-commands" },
            { text: "AI Assistant", link: "/guide/ai-providers" },
          ],
        },
        {
          text: "Reference",
          items: [
            { text: "Keybindings", link: "/guide/keybindings" },
            { text: "Configuration", link: "/guide/configuration" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/Tranthanh98/query-cli" },
      { icon: "npm", link: "https://www.npmjs.com/package/query-cli" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026-present",
    },
    search: {
      provider: "local",
    },
  },
});
