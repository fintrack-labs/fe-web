import { onBeforeUnmount, ref } from 'vue'
import type { Ref } from 'vue'

export const MIN_COLUMN_WIDTH = 60

interface ResizableColumn {
    key: string
    width: number
}

export function useResizableColumns(
    columns: Ref<ResizableColumn[]>,
    storageKey?: string
): { startResize: (event: PointerEvent, key: string) => void; reset: () => void } {
    const activeKey = ref('')
    const startX = ref(0)
    const startWidth = ref(0)
    const initialWidths = new Map(columns.value.map((column) => [column.key, column.width]))

    function persist(): void {
        if (!storageKey) return
        const payload = Object.fromEntries(columns.value.map((c) => [c.key, c.width]))
        localStorage.setItem(storageKey, JSON.stringify(payload))
    }

    function restore(): void {
        if (!storageKey) return
        try {
            const raw = localStorage.getItem(storageKey)
            if (!raw) return
            const payload = JSON.parse(raw) as Record<string, number>
            columns.value.forEach((column) => {
                const stored = payload[column.key]
                if (typeof stored === 'number' && Number.isFinite(stored)) {
                    column.width = Math.max(MIN_COLUMN_WIDTH, Math.round(stored))
                }
            })
        } catch {
            localStorage.removeItem(storageKey)
        }
    }

    function handlePointerMove(event: PointerEvent): void {
        const column = columns.value.find((item) => item.key === activeKey.value)
        if (!column) return
        const next = Math.max(MIN_COLUMN_WIDTH, Math.round(startWidth.value + event.clientX - startX.value))
        column.width = next
    }

    function handlePointerUp(): void {
        if (!activeKey.value) return
        activeKey.value = ''
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerUp)
        document.body.classList.remove('select-none')
        persist()
    }

    function startResize(event: PointerEvent, key: string): void {
        const column = columns.value.find((item) => item.key === key)
        if (!column) return

        event.preventDefault()
        event.stopPropagation()
        activeKey.value = key
        startX.value = event.clientX
        startWidth.value = column.width
        document.body.classList.add('select-none')
        window.addEventListener('pointermove', handlePointerMove)
        window.addEventListener('pointerup', handlePointerUp)
        window.addEventListener('pointercancel', handlePointerUp)
    }

    function reset(): void {
        columns.value.forEach((column) => {
            column.width = initialWidths.get(column.key) ?? MIN_COLUMN_WIDTH
        })
        if (storageKey) localStorage.removeItem(storageKey)
    }

    restore()
    onBeforeUnmount(handlePointerUp)

    return { startResize, reset }
}
