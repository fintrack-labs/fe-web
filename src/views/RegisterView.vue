<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')

const handleRegister = () => {
  if (email.value && password.value) {
    router.push('/login')
  }
}
</script>

<template>
  <div class="min-h-screen w-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
    <div class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-6">
      
      <!-- Header / Title -->
      <div class="text-center space-y-1">
        <h2 class="text-xl font-bold text-white">Daftar Akun Test</h2>
        <p class="text-xs text-slate-400">Pengujian Template Form Registrasi</p>
      </div>

      <!-- Form Sederhana -->
      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Nama Lengkap</label>
          <input 
            v-model="name"
            type="text" 
            placeholder="John Doe"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Email</label>
          <input 
            v-model="email"
            type="email" 
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
          class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
        >
          Daftar Sekarang
        </button>
      </form>

      <!-- Navigasi ke Login -->
      <div class="text-center text-xs text-slate-400">
        Sudah punya akun? 
        <RouterLink to="/login" class="text-indigo-400 hover:underline font-medium">
          Login di sini
        </RouterLink>
      </div>

    </div>
  </div>
</template>