<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { accountService } from '@/services/account.service'
import { useToast } from '@/composables/useToast'
import SelectField from '@/components/SelectField.vue'
import { getApiErrorMessage } from '@/utils/api-error'
import { parseAmount, countDecimalPlaces } from '@/utils/amount'
import { useAmountField } from '@/composables/useAmountField'
import { toAccountTypeLabel } from '@/utils/account-type'
import { AccountType, CurrencyType } from '@/dto/account.dto'
import type { CreateAccountRequestDto } from '@/dto/account.dto'

const toast = useToast()
const router = useRouter()

const name = ref('')
const type = ref<AccountType>(AccountType.BANK)
const currency = ref<CurrencyType>(CurrencyType.IDR)
const accountNumber = ref('')
const { value: initialBalance, onInput: onInitialBalanceInput } = useAmountField()

const isSubmitting = ref(false)
const showSavedDialog = ref(false)

const TYPE_OPTIONS = Object.values(AccountType).map((value) => ({
    value,
    label: toAccountTypeLabel(value)
}))

const CURRENCY_OPTIONS = Object.values(CurrencyType).map((value) => ({ value, label: value }))

const isSubmitEnabled = computed(() => {
    if (isSubmitting.value) return false
    if (!name.value.trim()) return false
    return true
})

const validate = (): string => {
    if (!name.value.trim()) return 'Account name is required.'
    if (initialBalance.value.trim()) {
        const parsed = parseAmount(initialBalance.value)
        if (parsed === null) return 'Initial balance is not valid.'
        if (parsed < 0) return 'Initial balance must not be negative.'
        if (countDecimalPlaces(initialBalance.value) > 2) {
            return 'Initial balance must have at most 2 decimal places.'
        }
    }
    return ''
}

const buildPayload = (): CreateAccountRequestDto => {
    const payload: CreateAccountRequestDto = {
        name: name.value.trim(),
        type: type.value,
        currency: currency.value
    }
    const accountNumberValue = accountNumber.value.trim()
    if (accountNumberValue) payload.accountNumber = accountNumberValue
    const parsedBalance = parseAmount(initialBalance.value)
    if (initialBalance.value.trim() && parsedBalance !== null && parsedBalance !== 0) {
        payload.initialBalance = parsedBalance
    }
    return payload
}

const resetForm = () => {
    name.value = ''
    type.value = AccountType.BANK
    currency.value = CurrencyType.IDR
    accountNumber.value = ''
    initialBalance.value = ''
}

const handleSubmit = async () => {
    if (!isSubmitEnabled.value) return

    const validationError = validate()
    if (validationError) {
        toast.error(validationError)
        return
    }

    isSubmitting.value = true
    try {
        await accountService.create(buildPayload())
        toast.success('Account saved successfully.')
        showSavedDialog.value = true
    } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to save the account.'))
    } finally {
        isSubmitting.value = false
    }
}

const addAnotherAccount = () => {
    showSavedDialog.value = false
    resetForm()
}

const goToAccountList = () => {
    showSavedDialog.value = false
    void router.push({ name: 'accounts' })
}
</script>

<template>
    <div class="max-w-2xl space-y-6">
        <!-- Header -->
        <div class="space-y-1">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">New Account</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400">Add a new account with its opening balance.</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Account Name</label>
                    <input
                        v-model="name"
                        type="text"
                        maxlength="100"
                        placeholder="Example: BCA, GoPay, Cash Wallet"
                        class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                </div>

                <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Type</label>
                    <SelectField v-model="type" :options="TYPE_OPTIONS" />
                </div>

                <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Currency</label>
                    <SelectField v-model="currency" :options="CURRENCY_OPTIONS" />
                </div>

                <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Account Number</label>
                    <input
                        v-model="accountNumber"
                        type="text"
                        maxlength="50"
                        placeholder="Optional"
                        class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                </div>

                <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Initial Balance</label>
                    <input
                        :value="initialBalance"
                        @input="onInitialBalanceInput"
                        type="text"
                        inputmode="decimal"
                        autocomplete="off"
                        placeholder="0,00"
                        class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                    <p class="text-xs text-slate-500 dark:text-slate-500 mt-1">At most 2 decimal places, optional.</p>
                </div>
            </div>

            <button
                type="submit"
                :disabled="!isSubmitEnabled"
                class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-700"
            >
                {{ isSubmitting ? 'Saving...' : 'Save Account' }}
            </button>
        </form>

        <!-- Saved dialog -->
        <div
            v-if="showSavedDialog"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            @click.self="addAnotherAccount"
        >
            <div class="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Account saved</h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Do you want to add another account?</p>
                <div class="mt-5 space-y-2">
                    <button
                        type="button"
                        @click="addAnotherAccount"
                        class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                    >
                        Add another account
                    </button>
                    <button
                        type="button"
                        @click="goToAccountList"
                        class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        View accounts
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>