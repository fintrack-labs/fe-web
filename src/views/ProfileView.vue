<script setup lang="ts">
import { ref } from 'vue'

const user = ref({
  name: 'John Doe',
  email: 'johndoe@example.com',
  role: 'Senior Developer'
})
</script>

<template>
  <div class="space-y-6">
    <!-- Title Page -->
    <div>
      <h1 class="text-2xl font-bold text-white">Profil Pengguna</h1>
      <p class="text-sm text-slate-400">Kelola informasi akun dan pengaturan profil Anda.</p>
    </div>

    <!-- Profile Card Template -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl space-y-6">
      
      <!-- Avatar & Basic Info -->
      <div class="flex items-center gap-4 border-b border-slate-800 pb-6">
        <div class="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white">
          {{ user.name.substring(0, 2).toUpperCase() }}
        </div>
        <div>
          <h3 class="text-lg font-semibold text-white">{{ user.name }}</h3>
          <p class="text-sm text-slate-400">{{ user.role }}</p>
        </div>
      </div>

      <!-- Detail Form Mockup -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Nama Lengkap</label>
          <input 
            v-model="user.name"
            type="text" 
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Email</label>
          <input 
            v-model="user.email"
            type="email" 
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <!-- Action Button -->
      <div class="flex justify-end pt-2">
        <button 
          type="button" 
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          Simpan Perubahan
        </button>
      </div>

    </div>
  </div>
</template>