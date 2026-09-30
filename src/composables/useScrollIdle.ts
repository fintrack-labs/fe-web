import { onBeforeUnmount, ref } from 'vue'

const DEFAULT_IDLE_DELAY = 700

export function useScrollIdle(delay = DEFAULT_IDLE_DELAY) {
    const isScrolling = ref(false)
    let timer: number | undefined

    function onScroll(): void {
        isScrolling.value = true
        if (timer !== undefined) window.clearTimeout(timer)
        timer = window.setTimeout(() => {
            isScrolling.value = false
        }, delay)
    }

    onBeforeUnmount(() => {
        if (timer !== undefined) window.clearTimeout(timer)
    })

    return { isScrolling, onScroll }
}
