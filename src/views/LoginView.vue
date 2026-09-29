<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth.service'
import { scheduleTokenRefresh } from '@/services/token-refresh.service'
import { useToast } from '@/composables/useToast'
import { getApiErrorMessage } from '@/utils/api-error'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const isLoginEnabled = computed(() => {
  return !isLoading.value && email.value.length > 0 && password.value.length > 0
})

const handleLogin = async () => {
  if (!isLoginEnabled.value) return
  isLoading.value = true
  try {
    const { accessToken, refreshToken } = await authService.login({
      email: email.value,
      password: password.value,
      clientId: import.meta.env.VITE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_CLIENT_SECRET,
    })
    if (!accessToken || !refreshToken) {
      throw new Error('Incomplete login response')
    }
    authStore.setToken(accessToken, refreshToken)
    scheduleTokenRefresh()
    toast.success('Login successful. Welcome!')
    router.push({ name: 'dashboard' })
  } catch(error) {
    toast.error(getApiErrorMessage(error, 'Login failed. Please try again.'))
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen w-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
    <div class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-6">
      
      <!-- Header / Title -->
      <div class="text-center space-y-1">
        <h2 class="text-xl font-bold text-white">Login FinTrack</h2>
        <p class="text-xs text-slate-400">Finance Tracking System</p>
      </div>

      <!-- Form Sederhana -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Email / Username</label>
          <input 
            v-model="email"
            type="text" 
            placeholder="admin@example.com"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Password</label>
          <input 
            v-model="password"
            type="password" 
            placeholder="••••••••"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button 
          type="submit" 
          class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer disabled:bg-slate-700 disabled:cursor-not-allowed"
          :disabled="!isLoginEnabled"
        >
          {{ isLoading ? 'Processing...' : 'Sign In' }}
        </button>
      </form>

<!-- Navigasi ke Register -->
      <div class="text-center text-xs text-slate-400">
        Don't have an account? 
        <RouterLink to="/register" class="text-indigo-400 hover:underline font-medium">
          Sign up here
        </RouterLink>
      </div>

    </div>
  </div>
</template>