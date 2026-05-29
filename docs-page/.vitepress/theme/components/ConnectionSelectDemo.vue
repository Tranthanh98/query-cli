<template>
  <TerminalWindow title="query-cli — Connection Select" width="100%">
    <div class="tui-screen">
      <div class="tui-box connection-select-box">
        <div class="tui-title-bar">
          <span class="tui-title-accent">query-cli</span>
        </div>
        <div class="tui-select-header">
          <span class="tui-select-label">Select a connection</span>
        </div>
        <div class="tui-select-hints">
          <span class="tui-hint-key">↑/↓</span>
          <span class="tui-hint-text">navigate</span>
          <span class="tui-hint-sep">·</span>
          <span class="tui-hint-key">enter</span>
          <span class="tui-hint-text">confirm</span>
          <span class="tui-hint-sep">·</span>
          <span class="tui-hint-key">ctrl+c</span>
          <span class="tui-hint-text">quit</span>
        </div>
        <div class="tui-connection-list">
          <div class="tui-connection-item">
            <div class="tui-conn-name">Production DB</div>
            <div class="tui-conn-desc">postgres://admin@db.example.com:5432/app</div>
          </div>
          <div class="tui-connection-item tui-conn-selected">
            <div class="tui-conn-name">Local Dev</div>
            <div class="tui-conn-desc">postgres://postgres@localhost:5432/myapp</div>
          </div>
          <div class="tui-connection-item">
            <div class="tui-conn-name">+ New connection</div>
            <div class="tui-conn-desc">Create a new database connection</div>
          </div>
          <div class="tui-connection-item">
            <div class="tui-conn-name">Quit</div>
            <div class="tui-conn-desc">Exit query-cli</div>
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
.tui-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-height: 320px;
}

.tui-box {
  border: 1px solid #3d3d46;
  border-radius: 8px;
  padding: 16px 20px;
  background: #15151a;
  position: relative;
}

.connection-select-box {
  border-color: #7fb3ff;
}

.tui-title-bar {
  position: absolute;
  top: -10px;
  left: 16px;
  background: #15151a;
  padding: 0 8px;
}

.tui-title-accent {
  color: #7fb3ff;
  font-size: 13px;
  font-weight: 600;
}

.tui-select-header {
  margin-top: 4px;
  margin-bottom: 8px;
}

.tui-select-label {
  color: #b197e6;
  font-size: 13px;
}

.tui-select-hints {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.tui-hint-key {
  color: #f0b458;
}

.tui-hint-text {
  color: #7a7a82;
}

.tui-hint-sep {
  color: #4a4a52;
}

.tui-connection-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 420px;
}

.tui-connection-item {
  padding: 6px 10px;
  border-left: 3px solid transparent;
  border-radius: 0 3px 3px 0;
}

.tui-conn-selected {
  border-left-color: #8fe388;
  background: #2c2317;
}

.tui-conn-name {
  color: #e6e6e6;
  font-size: 13px;
}

.tui-conn-selected .tui-conn-name {
  color: #f0b458;
}

.tui-conn-desc {
  color: #7a7a82;
  font-size: 11px;
  margin-top: 2px;
}
</style>
