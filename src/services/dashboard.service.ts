import { coreApi } from '@/services/api'
import type { DashboardMonthResponseDto } from '@/dto/dashboard.dto'

export const dashboardService = {
    getMonth: (month: string) =>
        coreApi.get<unknown, DashboardMonthResponseDto>('/transactions/dashboard', { params: { month } })
}