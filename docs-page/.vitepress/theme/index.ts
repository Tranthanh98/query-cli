import DefaultTheme from "vitepress/theme";
import { useData } from "vitepress";
import { h } from "vue";
import AiConfigDemo from "./components/AiConfigDemo.vue";
import CommandPaletteDemo from "./components/CommandPaletteDemo.vue";
import ConnectionFormDemo from "./components/ConnectionFormDemo.vue";
import ConnectionSelectDemo from "./components/ConnectionSelectDemo.vue";
import HelpModalDemo from "./components/HelpModalDemo.vue";
import HeroTerminal from "./components/HeroTerminal.vue";
import MainScreenDemo from "./components/MainScreenDemo.vue";
import TerminalWindow from "./components/TerminalWindow.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { site } = useData();
    const base = site.value.base; // e.g. "/query-cli/"
    return h(DefaultTheme.Layout, null, {
      "home-hero-image": () => h(HeroTerminal),
      "home-hero-info-before": () =>
        h("div", { class: "hero-icon-wrapper" }, [
          h("img", { src: base + "icon.png", class: "hero-icon", alt: "query-cli" }),
        ]),
    });
  },
  enhanceApp({ app }) {
    app.component("TerminalWindow", TerminalWindow);
    app.component("HeroTerminal", HeroTerminal);
    app.component("ConnectionFormDemo", ConnectionFormDemo);
    app.component("MainScreenDemo", MainScreenDemo);
    app.component("CommandPaletteDemo", CommandPaletteDemo);
    app.component("ConnectionSelectDemo", ConnectionSelectDemo);
    app.component("HelpModalDemo", HelpModalDemo);
    app.component("AiConfigDemo", AiConfigDemo);
  },
};
