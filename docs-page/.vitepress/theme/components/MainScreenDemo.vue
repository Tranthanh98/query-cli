<template>
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
          <span class="tui-run-btn">▶ Run (F5/Ctrl+R)</span>
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
              <span class="tui-sql-keyword">SELECT</span>
              <span class="tui-sql-normal"> * FR</span>
              <span class="tui-cursor">▌</span>
              <div class="tui-suggestion-box">
                <span class="tui-suggestion-arrow">▶</span>
                <span class="tui-suggestion-text">FROM</span>
              </div>
            </div>
          </div>

          <!-- Result Panel -->
          <div class="tui-result">
            <div class="tui-result-title-bar">
              <span class="tui-result-title-accent">Result</span>
            </div>
            <div class="tui-result-content">
              <span class="tui-result-idle">No results yet.</span>
              <span class="tui-result-hint">F5 / ctrl+r runs the statement.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </TerminalWindow>
</template>

<script setup>
import TerminalWindow from "./TerminalWindow.vue";
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

.tui-sql-keyword {
  color: var(--tui-panel-query);
  font-weight: 600;
}

.tui-sql-normal {
  color: var(--tui-text);
}

.tui-cursor {
  color: var(--tui-text);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

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

.tui-result-idle {
  color: var(--tui-text-dim);
}

.tui-result-hint {
  color: var(--tui-text-muted);
}
</style>
