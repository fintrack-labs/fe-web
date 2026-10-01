import type { TransactionType } from '@/dto/transaction.dto'

export interface DashboardMonthResponseDto {
    key: string
    year: number
    monthIndex: number
    daysInMonth: number
    totals: Record<TransactionType, number>
    previousTotals: Record<TransactionType, number>
    daily: Record<TransactionType, number[]>
}