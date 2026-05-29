<template>
  <TerminalWindow title="query-cli — AI Assistant" width="100%">
    <div class="ai-tui" :key="tick">
      <!-- Header Bar -->
      <div class="ai-header">
        <div class="ai-header-left">
          <span class="ai-brand">query-cli</span>
          <span class="ai-sep">·</span>
          <span class="ai-conn">myapp</span>
          <span class="ai-driver">(postgres)</span>
        </div>
        <div class="ai-header-right">
          <span class="ai-run-btn" :class="{ 'ai-run-active': runActive }">▶ Run</span>
        </div>
      </div>

      <!-- Editor -->
      <div class="ai-editor">
        <div class="ai-editor-title">
          <span class="ai-editor-accent">New query</span>
        </div>
        <div class="ai-editor-content">
          <span class="ai-token" style="--d:0.0s"><span class="ai-prompt-tag">@ai:</span></span>
          <span class="ai-token" style="--d:0.3s"><span class="ai-prompt-text"> list all active users of this month</span></span>
          <span class="ai-cursor" :class="{ 'ai-cursor-done': cursorDone }">▌</span>
        </div>
        <!-- Run info (bottom right of editor) -->
        <div class="ai-run-info" :class="{ 'ai-run-info-visible': runInfoVisible }">
          <span :class="runInfoClass">{{ runInfoText }}</span>
        </div>
      </div>

      <!-- Result Panel -->
      <div class="ai-result" :class="{ 'ai-result-visible': resultVisible }">
        <div class="ai-result-title">
          <span class="ai-result-title-accent">Result</span>
        </div>
        <div class="ai-result-content">
          <div class="ai-query-block">
            <div class="ai-query-line">
              <span class="ai-sql-keyword">SELECT</span>
              <span class="ai-sql-normal"> * </span>
              <span class="ai-sql-keyword">FROM</span>
              <span class="ai-sql-normal"> users</span>
            </div>
            <div class="ai-query-line">
              <span class="ai-sql-keyword">WHERE</span>
              <span class="ai-sql-normal"> active </span>
              <span class="ai-sql-operator">=</span>
              <span class="ai-sql-bool"> true</span>
            </div>
            <div class="ai-query-line">
              <span class="ai-sql-keyword">AND</span>
              <span class="ai-sql-normal"> created_at </span>
              <span class="ai-sql-operator">>=</span>
              <span class="ai-sql-string"> DATE_TRUNC(</span>
              <span class="ai-sql-string">'month'</span>
              <span class="ai-sql-string">, NOW())</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </TerminalWindow>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import TerminalWindow from "./TerminalWindow.vue";

const tick = ref(0);
let intervalId;

const runActive = ref(false);
const cursorDone = ref(false);
const runInfoVisible = ref(false);
const runInfoText = ref("");
const runInfoClass = ref("ai-info-thinking");
const resultVisible = ref(false);

const STEPS = [
  { text: "⟳ AI thinking…", cls: "ai-info-thinking", at: 1000 },
  { text: "⟳ load_tables(shop_db)…", cls: "ai-info-tool", at: 1600 },
  { text: "⟳ load_columns(users)…", cls: "ai-info-tool", at: 2200 },
  { text: "✓ AI replaced @ai block", cls: "ai-info-ok", at: 2800 },
];

function scheduleSteps() {
  runInfoVisible.value = false;
  runInfoText.value = "";
  resultVisible.value = false;
  runActive.value = false;
  cursorDone.value = false;

  // Flash Run button after typing (~0.8s)
  setTimeout(() => {
    runActive.value = true;
    cursorDone.value = true;
  }, 800);

  // Show run info and cycle through steps
  setTimeout(() => {
    runInfoVisible.value = true;
  }, 1000);

  STEPS.forEach((step) => {
    setTimeout(() => {
      runInfoText.value = step.text;
      runInfoClass.value = step.cls;
    }, step.at);
  });

  // Show result panel after AI completes
  setTimeout(() => {
    resultVisible.value = true;
  }, 3000);
}

onMounted(() => {
  scheduleSteps();
  intervalId = setInterval(() => {
    tick.value++;
    scheduleSteps();
  }, 6000);
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<style scoped>
.ai-tui {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
  font-size: 12px;
  line-height: 1.4;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 10px;
  border-bottom: 1px solid var(--tui-border);
  background: var(--tui-bg);
  flex-shrink: 0;
}

.ai-header-left,
.ai-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ai-brand {
  color: var(--tui-title);
  font-weight: 700;
}

.ai-conn {
  color: var(--tui-text);
  font-weight: 500;
}

.ai-driver {
  color: var(--tui-text-dim);
}

.ai-sep {
  color: var(--tui-text-muted);
}

.ai-run-btn {
  background: var(--tui-selected-bg);
  color: var(--tui-command);
  padding: 1px 8px;
  border-radius: 3px;
  font-size: 12px;
  transition: background 0.2s, color 0.2s;
}

.ai-run-active {
  background: var(--tui-command);
  color: var(--tui-surface);
}

.ai-editor {
  flex: 1;
  border: 1px solid var(--tui-panel-query);
  border-radius: 6px;
  margin: 8px;
  margin-bottom: 4px;
  background: var(--tui-surface);
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 100px;
  overflow: hidden;
}

.ai-editor-title {
  position: absolute;
  top: -10px;
  left: 12px;
  background: var(--tui-surface);
  padding: 0 8px;
}

.ai-editor-accent {
  color: var(--tui-panel-query);
  font-size: 13px;
  font-weight: 600;
}

.ai-editor-content {
  padding: 16px;
  flex: 1;
  position: relative;
}

.ai-token {
  opacity: 0;
  animation: typeIn 0.12s ease forwards;
  animation-delay: var(--d);
}

@keyframes typeIn {
  from {
    opacity: 0;
    transform: translateY(1px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-prompt-tag {
  color: var(--tui-command);
  font-weight: 700;
}

.ai-prompt-text {
  color: var(--tui-text);
}

.ai-cursor {
  color: var(--tui-text);
  opacity: 0;
  animation: blink 1s step-end infinite;
  animation-delay: 0.8s;
}

.ai-cursor-done {
  opacity: 1;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* Run info (bottom-right of editor) */
.ai-run-info {
  position: absolute;
  bottom: 6px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 11px;
}

.ai-run-info-visible {
  opacity: 1;
}

.ai-info-thinking {
  color: var(--tui-warning);
}

.ai-info-tool {
  color: var(--tui-command);
}

.ai-info-ok {
  color: var(--tui-success);
}

.ai-result {
  flex: 1;
  border: 1px solid var(--tui-panel-result);
  border-radius: 6px;
  margin: 4px 8px 8px;
  background: var(--tui-surface);
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 100px;
  overflow: hidden;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.ai-result-visible {
  opacity: 1;
  transform: translateY(0);
}

.ai-result-title {
  position: absolute;
  top: -10px;
  left: 12px;
  background: var(--tui-surface);
  padding: 0 8px;
}

.ai-result-title-accent {
  color: var(--tui-panel-result);
  font-size: 13px;
  font-weight: 600;
}

.ai-result-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ai-query-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ai-query-line {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.ai-sql-keyword {
  color: var(--tui-panel-query);
  font-weight: 600;
}

.ai-sql-normal {
  color: var(--tui-text);
}

.ai-sql-operator {
  color: var(--tui-command);
}

.ai-sql-bool {
  color: var(--tui-success);
}

.ai-sql-string {
  color: var(--tui-success);
}
</style>
