import { coreApi } from '@/services/api'
import type {
    AdjustBalanceRequestDto,
    CreateTransactionRequestDto,
    TransactionListParams,
    TransactionResponseDto
} from '@/dto/transaction.dto'
import type { PaginatedResponse } from '@/dto/paginated.dto'

export const transactionService = {
    create: (body: CreateTransactionRequestDto) =>
        coreApi.post<unknown, unknown>('/transactions', body),

    list: (params: TransactionListParams) =>
        coreApi.get<unknown, PaginatedResponse<TransactionResponseDto>>('/transactions', { params }),

    adjustBalance: (body: AdjustBalanceRequestDto) =>
        coreApi.post<unknown, unknown>('/transactions/adjustment', body)
}
