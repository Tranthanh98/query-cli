<template>
  <TerminalWindow title="query-cli — Connection Form" width="100%">
    <div class="tui-screen">
      <div class="tui-box connection-form-box">
        <div class="tui-title-bar">
          <span class="tui-title-accent">New PostgreSQL connection</span>
        </div>
        <div class="tui-form-fields">
          <div class="tui-field tui-field-active">
            <span class="tui-label tui-label-active">Name</span>
            <span class="tui-sep">:</span>
            <span class="tui-value">My postgres db</span>
            <span class="tui-cursor">▌</span>
          </div>
          <div class="tui-field">
            <span class="tui-label">Host</span>
            <span class="tui-sep">:</span>
            <span class="tui-value">localhost</span>
          </div>
          <div class="tui-field">
            <span class="tui-label">Port</span>
            <span class="tui-sep">:</span>
            <span class="tui-value">5432</span>
          </div>
          <div class="tui-field">
            <span class="tui-label">Database</span>
            <span class="tui-sep">:</span>
            <span class="tui-value-placeholder">postgres</span>
          </div>
          <div class="tui-field">
            <span class="tui-label">User</span>
            <span class="tui-sep">:</span>
            <span class="tui-value">postgres</span>
          </div>
          <div class="tui-field">
            <span class="tui-label">Password</span>
            <span class="tui-sep">:</span>
            <span class="tui-value"></span>
          </div>
        </div>
        <div class="tui-hints">
          <span class="tui-hint-key">tab</span>
          <span class="tui-hint-text">move</span>
          <span class="tui-hint-sep">·</span>
          <span class="tui-hint-key">enter</span>
          <span class="tui-hint-text">next / connect</span>
          <span class="tui-hint-sep">·</span>
          <span class="tui-hint-key">esc</span>
          <span class="tui-hint-text">back</span>
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

.connection-form-box {
  border-color: #b197e6;
}

.tui-title-bar {
  position: absolute;
  top: -10px;
  left: 16px;
  background: #15151a;
  padding: 0 8px;
}

.tui-title-accent {
  color: #b197e6;
  font-size: 13px;
}

.tui-form-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
  min-width: 420px;
}

.tui-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tui-label {
  color: #7a7a82;
  width: 72px;
  flex-shrink: 0;
  text-align: left;
}

.tui-label-active {
  color: #b197e6;
}

.tui-sep {
  color: #7a7a82;
  flex-shrink: 0;
}

.tui-value {
  color: #e6e6e6;
}

.tui-value-placeholder {
  color: #4a4a52;
}

.tui-cursor {
  color: #e6e6e6;
  animation: blink 1s step-end infinite;
  margin-left: -2px;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.tui-hints {
  display: flex;
  gap: 6px;
  margin-top: 16px;
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
</style>
