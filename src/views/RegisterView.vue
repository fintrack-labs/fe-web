<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth.service'
import { useToast } from '@/composables/useToast'
import { getApiErrorMessage } from '@/utils/api-error'

const router = useRouter()
const toast = useToast()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

const isRegisterEnabled = computed(() => {
  return !isLoading.value &&
    name.value.length > 0 &&
    email.value.length > 0 &&
    password.value.length > 0 &&
    confirmPassword.value.length > 0
})

const validate = (): string => {
  if (name.value.trim().length < 2) return 'Full name must be at least 2 characters.'
  if (name.value.trim().length > 100) return 'Full name must be at most 100 characters.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) return 'Invalid email format.'
  if (password.value.length < 8) return 'Password must be at least 8 characters.'
  if (password.value.length > 100) return 'Password must be at most 100 characters.'
  if (password.value !== confirmPassword.value) return 'Password confirmation does not match.'
  return ''
}

const handleRegister = async () => {
  if (!isRegisterEnabled.value) return

  const validationError = validate()
  if (validationError) {
    toast.error(validationError)
    return
  }

  isLoading.value = true
  try {
    const result = await authService.register({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value
    })
    toast.success(`Registration successful. Check ${result.user.email} for the activation link before signing in.`)
    router.push({ name: 'login' })
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Registration failed. Please try again.'))
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen w-screen flex items-center justify-center bg-slate-100 p-4 font-sans dark:bg-slate-950">
    <div class="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-6 dark:bg-slate-900 dark:border-slate-800">
      
      <!-- Header / Title -->
      <div class="text-center space-y-1">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Create Account</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Create a new FinTrack account</p>
      </div>

      <!-- Form Sederhana -->
      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
          <input 
            v-model="name"
            type="text" 
            placeholder="John Doe"
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Email</label>
          <input 
            v-model="email"
            type="email" 
            placeholder="admin@example.com"
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Password</label>
          <input 
            v-model="password"
            type="password" 
            placeholder="At least 8 characters"
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Confirm Password</label>
          <input 
            v-model="confirmPassword"
            type="password" 
            placeholder="Repeat password"
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        <button 
          type="submit" 
          :disabled="!isRegisterEnabled"
          class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-700"
        >
          {{ isLoading ? 'Registering...' : 'Sign Up' }}
        </button>
      </form>

      <!-- Navigasi ke Login -->
      <div class="text-center text-xs text-slate-500 dark:text-slate-400">
        Already have an account? 
        <RouterLink :to="{ name: 'login' }" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
          Sign in here
        </RouterLink>
      </div>

    </div>
  </div>
</template>
