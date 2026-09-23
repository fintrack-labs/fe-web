<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'

// State untuk kontrol Buka/Tutup Sidebar di layar Mobile
const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-950 font-sans text-slate-100">
    
    <!-- 1. HEADER (Atas, Membentang Penuh) -->
    <header class="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0 z-30">
      <div class="flex items-center gap-3">
        <!-- Tombol Hamburger Menu (Hanya Muncul di Mobile: md:hidden) -->
        <button 
          @click="toggleSidebar"
          type="button" 
          class="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
          aria-label="Toggle Menu"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <span class="font-bold text-white text-lg">App Logo</span>
      </div>

      <div class="text-xs text-slate-400">
        Status: <span class="text-emerald-400 font-medium">Online</span>
      </div>
    </header>

    <!-- 2. MIDDLE CONTAINER (Sidebar + Content Utama) -->
    <div class="flex flex-1 min-h-0 relative">
      
      <!-- Backdrop / Dimmer Overlay (Muncul di Mobile saat Sidebar Terbuka) -->
      <div 
        v-if="isSidebarOpen" 
        @click="closeSidebar" 
        class="fixed inset-0 bg-black/60 z-10 md:hidden transition-opacity"
      ></div>

      <!-- Sidebar Komponent -->
      <Sidebar 
        :is-open="isSidebarOpen" 
        @close="closeSidebar" 
      />

      <!-- Main Body / Content Area (Kanan / Penuh di Mobile) -->
      <main class="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-950 w-full">
        <RouterView />
      </main>

    </div>

    <!-- 3. FOOTER (Bawah, Membentang Penuh) -->
    <footer class="h-12 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 md:px-6 text-xs text-slate-500 shrink-0 z-30">
      <p>&copy; 2026 App Template. All rights reserved.</p>
      <p>v1.0.0</p>
    </footer>

  </div>
</template>