import { computed, ref } from 'vue'
import { STORAGE_KEY } from '@/constants/storage'

export type FontScaleMode = 'sm' | 'md' | 'lg'

const ROOT_FONT_SIZE_PX: Record<FontScaleMode, number> = {
    sm: 14,
    md: 16,
    lg: 18
}

function readStoredScale(): FontScaleMode {
    const stored = localStorage.getItem(STORAGE_KEY.FONT_SCALE)
    return stored === 'sm' || stored === 'md' || stored === 'lg' ? stored : 'md'
}

const scale = ref<FontScaleMode>(readStoredScale())

export function applyFontScale(): void {
    document.documentElement.style.fontSize = `${ROOT_FONT_SIZE_PX[scale.value]}px`
}

export function setFontScale(next: FontScaleMode): void {
    scale.value = next
    localStorage.setItem(STORAGE_KEY.FONT_SCALE, next)
    applyFontScale()
}

export function useFontScale() {
    return {
        scale: computed(() => scale.value),
        setFontScale
    }
}