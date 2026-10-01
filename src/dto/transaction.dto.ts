export enum TransactionType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE',
    TRANSFER = 'TRANSFER',
    ADJUSTMENT = 'ADJUSTMENT'
}

export enum PaymentMethod {
    CASH = 'CASH',
    BANK = 'BANK',
    E_WALLET = 'E_WALLET',
    CREDIT_CARD = 'CREDIT_CARD'
}

export interface CreateTransactionRequestDto {
    type: TransactionType
    amount: number
    sourceAccountId?: number
    destinationAccountId?: number
    categoryId?: number
    paymentMethod?: PaymentMethod
    transactionDate?: string
    merchantName?: string
    description?: string
    receiptImageUrl?: string
    note?: string
    isRecurring?: boolean
}

export interface AdjustBalanceRequestDto {
    accountId: number
    actualBalance: number
    reason?: string
}

export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC'
}

export interface TransactionResponseDto {
    id: number
    sourceAccountId: number | null
    destinationAccountId: number | null
    categoryId: number | null
    type: TransactionType
    paymentMethod: PaymentMethod
    amount: number
    merchantName: string | null
    description: string | null
    receiptImageUrl: string | null
    note: string | null
    isRecurring: boolean
    transactionDate: string
}

export interface TransactionListParams {
    type?: TransactionType
    paymentMethod?: PaymentMethod
    categoryId?: number
    description?: string
    merchantName?: string
    transactionDate?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: SortOrder
}
