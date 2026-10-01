import { AccountType } from '@/dto/account.dto'
import { PaymentMethod } from '@/dto/transaction.dto'

const ACCOUNT_TYPE_TO_PAYMENT_METHOD: Record<AccountType, PaymentMethod> = {
    [AccountType.CASH]: PaymentMethod.CASH,
    [AccountType.BANK]: PaymentMethod.BANK,
    [AccountType.E_WALLET]: PaymentMethod.E_WALLET,
    [AccountType.CREDIT_CARD]: PaymentMethod.CREDIT_CARD,
    [AccountType.INVESTMENT]: PaymentMethod.BANK
}

export function toPaymentMethod(accountType: AccountType | undefined): PaymentMethod | '' {
    if (!accountType) return ''
    return ACCOUNT_TYPE_TO_PAYMENT_METHOD[accountType] ?? PaymentMethod.BANK
}
