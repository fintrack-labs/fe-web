<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { cancelTokenRefresh } from '@/services/token-refresh.service';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

defineProps<{
  isOpen: boolean
  isHeaderHidden: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const openGroups = ref<string[]>(['account', 'transaction'])

const GROUP_PATHS: Record<string, string[]> = {
  account: ['/accounts', '/accounts/new', '/transactions/adjustment'],
  transaction: ['/transactions', '/transactions/new']
}

const isGroupActive = (group: string): boolean =>
  GROUP_PATHS[group]?.some((path) => route.path === path) ?? false

const isGroupOpen = (group: string): boolean => openGroups.value.includes(group)

const toggleGroup = (group: string) => {
  if (openGroups.value.includes(group)) {
    openGroups.value = openGroups.value.filter((key) => key !== group)
  } else {
    openGroups.value = [...openGroups.value, group]
  }
}

watch(
  () => route.path,
  (path) => {
    const activeGroups = Object.entries(GROUP_PATHS)
      .filter((entry) => entry[1].includes(path))
      .map((entry) => entry[0])
    if (activeGroups.length > 0) {
      openGroups.value = [...new Set([...openGroups.value, ...activeGroups])]
    }
  }
)

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
      'fixed md:static md:h-full bottom-12 left-0 z-20 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex flex-col shrink-0 transition-transform duration-300 ease-in-out',
      isHeaderHidden ? 'top-0' : 'top-16',
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]"
  >
    <nav class="p-4 space-y-1 overflow-y-auto">
      <RouterLink 
        to="/" 
        exact-active-class="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-semibold border-r-2 border-indigo-500"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <span>Dashboard</span>
      </RouterLink>

      <!-- Account group -->
      <div class="pt-1">
        <button
          type="button"
          @click="toggleGroup('account')"
          class="flex w-full items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
          :class="isGroupActive('account') ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''"
          :aria-expanded="isGroupOpen('account')"
        >
          <span class="font-medium">Account</span>
          <svg
            class="h-4 w-4 shrink-0 transition-transform duration-200"
            :class="isGroupOpen('account') ? 'rotate-180' : ''"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div v-if="isGroupOpen('account')" class="ml-3 mt-1 space-y-1 border-l border-slate-200 dark:border-slate-800 pl-2">
          <RouterLink
            to="/accounts"
            exact-active-class="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-semibold border-l-2 border-indigo-500"
            class="flex items-center px-3 py-2 rounded-lg text-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <span>List</span>
          </RouterLink>
          <RouterLink
            to="/accounts/new"
            exact-active-class="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-semibold border-l-2 border-indigo-500"
            class="flex items-center px-3 py-2 rounded-lg text-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <span>Add</span>
          </RouterLink>
          <RouterLink
            to="/transactions/adjustment"
            exact-active-class="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-semibold border-l-2 border-indigo-500"
            class="flex items-center px-3 py-2 rounded-lg text-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <span>Adjustment</span>
          </RouterLink>
        </div>
      </div>

      <!-- Transaction group -->
      <div class="pt-1">
        <button
          type="button"
          @click="toggleGroup('transaction')"
          class="flex w-full items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
          :class="isGroupActive('transaction') ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''"
          :aria-expanded="isGroupOpen('transaction')"
        >
          <span class="font-medium">Transaction</span>
          <svg
            class="h-4 w-4 shrink-0 transition-transform duration-200"
            :class="isGroupOpen('transaction') ? 'rotate-180' : ''"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div v-if="isGroupOpen('transaction')" class="ml-3 mt-1 space-y-1 border-l border-slate-200 dark:border-slate-800 pl-2">
          <RouterLink
            to="/transactions"
            exact-active-class="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-semibold border-l-2 border-indigo-500"
            class="flex items-center px-3 py-2 rounded-lg text-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <span>List</span>
          </RouterLink>
          <RouterLink
            to="/transactions/new"
            exact-active-class="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-semibold border-l-2 border-indigo-500"
            class="flex items-center px-3 py-2 rounded-lg text-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <span>Add</span>
          </RouterLink>
        </div>
      </div>

      <RouterLink 
        to="/profile" 
        exact-active-class="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-semibold border-r-2 border-indigo-500"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <span>Profile</span>
      </RouterLink>

      <button
        type="button"
        @click="handleLogout"
        class="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer mt-6"
      >
        <span>Logout</span>
      </button>
    </nav>
  </aside>
</template>