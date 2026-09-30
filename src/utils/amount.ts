const MAX_DECIMAL_PLACES = 2

interface AmountParts {
    integer: string
    decimal: string
    isDecimalPending: boolean
}

function splitAmountInput(input: string, previous?: string): AmountParts {
    const raw = String(input ?? '').replace(/\s/g, '')
    const lastComma = raw.lastIndexOf(',')
    const lastDot = raw.lastIndexOf('.')
    const separatorIndex = Math.max(lastComma, lastDot)
    if (separatorIndex === -1) return { integer: raw, decimal: '', isDecimalPending: false }

    const trailing = raw.slice(separatorIndex + 1)
    if (!/^\d*$/.test(trailing)) return { integer: raw, decimal: '', isDecimalPending: false }

    if (separatorIndex === lastComma) {
        return {
            integer: raw.slice(0, separatorIndex),
            decimal: trailing,
            isDecimalPending: trailing.length === 0
        }
    }

    const isSingleDot = raw.indexOf('.') === lastDot
    const looksLikeDecimal = isSingleDot && /^\d{1,2}$/.test(trailing)
    const isDeletionEdit = previous !== undefined && input.length < previous.length
    if (looksLikeDecimal && !isDeletionEdit) {
        return { integer: raw.slice(0, separatorIndex), decimal: trailing, isDecimalPending: false }
    }

    return { integer: raw, decimal: '', isDecimalPending: false }
}

export function parseAmount(input: string): number | null {
    const { integer, decimal } = splitAmountInput(input)
    const digits = integer.replace(/\D/g, '')
    const fraction = decimal.replace(/\D/g, '')
    if (!digits && !fraction) return null

    const value = Number(fraction ? `${digits || '0'}.${fraction}` : digits)
    return Number.isFinite(value) ? value : null
}

export function countDecimalPlaces(input: string): number {
    return splitAmountInput(input).decimal.replace(/\D/g, '').length
}

export function formatAmountInput(input: string, previous?: string): string {
    const { integer, decimal, isDecimalPending } = splitAmountInput(input, previous)
    const digits = integer.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
    const fraction = decimal.replace(/\D/g, '').slice(0, MAX_DECIMAL_PLACES)

    const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    if (!fraction && !isDecimalPending) return grouped
    return `${grouped || '0'},${fraction}`
}
