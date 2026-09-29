import { AccountType } from '@/dto/account.dto'

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    [AccountType.CASH]: 'Cash',
    [AccountType.BANK]: 'Bank',
    [AccountType.E_WALLET]: 'E-Wallet',
    [AccountType.CREDIT_CARD]: 'Credit Card',
    [AccountType.INVESTMENT]: 'Investment'
}

const ACCOUNT_TYPE_BADGE_CLASSES: Record<AccountType, string> = {
    [AccountType.CASH]: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
    [AccountType.BANK]: 'bg-indigo-500/10 text-indigo-300 ring-indigo-500/20',
    [AccountType.E_WALLET]: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
    [AccountType.CREDIT_CARD]: 'bg-violet-500/10 text-violet-300 ring-violet-500/20',
    [AccountType.INVESTMENT]: 'bg-amber-500/10 text-amber-300 ring-amber-500/20'
}

const FALLBACK_BADGE_CLASS = 'bg-slate-500/10 text-slate-300 ring-slate-500/20'

export function toAccountTypeLabel(type: AccountType | string): string {
    return ACCOUNT_TYPE_LABELS[type as AccountType] ?? String(type)
}

export function toAccountTypeBadgeClass(type: AccountType | string): string {
    return ACCOUNT_TYPE_BADGE_CLASSES[type as AccountType] ?? FALLBACK_BADGE_CLASS
}
