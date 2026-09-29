<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const styles = {
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300',
  error: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300',
  info: 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm"
      role="status"
      aria-live="polite"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur"
        :class="styles[toast.type]"
      >
        <span class="flex-1 leading-relaxed">{{ toast.message }}</span>
        <button
          type="button"
          class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Tutup notifikasi"
          @click="dismiss(toast.id)"
        >
          &times;
        </button>
      </div>
    </div>
  </Teleport>
</template>
