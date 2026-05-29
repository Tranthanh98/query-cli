<template>
  <div :key="tick">
  <TerminalWindow title="query-cli — Main Screen" width="100%">
    <div class="tui-main">
      <!-- Header Bar -->
      <div class="tui-header">
        <div class="tui-header-left">
          <span class="tui-header-brand">query-cli</span>
          <span class="tui-header-sep">·</span>
          <span class="tui-header-conn">docme</span>
          <span class="tui-header-driver">(postgres)</span>
        </div>
        <div class="tui-header-right">
          <span class="tui-run-btn" :class="{ 'tui-run-active': runActive }">▶ Run (F5/Ctrl+R)</span>
          <span class="tui-header-sep">·</span>
          <span class="tui-header-key">Ctrl+S</span>
          <span class="tui-header-hint">save</span>
          <span class="tui-header-sep">·</span>
          <span class="tui-header-key">(F9/Ctrl+P)</span>
          <span class="tui-header-hint">commands</span>
          <span class="tui-header-sep">·</span>
          <span class="tui-header-key">ctrl+c</span>
          <span class="tui-header-hint">quit</span>
        </div>
      </div>

      <!-- Main Content -->
      <div class="tui-main-body">
        <!-- Left Panel: Explorer -->
        <div class="tui-explorer">
          <div class="tui-explorer-title">
            <span class="tui-exp-title-accent">Explorer</span>
          </div>
          <div class="tui-explorer-tabs">
            <span class="tui-exp-tab-active">Database</span>
            <span class="tui-exp-tab">Queries</span>
          </div>
          <div class="tui-explorer-search">
            <span class="tui-exp-arrow">▶</span>
            <span class="tui-exp-search-text">Search table name...</span>
          </div>
          <div class="tui-table-list">
            <div class="tui-table-item tui-table-selected">
              <span class="tui-exp-arrow">▶</span>
              <span class="tui-table-name">drizzle.__drizzle_migrations</span>
            </div>
            <div class="tui-table-item">
              <span class="tui-exp-arrow">▶</span>
              <span class="tui-table-name">pgboss.bam</span>
            </div>
            <div class="tui-table-item">
              <span class="tui-exp-arrow">▶</span>
              <span class="tui-table-name">pgboss.job</span>
            </div>
            <div class="tui-table-item">
              <span class="tui-exp-arrow">▶</span>
              <span class="tui-table-name">pgboss.job_common</span>
            </div>
            <div class="tui-table-item">
              <span class="tui-exp-arrow">▶</span>
              <span class="tui-table-name">pgboss.queue</span>
            </div>
            <div class="tui-table-item">
              <span class="tui-exp-arrow">▶</span>
              <span class="tui-table-name">pgboss.schedule</span>
            </div>
            <div class="tui-table-item">
              <span class="tui-exp-arrow">▶</span>
              <span class="tui-table-name">pgboss.subscription</span>
            </div>
          </div>
          <div class="tui-explorer-footer">
            <span class="tui-footer-text">20 of 76</span>
            <span class="tui-load-more">Load more (20 of 56)</span>
          </div>
        </div>

        <!-- Right Panel: Editor + Result -->
        <div class="tui-right">
          <!-- Query Editor -->
          <div class="tui-editor">
            <div class="tui-editor-title-bar">
              <span class="tui-editor-title-accent">New query</span>
            </div>
            <div class="tui-editor-content">
              <!-- Typing SQL with stagger -->
              <span class="tui-token" style="--d:0.0s"><span class="tui-sql-keyword">SELECT</span></span>
              <span class="tui-token" style="--d:0.4s"><span class="tui-sql-normal"> *</span></span>
              <span class="tui-token" style="--d:0.6s"><span class="tui-sql-keyword"> FROM</span></span>
              <span class="tui-token" style="--d:0.9s"><span class="tui-sql-normal"> users</span></span>
              <span class="tui-token" style="--d:1.3s"><span class="tui-sql-keyword"> WHERE</span></span>
              <span class="tui-token" style="--d:1.6s"><span class="tui-sql-normal"> active</span></span>
              <span class="tui-token" style="--d:1.9s"><span class="tui-sql-operator"> =</span></span>
              <span class="tui-token" style="--d:2.1s"><span class="tui-sql-bool"> true</span></span>

              <!-- Cursor appears after typing -->
              <span class="tui-cursor" :class="{ 'tui-cursor-done': cursorDone }">▌</span>

              <!-- Suggestion box phases -->
              <div class="tui-suggestion-box" :class="{ 'tui-suggestion-hide': suggestionPhase === 1 }">
                <span class="tui-suggestion-arrow">▶</span>
                <span class="tui-suggestion-text">FROM</span>
              </div>
              <div class="tui-suggestion-box tui-suggestion-where" :class="{ 'tui-suggestion-show': suggestionPhase === 2 }">
                <span class="tui-suggestion-arrow">▶</span>
                <span class="tui-suggestion-text">WHERE</span>
              </div>
            </div>
          </div>

          <!-- Result Panel -->
          <div class="tui-result" :class="{ 'tui-result-visible': resultVisible }">
            <div class="tui-result-title-bar">
              <span class="tui-result-title-accent">Result</span>
            </div>
            <div class="tui-result-content">
              <!-- Idle state (before run) -->
              <div v-if="!resultVisible" class="tui-result-idle-state">
                <span class="tui-result-idle">No results yet.</span>
                <span class="tui-result-hint">F5 / ctrl+r runs the statement.</span>
              </div>

              <!-- Data state (after run) -->
              <div v-else class="tui-result-data">
                <table class="tui-result-table">
                  <thead>
                    <tr>
                      <th>id</th>
                      <th>name</th>
                      <th>email</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="tui-data-row" style="--rd:0s"><td>1</td><td>Alice</td><td>alice@example.com</td></tr>
                    <tr class="tui-data-row" style="--rd:0.08s"><td>2</td><td>Bob</td><td>bob@example.com</td></tr>
                    <tr class="tui-data-row" style="--rd:0.16s"><td>3</td><td>Carol</td><td>carol@example.com</td></tr>
                    <tr class="tui-data-row tui-row-dim" style="--rd:0.24s"><td colspan="3">… 17 more rows</td></tr>
                  </tbody>
                </table>
                <div class="tui-result-meta" :class="{ 'tui-meta-visible': resultVisible }">
                  <span class="tui-meta-ok">✓ 20 rows · 38 ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </TerminalWindow>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import TerminalWindow from "./TerminalWindow.vue";

const runActive = ref(false);
const resultVisible = ref(false);
const cursorDone = ref(false);
const suggestionPhase = ref(0); // 0=FROM, 1=hide, 2=WHERE
const tick = ref(0);
let intervalId;

onMounted(() => {
  intervalId = setInterval(() => tick.value++, 6000);

  // Show "FROM" suggestion initially (phase 0)
  // At 0.8s user types " FROM", hide FROM suggestion
  setTimeout(() => { suggestionPhase.value = 1; }, 800);

  // At 1.3s user types " WHERE", show WHERE suggestion
  setTimeout(() => { suggestionPhase.value = 2; }, 1300);

  // At 1.6s user continues typing, hide WHERE suggestion
  setTimeout(() => { suggestionPhase.value = 3; }, 1600);

  // After typing finishes (~2.5s), flash the Run button
  setTimeout(() => {
    runActive.value = true;
    cursorDone.value = true;
  }, 2500);

  // Show result panel after Run flash
  setTimeout(() => {
    resultVisible.value = true;
  }, 2800);
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<style scoped>
.tui-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 420px;
}

.tui-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 10px;
  border-bottom: 1px solid var(--tui-border);
  background: var(--tui-bg);
  flex-shrink: 0;
}

.tui-header-left,
.tui-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tui-header-brand {
  color: var(--tui-title);
  font-weight: 600;
}

.tui-header-conn {
  color: var(--tui-text);
}

.tui-header-driver {
  color: var(--tui-text-dim);
}

.tui-header-sep {
  color: var(--tui-text-muted);
}

.tui-header-key {
  color: var(--tui-command);
}

.tui-header-hint {
  color: var(--tui-text-dim);
}

.tui-run-btn {
  background: var(--tui-selected-bg);
  color: var(--tui-command);
  padding: 1px 8px;
  border-radius: 3px;
  font-size: 12px;
  transition: background 0.2s, color 0.2s;
}

.tui-run-active {
  background: var(--tui-command);
  color: var(--tui-surface);
}

.tui-main-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.tui-explorer {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--tui-border);
  display: flex;
  flex-direction: column;
  background: var(--tui-bg);
  padding: 8px;
}

.tui-explorer-title {
  margin-bottom: 8px;
}

.tui-exp-title-accent {
  color: var(--tui-panel-queries);
  font-weight: 600;
}

.tui-explorer-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.tui-exp-tab-active {
  color: var(--tui-text);
  background: var(--tui-selected-bg);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.tui-exp-tab {
  color: var(--tui-text-dim);
  font-size: 12px;
}

.tui-explorer-search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.tui-exp-arrow {
  color: var(--tui-panel-queries);
  font-size: 10px;
}

.tui-exp-search-text {
  color: var(--tui-text-muted);
}

.tui-table-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  overflow: auto;
}

.tui-table-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  border-radius: 3px;
}

.tui-table-selected {
  background: var(--tui-border-focus);
}

.tui-table-name {
  color: var(--tui-text);
  font-size: 12px;
}

.tui-explorer-footer {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tui-footer-text {
  color: var(--tui-text-dim);
  font-size: 12px;
}

.tui-load-more {
  color: var(--tui-command);
  background: var(--tui-selected-bg);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  display: inline-block;
}

.tui-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tui-editor {
  flex: 1;
  border: 1px solid var(--tui-panel-query);
  border-radius: 6px;
  margin: 8px;
  margin-bottom: 4px;
  background: var(--tui-surface);
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 120px;
}

.tui-editor-title-bar {
  position: absolute;
  top: -10px;
  left: 12px;
  background: var(--tui-surface);
  padding: 0 8px;
}

.tui-editor-title-accent {
  color: var(--tui-panel-query);
  font-size: 13px;
}

.tui-editor-content {
  padding: 16px;
  flex: 1;
  position: relative;
}

/* Typing tokens */
.tui-token {
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

.tui-sql-keyword {
  color: var(--tui-panel-query);
  font-weight: 600;
}

.tui-sql-normal {
  color: var(--tui-text);
}

.tui-sql-operator {
  color: var(--tui-command);
}

.tui-sql-bool {
  color: var(--tui-success);
}

.tui-cursor {
  color: var(--tui-text);
  opacity: 0;
  animation: blink 1s step-end infinite;
  animation-delay: 2.5s;
}

.tui-cursor-done {
  opacity: 1;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* Suggestion boxes */
.tui-suggestion-box {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--tui-bg);
  border: 1px solid var(--tui-panel-query);
  padding: 4px 10px;
  border-radius: 4px;
  margin-top: 4px;
  margin-left: 24px;
  opacity: 1;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.tui-suggestion-hide {
  opacity: 0;
  transform: translateY(-2px);
  pointer-events: none;
}

.tui-suggestion-where {
  position: absolute;
  top: 40px;
  left: 40px;
  margin-left: 0;
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.tui-suggestion-show {
  opacity: 1;
  transform: translateY(0);
}

.tui-suggestion-arrow {
  color: var(--tui-command);
  font-size: 10px;
}

.tui-suggestion-text {
  color: var(--tui-command);
}

.tui-result {
  flex: 1;
  border: 1px solid var(--tui-panel-result);
  border-radius: 6px;
  margin: 4px 8px 8px;
  background: var(--tui-surface);
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 100px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.tui-result-visible {
  opacity: 1;
  transform: translateY(0);
}

.tui-result-title-bar {
  position: absolute;
  top: -10px;
  left: 12px;
  background: var(--tui-surface);
  padding: 0 8px;
}

.tui-result-title-accent {
  color: var(--tui-panel-result);
  font-size: 13px;
}

.tui-result-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tui-result-idle-state {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tui-result-idle {
  color: var(--tui-text-dim);
}

.tui-result-hint {
  color: var(--tui-text-muted);
}

.tui-result-data {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tui-result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.tui-result-table th,
.tui-result-table td {
  border: 1px solid var(--tui-border);
  padding: 3px 8px;
  text-align: left;
}

.tui-result-table th {
  background: var(--tui-bg);
  color: var(--tui-text);
  font-weight: 600;
}

.tui-result-table td {
  color: var(--tui-text);
}

.tui-data-row {
  opacity: 0;
  transform: translateX(-8px);
  animation: rowSlideIn 0.3s ease forwards;
  animation-delay: calc(2.9s + var(--rd));
}

.tui-row-dim td {
  color: var(--tui-text-dim);
  text-align: center;
  border-top: 1px dashed var(--tui-border);
}

@keyframes rowSlideIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.tui-result-meta {
  margin-top: auto;
  text-align: right;
  padding-top: 2px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tui-meta-visible {
  opacity: 1;
  transition-delay: 3.2s;
}

.tui-meta-ok {
  color: var(--tui-success);
  font-size: 12px;
}
</style>
