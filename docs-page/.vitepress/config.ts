import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/query-cli/",
  title: "query-cli",
  description: "A terminal database client with a keyboard-driven TUI and built-in AI assistance",
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/introduction" },
      { text: "Installation", link: "/guide/installation" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          items: [
            { text: "Introduction", link: "/guide/introduction" },
            { text: "Installation", link: "/guide/installation" },
          ],
        },
        {
          text: "Usage",
          items: [
            { text: "Keybindings", link: "/guide/keybindings" },
            { text: "AI Providers", link: "/guide/ai-providers" },
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
  },
});
