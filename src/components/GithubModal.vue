<script setup lang="ts">
import { ref } from 'vue';
import { gameBridge } from '@/game/core/GameBridge';
import { useGithubStore } from '@/stores/githubStore';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; connected: [] }>();

const github = useGithubStore();
const username = ref('');
const token = ref('');
const error = ref<string | null>(null);

async function connect() {
  if (!username.value.trim()) {
    error.value = 'Enter a GitHub username.';
    return;
  }
  error.value = null;
  await github.connect(username.value.trim(), token.value.trim() || undefined);
  if (github.error) {
    error.value = github.error;
  } else {
    gameBridge.emit({ type: 'connectGithub', username: username.value.trim(), token: token.value.trim() || undefined });
    emit('connected');
    emit('close');
  }
}

function disconnect() {
  gameBridge.emit({ type: 'disconnectGithub' });
  void github.disconnect();
}
</script>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <h2>GitHub Connection</h2>
      <p class="lead">
        Your GitHub history becomes quiet memories in the valley. Public data only — no token is stored.
        Exploration gives you time to discover them; there are no rankings or penalties.
      </p>

      <div v-if="!github.connected">
        <label class="row">
          Username
          <input v-model="username" placeholder="octocat" @keyup.enter="connect" />
        </label>
        <label class="row">
          Token (optional, for private repos)
          <input v-model="token" type="password" placeholder="ghp_..." />
        </label>
        <p v-if="error" class="error">{{ error }}</p>
        <div class="actions">
          <button @click="emit('close')">Cancel</button>
          <button class="primary" :disabled="github.loading" @click="connect">
            {{ github.loading ? 'Connecting…' : 'Connect' }}
          </button>
        </div>
      </div>

      <div v-else>
        <p class="connected">
          Connected as <strong>{{ github.username }}</strong>.
          {{ github.pendingCount }} keepsakes waiting to be discovered.
        </p>
        <div class="actions">
          <button @click="disconnect">Disconnect</button>
          <button class="primary" @click="emit('close')">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 10, 8, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  backdrop-filter: blur(4px);
}
.modal {
  background: #162420;
  border: 1px solid rgba(180, 200, 190, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  width: min(440px, 92vw);
  color: #e8f0ea;
}
.modal h2 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
}
.lead {
  font-size: 0.85rem;
  opacity: 0.75;
  margin: 0 0 1.2rem;
  line-height: 1.5;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.4rem 0;
  font-size: 0.9rem;
}
.row input {
  background: #0f1a17;
  color: #e8f0ea;
  border: 1px solid rgba(180, 200, 190, 0.3);
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  flex: 1;
  max-width: 220px;
}
.error {
  color: #ff8a6a;
  font-size: 0.85rem;
  margin: 0.5rem 0;
}
.connected {
  font-size: 0.9rem;
  line-height: 1.5;
}
.actions {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
.actions button {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(180, 200, 190, 0.3);
  background: transparent;
  color: #e8f0ea;
  border-radius: 6px;
  cursor: pointer;
}
.actions .primary {
  background: #8fb3a0;
  color: #0f1a17;
}
.actions .primary:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>