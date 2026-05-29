<template>
  <TerminalWindow title="query-cli" width="100%" height="280px" minHeight="240px">
    <div class="hero-tui">
      <!-- Header Bar -->
      <div class="hero-header">
        <div class="hero-header-left">
          <span class="hero-brand">query-cli</span>
          <span class="hero-sep">·</span>
          <span class="hero-conn">myapp</span>
          <span class="hero-driver">(postgres)</span>
        </div>
        <div class="hero-header-right">
          <span class="hero-run-btn">▶ Run</span>
        </div>
      </div>

      <!-- Editor -->
      <div class="hero-editor">
        <div class="hero-editor-title">
          <span class="hero-editor-accent">Active users</span>
        </div>
        <div class="hero-editor-content">
          <div class="hero-sql-line">
            <span class="hero-sql-keyword">SELECT</span>
            <span class="hero-sql-normal"> id, name, email </span>
            <span class="hero-sql-keyword">FROM</span>
            <span class="hero-sql-normal"> users</span>
          </div>
          <div class="hero-sql-line">
            <span class="hero-sql-keyword">WHERE</span>
            <span class="hero-sql-normal"> active </span>
            <span class="hero-sql-operator">=</span>
            <span class="hero-sql-bool"> true</span>
            <span class="hero-cursor">▌</span>
          </div>
        </div>
      </div>

      <!-- Result -->
      <div class="hero-result">
        <div class="hero-result-title">
          <span class="hero-result-accent">Result</span>
        </div>
        <div class="hero-result-content">
          <table class="hero-table">
            <thead>
              <tr>
                <th>id</th>
                <th>name</th>
                <th>email</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Alice</td>
                <td>alice@example.com</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Bob</td>
                <td>bob@example.com</td>
              </tr>
              <tr class="hero-row-more">
                <td colspan="3">… 18 more rows</td>
              </tr>
            </tbody>
          </table>
          <div class="hero-result-meta">
            <span class="hero-meta-ok">✓ 20 rows · 42 ms</span>
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
.hero-tui {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 220px;
  font-size: 12px;
  line-height: 1.4;
}

.hero-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 8px;
  border-bottom: 1px solid var(--tui-border);
  background: var(--tui-bg);
  flex-shrink: 0;
}

.hero-header-left,
.hero-header-right {
  display: flex;
  align-items: center;
  gap: 5px;
}

.hero-brand {
  color: var(--tui-title);
  font-weight: 700;
}

.hero-conn {
  color: var(--tui-text);
  font-weight: 500;
}

.hero-driver {
  color: var(--tui-text-dim);
}

.hero-sep {
  color: var(--tui-text-muted);
}

.hero-run-btn {
  background: var(--tui-selected-bg);
  color: var(--tui-command);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
}

.hero-editor {
  flex: 1;
  border: 1px solid var(--tui-panel-query);
  border-radius: 5px;
  margin: 6px 6px 3px;
  background: var(--tui-surface);
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.hero-editor-title {
  position: absolute;
  top: -8px;
  left: 8px;
  background: var(--tui-surface);
  padding: 0 6px;
}

.hero-editor-accent {
  color: var(--tui-panel-query);
  font-size: 11px;
  font-weight: 600;
}

.hero-editor-content {
  padding: 10px 10px 6px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.hero-sql-line {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.hero-sql-keyword {
  color: var(--tui-panel-query);
  font-weight: 600;
}

.hero-sql-normal {
  color: var(--tui-text);
}

.hero-sql-operator {
  color: var(--tui-command);
}

.hero-sql-bool {
  color: var(--tui-success);
}

.hero-cursor {
  color: var(--tui-text);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.hero-result {
  flex: 1;
  border: 1px solid var(--tui-panel-result);
  border-radius: 5px;
  margin: 3px 6px 6px;
  background: var(--tui-surface);
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.hero-result-title {
  position: absolute;
  top: -8px;
  left: 8px;
  background: var(--tui-surface);
  padding: 0 6px;
}

.hero-result-accent {
  color: var(--tui-panel-result);
  font-size: 11px;
  font-weight: 600;
}

.hero-result-content {
  padding: 8px 8px 4px;
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.hero-table th,
.hero-table td {
  border: 1px solid var(--tui-border);
  padding: 2px 6px;
  text-align: left;
}

.hero-table th {
  background: var(--tui-bg);
  color: var(--tui-text);
  font-weight: 600;
}

.hero-table td {
  color: var(--tui-text);
}

.hero-row-more td {
  color: var(--tui-text-dim);
  text-align: center;
  border-top: 1px dashed var(--tui-border);
}

.hero-result-meta {
  margin-top: auto;
  text-align: right;
  padding-top: 2px;
}

.hero-meta-ok {
  color: var(--tui-success);
  font-size: 11px;
}
</style>
