<template>
  <TerminalWindow title="query-cli — AI Config" width="100%">
    <div class="tui-modal-overlay">
      <div class="tui-modal ai-config-modal">
        <div class="tui-modal-title-bar">
          <span class="tui-modal-title-accent">AI adapter</span>
        </div>
        <div class="tui-modal-hints">
          <span class="tui-hint-key">↑/↓</span>
          <span class="tui-hint-text">navigate</span>
          <span class="tui-hint-sep">·</span>
          <span class="tui-hint-key">enter</span>
          <span class="tui-hint-text">select</span>
          <span class="tui-hint-sep">·</span>
          <span class="tui-hint-key">esc</span>
          <span class="tui-hint-text">cancel</span>
        </div>
        <div class="tui-adapter-list">
          <div class="tui-adapter-item">
            <div class="tui-adapter-name">Anthropic Claude ✓ key saved · active</div>
            <div class="tui-adapter-desc">anthropic · needs ANTHROPIC_API_KEY</div>
          </div>
          <div class="tui-adapter-item tui-adapter-selected">
            <div class="tui-adapter-name">OpenAI</div>
            <div class="tui-adapter-desc">openai · needs OPENAI_API_KEY</div>
          </div>
          <div class="tui-adapter-item">
            <div class="tui-adapter-name">OpenRouter</div>
            <div class="tui-adapter-desc">openrouter · needs OPENROUTER_API_KEY · free models with :free suffix</div>
          </div>
          <div class="tui-adapter-item">
            <div class="tui-adapter-name">Google Gemini</div>
            <div class="tui-adapter-desc">gemini · needs GEMINI_API_KEY (free tier available)</div>
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
  min-width: 480px;
  max-width: 580px;
}

.ai-config-modal {
  border-color: var(--tui-panel-query);
}

.tui-modal-title-bar {
  position: absolute;
  top: -10px;
  left: 16px;
  background: var(--tui-surface);
  padding: 0 8px;
}

.tui-modal-title-accent {
  color: var(--tui-panel-query);
  font-size: 13px;
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

.tui-adapter-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tui-adapter-item {
  padding: 8px 10px;
  border-left: 2px solid transparent;
  border-radius: 0 3px 3px 0;
}

.tui-adapter-selected {
  border-left-color: var(--tui-panel-query);
  background: var(--tui-selected-bg);
}

.tui-adapter-name {
  color: var(--tui-text);
  font-size: 13px;
}

.tui-adapter-selected .tui-adapter-name {
  color: var(--tui-command);
}

.tui-adapter-desc {
  color: var(--tui-text-dim);
  font-size: 11px;
  margin-top: 3px;
}
</style>
