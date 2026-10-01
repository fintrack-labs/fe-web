export function formatCurrency(value: number, currency: string): string {
    try {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency,
            maximumFractionDigits: 2
        }).format(value)
    } catch {
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value)
    }
}
