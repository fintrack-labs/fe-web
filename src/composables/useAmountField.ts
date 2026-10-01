import { ref } from 'vue'
import type { Ref } from 'vue'
import { formatAmountInput } from '@/utils/amount'

function resolveCaret(next: string, previous: string, caret: number): number {
    if (caret >= previous.length) return next.length

    const digitsBefore = previous.slice(0, caret).replace(/\D/g, '').length
    if (digitsBefore === 0) return 0

    let seen = 0
    for (let index = 0; index < next.length; index += 1) {
        if (!/\d/.test(next.charAt(index))) continue
        seen += 1
        if (seen === digitsBefore) return index + 1
    }
    return next.length
}

export function useAmountField(initial = ''): { value: Ref<string>; onInput: (event: Event) => void } {
    const value = ref(initial)

    const onInput = (event: Event) => {
        const input = event.target as HTMLInputElement
        const nextFormatted = input.value
        const caret = input.selectionStart ?? nextFormatted.length
        const previousFormatted = value.value
        const next = formatAmountInput(nextFormatted, previousFormatted)
        const nextCaret = resolveCaret(next, nextFormatted, caret)

        value.value = next
        input.value = next
        input.setSelectionRange(nextCaret, nextCaret)
    }

    return { value, onInput }
}
