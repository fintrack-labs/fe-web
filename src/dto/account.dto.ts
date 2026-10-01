export enum AccountType {
    CASH = 'CASH',
    BANK = 'BANK',
    E_WALLET = 'E_WALLET',
    CREDIT_CARD = 'CREDIT_CARD',
    INVESTMENT = 'INVESTMENT'
}

export enum CurrencyType {
    IDR = 'IDR',
    USD = 'USD',
    EUR = 'EUR'
}

export interface AccountResponseDto {
    id: number
    name: string
    type: AccountType
    balance: number
    accountNumber: string | null
    currency: CurrencyType
}

export interface CreateAccountRequestDto {
    name: string
    type: AccountType
    currency: CurrencyType
    initialBalance?: number
    accountNumber?: string
}
