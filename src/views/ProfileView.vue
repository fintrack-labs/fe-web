<script setup lang="ts">
import { computed } from 'vue'
import { useFontScale } from '@/composables/useFontScale'
import type { FontScaleMode } from '@/composables/useFontScale'
import { decodeJwt } from '@/utils/jwt'
import { getAccessToken, type TokenPayload } from '@/utils/token'

const user = computed(() => {
  const token = getAccessToken()
  return token ? decodeJwt<TokenPayload>(token) : null
})

const initials = computed(() => user.value?.name?.slice(0, 2).toUpperCase() ?? 'FT')

const FONT_SCALE_OPTIONS: { value: FontScaleMode; label: string; sizeClass: string }[] = [
  { value: 'sm', label: 'Smaller', sizeClass: 'text-sm' },
  { value: 'md', label: 'Normal', sizeClass: 'text-base' },
  { value: 'lg', label: 'Larger', sizeClass: 'text-lg' }
]

const { scale, setFontScale } = useFontScale()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">User Profile</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">Account information and display preferences.</p>
    </div>

    <section class="max-w-2xl space-y-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div class="flex items-center gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
          {{ initials }}
        </div>
        <div class="min-w-0">
          <h2 class="truncate text-lg font-semibold text-slate-900 dark:text-white">
            {{ user?.name ?? 'Profile unavailable' }}
          </h2>
          <p class="truncate text-sm text-slate-500 dark:text-slate-400">
            {{ user?.email ?? 'Sign in again to load your profile.' }}
          </p>
        </div>
      </div>

      <dl v-if="user" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">Full Name</dt>
          <dd class="mt-1 break-words text-sm text-slate-900 dark:text-white">{{ user.name }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">Email</dt>
          <dd class="mt-1 break-all text-sm text-slate-900 dark:text-white">{{ user.email }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">User ID</dt>
          <dd class="mt-1 break-all font-mono text-sm text-slate-900 dark:text-white">{{ user.sub }}</dd>
        </div>
      </dl>

      <div>
        <label class="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">Font Size</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="option in FONT_SCALE_OPTIONS"
            :key="option.value"
            type="button"
            @click="setFontScale(option.value)"
            class="cursor-pointer rounded-lg border px-3 py-2.5 transition-colors"
            :class="
              scale === option.value
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            "
          >
            <span :class="['block leading-none', option.sizeClass]">A</span>
            <span class="mt-1 block text-xs">{{ option.label }}</span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>