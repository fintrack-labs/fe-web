<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import { useHideOnScroll } from '@/composables/useHideOnScroll'
import { useTheme } from '@/composables/useTheme'
import { STORAGE_KEY } from '@/constants/storage'

const mainRef = ref<HTMLElement | null>(null)

const route = useRoute()
const isHeaderHidden = useHideOnScroll(mainRef)
const { isDark: isDarkMode, cycleTheme: cycleThemeMode } = useTheme()

const drawerQuery = window.matchMedia('(min-width: 768px)')
const desktopQuery = window.matchMedia('(min-width: 1200px)')

const isDrawer = ref(!drawerQuery.matches)
const isTablet = ref(drawerQuery.matches && !desktopQuery.matches)
const isDesktop = ref(desktopQuery.matches)

const readSidebarPreference = (): boolean => {
  return localStorage.getItem(STORAGE_KEY.SIDEBAR) !== 'closed'
}

const isSidebarOpen = ref(isDesktop.value ? readSidebarPreference() : isTablet.value)

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
  if (isDesktop.value) persistSidebarPreference()
}

const persistSidebarPreference = () => {
  localStorage.setItem(STORAGE_KEY.SIDEBAR, isSidebarOpen.value ? 'open' : 'closed')
}

const applyFromBreakpoint = () => {
  isDrawer.value = !drawerQuery.matches
  isTablet.value = drawerQuery.matches && !desktopQuery.matches
  isDesktop.value = desktopQuery.matches

  if (isDrawer.value) {
    isSidebarOpen.value = false
    return
  }
  if (isDesktop.value) {
    isSidebarOpen.value = readSidebarPreference()
    return
  }
  isSidebarOpen.value = true
}

const handleDrawerChange = (event: MediaQueryListEvent) => applyFromBreakpoint()
const handleDesktopChange = (event: MediaQueryListEvent) => applyFromBreakpoint()

watch(
  () => route.fullPath,
  () => {
    isHeaderHidden.value = false
    if (isDrawer.value) closeSidebar()
  }
)

onMounted(() => {
  drawerQuery.addEventListener('change', handleDrawerChange)
  desktopQuery.addEventListener('change', handleDesktopChange)
})

onBeforeUnmount(() => {
  drawerQuery.removeEventListener('change', handleDrawerChange)
  desktopQuery.removeEventListener('change', handleDesktopChange)
})

const sidebarWrapperClass = computed(() => {
  if (isDrawer.value) return ['w-0']
  if (isTablet.value) return ['w-64']
  return [isSidebarOpen.value ? 'w-64' : 'w-0', 'overflow-hidden']
})

const showMenuButton = computed(() => isDrawer.value || isDesktop.value)
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    
    <!-- 1. HEADER (Atas, Menghilang saat scroll ke bawah) -->
    <header 
      class="fixed top-0 inset-x-0 h-16 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 z-40 transition-transform duration-300 ease-in-out"
      :class="isHeaderHidden ? '-translate-y-full' : 'translate-y-0'"
    >
      <div class="flex items-center gap-3">
        <!-- Tombol Toggle Sidebar (Muncul di Mobile: md:hidden) -->
        <button 
          v-if="showMenuButton"
          @click="toggleSidebar"
          type="button" 
          class="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 focus:outline-none cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <span class="font-bold text-slate-900 dark:text-white text-lg">App Logo</span>
      </div>

      <div class="flex items-center gap-4">
        <!-- Tombol Toggle Tema -->
        <button 
          @click="cycleThemeMode"
          type="button"
          class="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 focus:outline-none cursor-pointer"
          :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          :title="isDarkMode ? 'Light mode' : 'Dark mode'"
        >
          <svg v-if="isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1.5m0 15V21m9-9h-1.5M4.5 12H3m15.364-6.364l-1.06 1.06M7.696 17.304l-1.061 1.061m0-12.73l1.061 1.06M7.696 7.696l1.061 1.061M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z"/>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.752 15.002A9.718 9.718 0 0118 15.75a9.75 9.75 0 01-9.75-9.75c0-1.49.333-2.905.933-4.168A9.75 9.75 0 1021.752 15.002z"/>
          </svg>
        </button>

        <div class="text-xs text-slate-500 dark:text-slate-400">
          Status: <span class="text-emerald-500 dark:text-emerald-400 font-medium">Online</span>
        </div>
      </div>
    </header>

    <div class="h-16 shrink-0"></div>

    <!-- 2. MIDDLE CONTAINER (Sidebar + Content Utama) -->
    <div class="flex flex-1 min-h-0 relative">
      
      <!-- Backdrop / Dimmer Overlay (Muncul di Mobile saat Sidebar Terbuka) -->
      <div 
        v-if="isDrawer && isSidebarOpen" 
        @click="closeSidebar" 
        class="fixed inset-0 bg-black/60 z-10 md:hidden transition-opacity"
      ></div>

      <!-- Sidebar Komponent (membungkus agar animasi lebar desktop bisa mengontrol tampil/sembunyi) -->
      <div
        :class="['shrink-0 min-h-0 transition-[width] duration-300 ease-in-out', ...sidebarWrapperClass]"
      >
        <Sidebar 
          :is-open="isDrawer ? isSidebarOpen : true" 
          :is-header-hidden="isHeaderHidden"
          @close="closeSidebar" 
        />
      </div>

      <!-- Main Body / Content Area (Kanan / Penuh di Mobile) -->
      <main ref="mainRef" class="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950 w-full">
        <RouterView />
      </main>

    </div>

    <!-- 3. FOOTER (Bawah, Membentang Penuh) -->
    <footer class="h-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 text-xs text-slate-500 dark:text-slate-500 shrink-0 z-30">
      <p>&copy; 2026 App Template. All rights reserved.</p>
      <p>v1.0.0</p>
    </footer>

  </div>
</template>