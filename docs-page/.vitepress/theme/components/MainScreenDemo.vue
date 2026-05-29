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
  border-bottom: 1px solid #26262c;
  background: #0e0e10;
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
  color: #7fb3ff;
  font-weight: 600;
}

.tui-header-conn {
  color: #e6e6e6;
}

.tui-header-driver {
  color: #7a7a82;
}

.tui-header-sep {
  color: #4a4a52;
}

.tui-header-key {
  color: #f0b458;
}

.tui-header-hint {
  color: #7a7a82;
}

.tui-run-btn {
  background: #2c2317;
  color: #f0b458;
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
  border-right: 1px solid #26262c;
  display: flex;
  flex-direction: column;
  background: #0e0e10;
  padding: 8px;
}

.tui-explorer-title {
  margin-bottom: 8px;
}

.tui-exp-title-accent {
  color: #6ec4b5;
  font-weight: 600;
}

.tui-explorer-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.tui-exp-tab-active {
  color: #e6e6e6;
  background: #2c2317;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.tui-exp-tab {
  color: #7a7a82;
  font-size: 12px;
}

.tui-explorer-search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.tui-exp-arrow {
  color: #6ec4b5;
  font-size: 10px;
}

.tui-exp-search-text {
  color: #4a4a52;
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
  background: #3d3d46;
}

.tui-table-name {
  color: #e6e6e6;
  font-size: 12px;
}

.tui-explorer-footer {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tui-footer-text {
  color: #7a7a82;
  font-size: 12px;
}

.tui-load-more {
  color: #f0b458;
  background: #2c2317;
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
  border: 1px solid #b197e6;
  border-radius: 6px;
  margin: 8px;
  margin-bottom: 4px;
  background: #15151a;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 120px;
}

.tui-editor-title-bar {
  position: absolute;
  top: -10px;
  left: 12px;
  background: #15151a;
  padding: 0 8px;
}

.tui-editor-title-accent {
  color: #b197e6;
  font-size: 13px;
}

.tui-editor-content {
  padding: 16px;
  flex: 1;
  position: relative;
}

.tui-sql-keyword {
  color: #b197e6;
  font-weight: 600;
}

.tui-sql-normal {
  color: #e6e6e6;
}

.tui-cursor {
  color: #e6e6e6;
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
  background: #0e0e10;
  border: 1px solid #b197e6;
  padding: 4px 10px;
  border-radius: 4px;
  margin-top: 4px;
  margin-left: 24px;
}

.tui-suggestion-arrow {
  color: #f0b458;
  font-size: 10px;
}

.tui-suggestion-text {
  color: #f0b458;
}

.tui-result {
  flex: 1;
  border: 1px solid #7fb3ff;
  border-radius: 6px;
  margin: 4px 8px 8px;
  background: #15151a;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 100px;
}

.tui-result-title-bar {
  position: absolute;
  top: -10px;
  left: 12px;
  background: #15151a;
  padding: 0 8px;
}

.tui-result-title-accent {
  color: #7fb3ff;
  font-size: 13px;
}

.tui-result-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tui-result-idle {
  color: #7a7a82;
}

.tui-result-hint {
  color: #4a4a52;
}
</style>
