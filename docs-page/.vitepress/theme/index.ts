import DefaultTheme from "vitepress/theme";
import TerminalWindow from "./components/TerminalWindow.vue";
import ConnectionFormDemo from "./components/ConnectionFormDemo.vue";
import MainScreenDemo from "./components/MainScreenDemo.vue";
import CommandPaletteDemo from "./components/CommandPaletteDemo.vue";
import ConnectionSelectDemo from "./components/ConnectionSelectDemo.vue";
import HelpModalDemo from "./components/HelpModalDemo.vue";
import AiConfigDemo from "./components/AiConfigDemo.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("TerminalWindow", TerminalWindow);
    app.component("ConnectionFormDemo", ConnectionFormDemo);
    app.component("MainScreenDemo", MainScreenDemo);
    app.component("CommandPaletteDemo", CommandPaletteDemo);
    app.component("ConnectionSelectDemo", ConnectionSelectDemo);
    app.component("HelpModalDemo", HelpModalDemo);
    app.component("AiConfigDemo", AiConfigDemo);
  },
};
