<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { cancelTokenRefresh } from '@/services/token-refresh.service';

const router = useRouter();
const authStore = useAuthStore();

defineProps<{
  isOpen: boolean
  isHeaderHidden: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleLogout = () => {
  emit('close')

  const refreshToken = authStore.refreshToken
  if (refreshToken) {
    authService.logout({
      refreshToken,
      clientId: import.meta.env.VITE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_CLIENT_SECRET
    }).catch(() => {});
  }

  cancelTokenRefresh();
  authStore.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <aside 
    :class="[
      'fixed md:static md:h-full bottom-12 left-0 z-20 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 transition-transform duration-300 ease-in-out',
      isHeaderHidden ? 'top-0' : 'top-16',
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]"
  >
    <!-- Navigation Links -->
    <nav class="p-4 space-y-1 overflow-y-auto">
      <RouterLink 
        to="/" 
        exact-active-class="bg-indigo-600/10 text-indigo-400 font-semibold border-r-2 border-indigo-500"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-800 hover:text-white"
      >
        <span>Dashboard</span>
      </RouterLink>

      <RouterLink 
        to="/accounts" 
        exact-active-class="bg-indigo-600/10 text-indigo-400 font-semibold border-r-2 border-indigo-500"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-800 hover:text-white"
      >
        <span>Accounts</span>
      </RouterLink>

      <RouterLink 
        to="/transactions" 
        exact-active-class="bg-indigo-600/10 text-indigo-400 font-semibold border-r-2 border-indigo-500"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-800 hover:text-white"
      >
        <span>Transactions</span>
      </RouterLink>

      <RouterLink 
        to="/transactions/new" 
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-800 hover:text-white"
      >
        <span>New Transaction</span>
      </RouterLink>

      <RouterLink 
        to="/transactions/adjustment" 
        exact-active-class="bg-indigo-600/10 text-indigo-400 font-semibold border-r-2 border-indigo-500"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-800 hover:text-white"
      >
        <span>Balance Adjustment</span>
      </RouterLink>

      <RouterLink 
        to="/profile" 
        exact-active-class="bg-indigo-600/10 text-indigo-400 font-semibold border-r-2 border-indigo-500"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-800 hover:text-white"
      >
        <span>My Profile</span>
      </RouterLink>

      <button
        type="button"
        @click="handleLogout"
        class="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer mt-6"
      >
        <span>Sign Out</span>
      </button>
    </nav>
  </aside>
</template>