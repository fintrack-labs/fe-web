import { computed, ref, watch } from 'vue'
import { STORAGE_KEY } from '@/constants/storage'

export type ThemeMode = 'auto' | 'light' | 'dark'

const AUTO_CHECK_INTERVAL_MS = 60 * 1000

const LIGHT_START_HOUR = 6
const DARK_START_HOUR = 18

export function isNightTime(date = new Date()): boolean {
    const hour = date.getHours()
    return hour >= DARK_START_HOUR || hour < LIGHT_START_HOUR
}

export function resolveAutoMode(date = new Date()): 'light' | 'dark' {
    return isNightTime(date) ? 'dark' : 'light'
}

function readStoredMode(): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY.THEME)
    return stored === 'light' || stored === 'dark' ? stored : 'auto'
}

const now = ref(new Date())
const mode = ref<ThemeMode>(readStoredMode())

const isDark = computed(() => {
    if (mode.value === 'light') return false
    if (mode.value === 'dark') return true
    return isNightTime(now.value)
})

let autoTimer: ReturnType<typeof setInterval> | null = null

function applyTheme(): void {
    const root = document.documentElement
    if (isDark.value) {
        root.classList.add('dark')
    } else {
        root.classList.remove('dark')
    }
}

function persistMode(next: ThemeMode): void {
    const value = next === 'auto' ? '' : next
    localStorage.setItem(STORAGE_KEY.THEME, value)
}

watch(isDark, applyTheme, { immediate: true })

function startAutoCheck(): void {
    if (autoTimer) return
    autoTimer = setInterval(() => {
        now.value = new Date()
    }, AUTO_CHECK_INTERVAL_MS)
}

function stopAutoCheck(): void {
    if (autoTimer) {
        clearInterval(autoTimer)
        autoTimer = null
    }
}

function cycleTheme(): void {
    const next: ThemeMode = isDark.value ? 'light' : 'dark'
    mode.value = next
    persistMode(next)
}

function setTheme(next: ThemeMode): void {
    mode.value = next
    persistMode(next)
}

export function useTheme() {
    startAutoCheck()

    return {
        mode: computed(() => mode.value),
        isDark,
        cycleTheme,
        setTheme,
        dispose: stopAutoCheck
    }
}