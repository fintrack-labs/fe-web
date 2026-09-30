import { TransactionType } from '@/dto/transaction.dto'

export interface MockTransaction {
    date: string
    type: TransactionType
    amount: number
}

export type MonthPeriodKey = string

export interface MonthSeries {
    key: MonthPeriodKey
    year: number
    monthIndex: number
    daysInMonth: number
    totals: Record<TransactionType, number>
    daily: Record<TransactionType, number[]>
}

export const MOCK_TRANSACTION_TYPES: TransactionType[] = [
    TransactionType.INCOME,
    TransactionType.EXPENSE,
    TransactionType.TRANSFER,
    TransactionType.ADJUSTMENT
]

const MOCK_DATA_MONTHS_BACK = 5
const SEED = 20260228

const pad2 = (value: number): string => String(value).padStart(2, '0')

function mulberry32(seed: number): () => number {
    let state = seed >>> 0
    return () => {
        state = (state + 0x6d2b79f5) >>> 0
        let value = state
        value = Math.imul(value ^ (value >>> 15), value | 1)
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296
    }
}

function buildTransactions(): MockTransaction[] {
    const result: MockTransaction[] = []
    const today = new Date()

    for (let back = MOCK_DATA_MONTHS_BACK; back >= 0; back -= 1) {
        const base = new Date(today.getFullYear(), today.getMonth() - back, 1)
        const monthIndex = base.getFullYear() * 12 + base.getMonth()
        const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()

        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = new Date(base.getFullYear(), base.getMonth(), day)
            if (date.getTime() > today.getTime()) break

            const dateKey = [base.getFullYear(), pad2(base.getMonth() + 1), pad2(day)].join('-')
            const rng = mulberry32(SEED + monthIndex * 97 + day * 13)

            const addDaily = (type: TransactionType, min: number, max: number, count: number) => {
                for (let index = 0; index < count; index += 1) {
                    const amount = Math.round(min + rng() * (max - min))
                    result.push({ date: dateKey, type, amount })
                }
            }

            if (day === 1 || day === 25) {
                addDaily(TransactionType.INCOME, 8_000_000, 15_000_000, 1)
            }
            addDaily(TransactionType.INCOME, 500_000, 6_000_000, Math.floor(rng() * 3))
            addDaily(TransactionType.EXPENSE, 30_000, 2_500_000, Math.floor(rng() * 4) + 1)
            if (rng() < 0.2) {
                addDaily(TransactionType.EXPENSE, 3_000_000, 9_000_000, 1)
            }
            addDaily(TransactionType.TRANSFER, 100_000, 12_000_000, Math.floor(rng() * 3))
            addDaily(TransactionType.ADJUSTMENT, 5_000, 1_200_000, rng() < 0.12 ? 1 : 0)
        }
    }

    return result
}

export const mockTransactions: MockTransaction[] = buildTransactions()

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
    const year = Math.floor(index / 12)
    const month = index % 12
    return monthKey(year, month)
}

export function formatMonthLabel(key: MonthPeriodKey): string {
    return new Date(keyToYear(key), keyToMonthIndex(key), 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    })
}

export function aggregateMonth(key: MonthPeriodKey, upToDay?: number): MonthSeries {
    const year = keyToYear(key)
    const monthIndex = keyToMonthIndex(key)
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const activeDays = upToDay ?? daysInMonth

    const totals = Object.fromEntries(MOCK_TRANSACTION_TYPES.map((type) => [type, 0])) as Record<
        TransactionType,
        number
    >
    const daily = Object.fromEntries(
        MOCK_TRANSACTION_TYPES.map((type) => [
            type,
            Array.from({ length: daysInMonth }, () => 0)
        ])
    ) as Record<TransactionType, number[]>

    const prefix = `${key}-`
    for (const transaction of mockTransactions) {
        if (!transaction.date.startsWith(prefix)) continue
        const dayIndex = Number(transaction.date.slice(8, 10)) - 1
        if (dayIndex >= activeDays) continue
        totals[transaction.type] += transaction.amount
        const daySeries = daily[transaction.type]
        if (daySeries) {
            daySeries[dayIndex] = (daySeries[dayIndex] ?? 0) + transaction.amount
        }
    }

    return { key, year, monthIndex, daysInMonth, totals, daily }
}