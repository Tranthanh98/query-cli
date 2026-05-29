<template>
  <div class="terminal-window">
    <div class="terminal-chrome">
      <div class="terminal-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>
      <div class="terminal-title" v-if="title">{{ title }}</div>
      <div class="terminal-spacer"></div>
    </div>
    <div class="terminal-body" :style="bodyStyle">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: { type: String, default: "" },
  width: { type: String, default: "100%" },
  height: { type: String, default: "auto" },
  minHeight: { type: String, default: "auto" },
});

const bodyStyle = computed(() => ({
  width: "100%",
  height: props.height,
  minHeight: props.minHeight,
}));
</script>

<style scoped>
.terminal-window {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 20px 60px var(--tui-shadow), 0 0 0 1px var(--tui-border);
  background: var(--tui-terminal-bg);
  margin: 1.5rem 0;
  font-family: var(--tui-font-mono);
  font-size: 13px;
  line-height: 1.5;
}

.terminal-chrome {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--tui-chrome-bg);
  border-bottom: 1px solid var(--tui-chrome-border);
}

.terminal-dots {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: block;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.2);
}

.dot-red {
  background: #ff5f56;
}

.dot-yellow {
  background: #ffbd2e;
}

.dot-green {
  background: #27c93f;
}

.terminal-title {
  color: var(--tui-chrome-text);
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
  margin-left: 4px;
}

.terminal-spacer {
  flex: 1;
}

.terminal-body {
  background: var(--tui-bg);
  color: var(--tui-text);
  overflow: auto;
}
</style>
