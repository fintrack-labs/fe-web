<script setup lang="ts">
import SelectField from '@/components/SelectField.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { accountService } from '@/services/account.service'
import { transactionService } from '@/services/transaction.service'
import { useToast } from '@/composables/useToast'
import { getApiErrorMessage } from '@/utils/api-error'
import { countDecimalPlaces, parseAmount } from '@/utils/amount'
import { useAmountField } from '@/composables/useAmountField'
import { formatCurrency } from '@/utils/format'
import { toAccountTypeLabel } from '@/utils/account-type'
import type { AdjustBalanceRequestDto } from '@/dto/transaction.dto'
import type { AccountResponseDto } from '@/dto/account.dto'

const toast = useToast()
const route = useRoute()
const router = useRouter()

const accounts = ref<AccountResponseDto[]>([])
const isLoadingOptions = ref(false)
const isSubmitting = ref(false)
const showSavedDialog = ref(false)

const accountId = ref('')
const { value: actualBalance, onInput: onActualBalanceInput } = useAmountField()
const reason = ref('')

const selectedAccount = computed(() =>
    accounts.value.find((account) => String(account.id) === String(accountId.value))
)

const accountOptions = computed(() => [
    { value: '', label: 'Select account' },
    ...accounts.value.map((account) => ({
        value: String(account.id),
        label: `${account.name} (${toAccountTypeLabel(account.type)})`
    }))
])

const currentBalance = computed(() => selectedAccount.value?.balance ?? null)

const delta = computed(() => {
    const target = parseAmount(actualBalance.value)
    if (target === null || currentBalance.value === null) return null
    return target - currentBalance.value
})

const isSubmitEnabled = computed(() => {
    if (isSubmitting.value || isLoadingOptions.value) return false
    if (!accountId.value) return false
    if (!actualBalance.value.trim()) return false
    return true
})

const validate = (): string => {
    if (!accountId.value) return 'Account is required.'

    const target = parseAmount(actualBalance.value)
    if (target === null) return 'Actual balance is not valid.'
    if (target <= 0) return 'Actual balance must be greater than 0.'
    if (countDecimalPlaces(actualBalance.value) > 2) {
        return 'Actual balance must have at most 2 decimal places.'
    }
    if (currentBalance.value !== null && target === currentBalance.value) {
        return 'Actual balance is the same as the current balance, nothing to adjust.'
    }
    return ''
}

const loadOptions = async () => {
    isLoadingOptions.value = true
    try {
        const result = await accountService.list()
        accounts.value = result?.data ?? []
    } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load accounts.'))
    } finally {
        isLoadingOptions.value = false
    }
}

const handleSubmit = async () => {
    if (!isSubmitEnabled.value) return

    const validationError = validate()
    if (validationError) {
        toast.error(validationError)
        return
    }

    const payload: AdjustBalanceRequestDto = {
        accountId: Number(accountId.value),
        actualBalance: parseAmount(actualBalance.value) as number
    }
    if (reason.value.trim()) {
        payload.reason = reason.value.trim()
    }

    isSubmitting.value = true
    try {
        await transactionService.adjustBalance(payload)
        toast.success('Balance adjustment saved successfully.')
        showSavedDialog.value = true
    } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to save the balance adjustment.'))
    } finally {
        isSubmitting.value = false
    }
}

const addAnotherAdjustment = () => {
    showSavedDialog.value = false
    accountId.value = ''
    actualBalance.value = ''
    reason.value = ''
}

const goToAccountList = () => {
    showSavedDialog.value = false
    void router.push({ name: 'accounts' })
}

onMounted(loadOptions)

watch(
    () => route.query.accountId,
    (value) => {
        const raw = Array.isArray(value) ? value[0] : value
        accountId.value = raw ? String(raw) : ''
    },
    { immediate: true }
)
</script>

<template>
  <div class="max-w-2xl space-y-6">
    
    <!-- Header -->
    <div class="space-y-1">
      <h1 class="text-2xl font-bold text-white">Balance Adjustment</h1>
      <p class="text-sm text-slate-400">
        Match the account balance with your real balance. The difference is recorded as an adjustment transaction.
      </p>
    </div>

    <div v-if="isLoadingOptions" class="text-sm text-slate-400">Loading accounts...</div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-5">
      <div>
        <label class="block text-xs font-medium text-slate-300 mb-1">Account</label>
        <SelectField
          v-model="accountId"
          :options="accountOptions"
          placeholder="Select account"
        />
      </div>

      <div
        v-if="selectedAccount"
        class="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm space-y-1"
      >
        <p class="text-slate-400">
          Current balance
          <span class="text-slate-200 font-medium">
            {{ formatCurrency(currentBalance ?? 0, selectedAccount.currency) }}
          </span>
        </p>
        <p v-if="delta !== null" class="text-slate-400">
          Difference
          <span
            class="font-medium"
            :class="delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-slate-300'"
          >
            {{ delta > 0 ? '+' : '' }}{{ formatCurrency(delta, selectedAccount.currency) }}
            ({{ delta > 0 ? 'increase' : delta < 0 ? 'decrease' : 'no change' }})
          </span>
        </p>
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-300 mb-1">Actual Balance</label>
        <input
          :value="actualBalance"
          @input="onActualBalanceInput"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          placeholder="0,00"
          class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
        />
        <p class="text-xs text-slate-500 mt-1">At most 2 decimal places, must be greater than 0.</p>
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-300 mb-1">Reason</label>
        <input
          v-model="reason"
          type="text"
          placeholder="Example: rounding correction, transfer mismatch"
          class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          :disabled="!isSubmitEnabled"
          class="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer disabled:bg-slate-700 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Saving...' : 'Save Adjustment' }}
        </button>
        <RouterLink
          :to="{ name: 'transaction-new' }"
          class="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-sm text-center transition-colors"
        >
          New Transaction
        </RouterLink>
      </div>
    </form>

    <!-- Saved dialog -->
    <div
      v-if="showSavedDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      @click.self="addAnotherAdjustment"
    >
      <div class="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 class="text-lg font-semibold text-white">Adjustment saved</h2>
        <p class="mt-1 text-sm text-slate-400">Do you want to adjust another account?</p>
        <div class="mt-5 space-y-2">
          <button
            type="button"
            @click="addAnotherAdjustment"
            class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Adjust another account
          </button>
          <button
            type="button"
            @click="goToAccountList"
            class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700"
          >
            View accounts
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
