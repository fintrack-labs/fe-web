<script setup lang="ts">
import { ref } from 'vue'
import { useFontScale } from '@/composables/useFontScale'
import type { FontScaleMode } from '@/composables/useFontScale'

const user = ref({
  name: 'John Doe',
  email: 'johndoe@example.com',
  role: 'Senior Developer'
})

const FONT_SCALE_OPTIONS: { value: FontScaleMode; label: string; sizeClass: string }[] = [
  { value: 'sm', label: 'Smaller', sizeClass: 'text-sm' },
  { value: 'md', label: 'Normal', sizeClass: 'text-base' },
  { value: 'lg', label: 'Larger', sizeClass: 'text-lg' }
]

const { scale, setFontScale } = useFontScale()
</script>

<template>
  <div class="space-y-6">
    <!-- Title Page -->
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">User Profile</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">Manage your account information and profile settings.</p>
    </div>

    <!-- Profile Card Template -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl space-y-6 dark:bg-slate-900 dark:border-slate-800">
      
      <!-- Avatar & Basic Info -->
      <div class="flex items-center gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div class="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white">
          {{ user.name.substring(0, 2).toUpperCase() }}
        </div>
        <div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ user.name }}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ user.role }}</p>
        </div>
      </div>

      <!-- Font Size -->
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Font Size</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="option in FONT_SCALE_OPTIONS"
            :key="option.value"
            type="button"
            @click="setFontScale(option.value)"
            class="rounded-lg border px-3 py-2.5 transition-colors cursor-pointer"
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

      <!-- Detail Form Mockup -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
          <input 
            v-model="user.name"
            type="text" 
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
          <input 
            v-model="user.email"
            type="email" 
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>
      </div>

    </div>
  </div>
</template>