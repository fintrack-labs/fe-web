import { TransactionType } from '@/dto/transaction.dto'

export type MonthPeriodKey = string

export const TRANSACTION_TYPES: TransactionType[] = [
    TransactionType.INCOME,
    TransactionType.EXPENSE,
    TransactionType.TRANSFER,
    TransactionType.ADJUSTMENT
]

const pad2 = (value: number): string => String(value).padStart(2, '0')

export function monthKey(year: number, monthIndex: number): MonthPeriodKey {
    return `${year}-${pad2(monthIndex + 1)}`
}

export function currentMonthKey(): MonthPeriodKey {
    const now = new Date()
    return monthKey(now.getFullYear(), now.getMonth())
}

export function keyToYear(key: MonthPeriodKey): number {
    return Number(key.slice(0, 4))
}

export function keyToMonthIndex(key: MonthPeriodKey): number {
    return Number(key.slice(5, 7)) - 1
}

export function shiftMonth(key: MonthPeriodKey, offset: number): MonthPeriodKey {
    const index = keyToYear(key) * 12 + keyToMonthIndex(key) + offset
    return monthKey(Math.floor(index / 12), index % 12)
}

export function formatMonthLabel(key: MonthPeriodKey): string {
    return new Date(keyToYear(key), keyToMonthIndex(key), 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    })
}