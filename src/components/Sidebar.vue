<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter()
const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleNavClick = () => {
  if(!isAuthenticated.value){
    router.push('/login')
    return
  }
  authStore.logout()
  emit('close')
}
</script>

<template>
  <aside 
    :class="[
      'fixed md:static top-16 bottom-12 left-0 z-20 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 transition-transform duration-300 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]"
  >
    <!-- Navigation Links -->
    <nav class="p-4 space-y-1 overflow-y-auto">
      <RouterLink 
        to="/" 
        @click="handleNavClick"
        exact-active-class="bg-indigo-600/10 text-indigo-400 font-semibold border-r-2 border-indigo-500"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-800 hover:text-white"
      >
        <span>Dashboard</span>
      </RouterLink>

      <RouterLink 
        to="/profile" 
        @click="handleNavClick"
        exact-active-class="bg-indigo-600/10 text-indigo-400 font-semibold border-r-2 border-indigo-500"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-800 hover:text-white"
      >
        <span>Profil Saya</span>
      </RouterLink>

      <RouterLink 
        to="/login" 
        @click="handleNavClick"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors mt-6"
      >
        <span>Keluar (Logout)</span>
      </RouterLink>
    </nav>
  </aside>
</template>