import { coreApi } from '@/services/api'
import type { AccountResponseDto, AccountType, CreateAccountRequestDto, CurrencyType } from '@/dto/account.dto'
import type { PaginatedResponse } from '@/dto/paginated.dto'

export type AccountSortOrder = 'ASC' | 'DESC'

export interface AccountListParams {
    search?: string
    type?: AccountType | ''
    currency?: CurrencyType | ''
    sortBy?: string
    sortOrder?: AccountSortOrder
    limit?: number
}

export const accountService = {
    list: (params: AccountListParams = {}) =>
        coreApi.get<unknown, PaginatedResponse<AccountResponseDto>>('/accounts', {
            params: { limit: 200, ...params }
        }),

    create: (body: CreateAccountRequestDto) =>
        coreApi.post<unknown, unknown>('/accounts', body)
}
