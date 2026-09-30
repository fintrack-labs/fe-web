import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
    id: number
    type: ToastType
    message: string
}

const AUTO_DISMISS_MS = 5000

const toasts = ref<Toast[]>([])
let nextId = 0

function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function push(type: ToastType, message: string): void {
    const id = ++nextId
    toasts.value = [...toasts.value, { id, type, message }]
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
}

export function useToast() {
    return {
        toasts,
        dismiss,
        success: (message: string) => push('success', message),
        error: (message: string) => push('error', message),
        info: (message: string) => push('info', message)
    }
}
