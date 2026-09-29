import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Ref } from 'vue'

const DELTA_THRESHOLD = 8

export function useHideOnScroll(
    target: Ref<HTMLElement | null>,
    revealOffset = 72
): Ref<boolean> {
    const isHidden = ref(false)
    let lastPosition = 0

    const handleScroll = (): void => {
        const element = target.value
        if (!element) return

        const position = element.scrollTop
        const delta = position - lastPosition
        if (Math.abs(delta) < DELTA_THRESHOLD) return

        lastPosition = position
        isHidden.value = delta > 0 && position > revealOffset
    }

    onMounted(() => {
        const element = target.value
        if (!element) return
        lastPosition = element.scrollTop
        element.addEventListener('scroll', handleScroll, { passive: true })
    })

    onBeforeUnmount(() => {
        target.value?.removeEventListener('scroll', handleScroll)
    })

    return isHidden
}
