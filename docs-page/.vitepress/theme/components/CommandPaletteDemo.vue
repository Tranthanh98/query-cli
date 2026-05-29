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
  border: 1px solid var(--tui-border-focus);
  border-radius: 8px;
  padding: 16px 20px;
  background: var(--tui-surface);
  position: relative;
  min-width: 420px;
  max-width: 520px;
}

.command-palette-modal {
  border-color: var(--tui-command);
}

.tui-modal-title-bar {
  position: absolute;
  top: -10px;
  left: 16px;
  background: var(--tui-surface);
  padding: 0 8px;
}

.tui-modal-title-accent {
  color: var(--tui-command);
  font-size: 13px;
}

.tui-modal-input {
  border-bottom: 1px solid var(--tui-border);
  padding: 4px 0 8px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.tui-modal-placeholder {
  color: var(--tui-text-muted);
}

.tui-cursor {
  color: var(--tui-text);
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
  color: var(--tui-command);
}

.tui-hint-text {
  color: var(--tui-text-dim);
}

.tui-hint-sep {
  color: var(--tui-text-muted);
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
  border-left-color: var(--tui-command);
  background: var(--tui-selected-bg);
}

.tui-command-desc {
  color: var(--tui-text);
  font-size: 12px;
}

.tui-command-selected .tui-command-desc {
  color: var(--tui-command);
}

.tui-command-name {
  color: var(--tui-text-dim);
  font-size: 11px;
  margin-top: 2px;
}
</style>
