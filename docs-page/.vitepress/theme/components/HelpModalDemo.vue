<template>
  <TerminalWindow title="query-cli — Help" width="100%">
    <div class="tui-modal-overlay">
      <div class="tui-modal help-modal">
        <div class="tui-modal-title-bar">
          <span class="tui-modal-title-accent">Keyboard shortcuts</span>
        </div>
        <div class="tui-shortcut-list">
          <div class="tui-shortcut-row">
            <span class="tui-sc-key">F5 / Ctrl+R</span>
            <span class="tui-sc-mac">F5 / ⌃R</span>
            <span class="tui-sc-desc">Run query</span>
          </div>
          <div class="tui-shortcut-row">
            <span class="tui-sc-key">F9 / Ctrl+P</span>
            <span class="tui-sc-mac">F9 / ⌃P</span>
            <span class="tui-sc-desc">Command palette</span>
          </div>
          <div class="tui-shortcut-row">
            <span class="tui-sc-key">Ctrl+S</span>
            <span class="tui-sc-mac">⌃S</span>
            <span class="tui-sc-desc">Save query</span>
          </div>
          <div class="tui-shortcut-row">
            <span class="tui-sc-key">Ctrl+N</span>
            <span class="tui-sc-mac">⌃N</span>
            <span class="tui-sc-desc">New query</span>
          </div>
          <div class="tui-shortcut-row">
            <span class="tui-sc-key">Ctrl+D</span>
            <span class="tui-sc-mac">⌃D</span>
            <span class="tui-sc-desc">Delete query</span>
          </div>
          <div class="tui-shortcut-row">
            <span class="tui-sc-key">Ctrl+Y</span>
            <span class="tui-sc-mac">⌃Y</span>
            <span class="tui-sc-desc">Copy selection</span>
          </div>
          <div class="tui-shortcut-row">
            <span class="tui-sc-key">Ctrl+H / F1</span>
            <span class="tui-sc-mac">⌃H / F1</span>
            <span class="tui-sc-desc">This help</span>
          </div>
          <div class="tui-shortcut-row">
            <span class="tui-sc-key">Ctrl+C</span>
            <span class="tui-sc-mac">⌃C</span>
            <span class="tui-sc-desc">Quit</span>
          </div>
        </div>
        <div class="tui-ai-section">
          <div class="tui-ai-title">Ask AI</div>
          <div class="tui-shortcut-row">
            <span class="tui-sc-key">@ai: …</span>
            <span class="tui-sc-desc">Ask AI in the editor</span>
          </div>
          <div class="tui-shortcut-row">
            <span class="tui-sc-key">/ask-ai</span>
            <span class="tui-sc-desc">Insert @ai: at the cursor</span>
          </div>
          <div class="tui-shortcut-row">
            <span class="tui-sc-key">/ai-config</span>
            <span class="tui-sc-desc">Configure AI adapter</span>
          </div>
        </div>
        <div class="tui-modal-footer">
          <span class="tui-footer-text">Type / in the editor for commands · esc to close</span>
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
  min-height: 420px;
}

.tui-modal {
  border: 1px solid #f0b458;
  border-radius: 8px;
  padding: 16px 20px;
  background: #15151a;
  position: relative;
  min-width: 460px;
  max-width: 560px;
}

.help-modal {
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

.tui-shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.tui-shortcut-row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 3px 0;
}

.tui-sc-key {
  color: #f0b458;
  width: 110px;
  flex-shrink: 0;
  font-size: 12px;
}

.tui-sc-mac {
  color: #f0b458;
  width: 90px;
  flex-shrink: 0;
  font-size: 12px;
}

.tui-sc-desc {
  color: #e6e6e6;
  font-size: 12px;
}

.tui-ai-section {
  border-top: 1px solid #26262c;
  padding-top: 12px;
  margin-bottom: 12px;
}

.tui-ai-title {
  color: #b197e6;
  margin-bottom: 6px;
  font-size: 13px;
}

.tui-modal-footer {
  border-top: 1px solid #26262c;
  padding-top: 10px;
}

.tui-footer-text {
  color: #7a7a82;
  font-size: 12px;
}
</style>
