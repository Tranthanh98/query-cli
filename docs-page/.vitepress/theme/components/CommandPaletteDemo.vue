<template>
  <TerminalWindow title="query-cli — Command Palette" width="100%">
    <div class="tui-modal-overlay">
      <div class="tui-modal command-palette-modal">
        <div class="tui-modal-title-bar">
          <span class="tui-modal-title-accent">Commands</span>
        </div>
        <div class="tui-modal-input">
          <span class="tui-modal-placeholder">Search by name or description...</span>
          <span class="tui-cursor">▌</span>
        </div>
        <div class="tui-modal-hints">
          <span class="tui-hint-key">↑/↓</span>
          <span class="tui-hint-text">navigate</span>
          <span class="tui-hint-sep">·</span>
          <span class="tui-hint-key">enter</span>
          <span class="tui-hint-text">run</span>
          <span class="tui-hint-sep">·</span>
          <span class="tui-hint-key">esc</span>
          <span class="tui-hint-text">close</span>
        </div>
        <div class="tui-command-list">
          <div class="tui-command-item tui-command-selected">
            <div class="tui-command-desc">Execute the current query</div>
            <div class="tui-command-name">/run</div>
          </div>
          <div class="tui-command-item">
            <div class="tui-command-desc">Open the command palette</div>
            <div class="tui-command-name">/commands</div>
          </div>
          <div class="tui-command-item">
            <div class="tui-command-desc">Show keyboard shortcuts</div>
            <div class="tui-command-name">/help</div>
          </div>
          <div class="tui-command-item">
            <div class="tui-command-desc">Pick an AI adapter and model</div>
            <div class="tui-command-name">/ai-config</div>
          </div>
          <div class="tui-command-item">
            <div class="tui-command-desc">Insert @ai: at the cursor</div>
            <div class="tui-command-name">/ask-ai</div>
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
.tui-modal-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  min-height: 340px;
}

.tui-modal {
  border: 1px solid #f0b458;
  border-radius: 8px;
  padding: 16px 20px;
  background: #15151a;
  position: relative;
  min-width: 420px;
  max-width: 520px;
}

.command-palette-modal {
  border-color: #f0b458;
}

.tui-modal-title-bar {
  position: absolute;
  top: -10px;
  left: 16px;
  background: #15151a;
  padding: 0 8px;
}

.tui-modal-title-accent {
  color: #f0b458;
  font-size: 13px;
}

.tui-modal-input {
  border-bottom: 1px solid #26262c;
  padding: 4px 0 8px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.tui-modal-placeholder {
  color: #4a4a52;
}

.tui-cursor {
  color: #e6e6e6;
  animation: blink 1s step-end infinite;
  margin-left: 2px;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.tui-modal-hints {
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

.tui-command-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tui-command-item {
  padding: 6px 10px;
  border-left: 2px solid transparent;
  border-radius: 0 3px 3px 0;
  cursor: default;
}

.tui-command-selected {
  border-left-color: #f0b458;
  background: #2c2317;
}

.tui-command-desc {
  color: #e6e6e6;
  font-size: 12px;
}

.tui-command-selected .tui-command-desc {
  color: #f0b458;
}

.tui-command-name {
  color: #7a7a82;
  font-size: 11px;
  margin-top: 2px;
}
</style>
