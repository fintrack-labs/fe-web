<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { accountService } from '@/services/account.service'
import { categoryService } from '@/services/category.service'
import { transactionService } from '@/services/transaction.service'
import { useToast } from '@/composables/useToast'
import SelectField from '@/components/SelectField.vue'
import { ocrService } from '@/services/ocr.service'
import { prepareOcrImage } from '@/utils/prepare-ocr-image'
import { getApiErrorMessage } from '@/utils/api-error'
import { parseAmount, countDecimalPlaces } from '@/utils/amount'
import { toCategoryOptions } from '@/utils/category'
import { toPaymentMethod } from '@/utils/payment-method'
import { useAmountField } from '@/composables/useAmountField'
import { PaymentMethod, TransactionType } from '@/dto/transaction.dto'
import type { CreateTransactionRequestDto } from '@/dto/transaction.dto'
import { CategoryType } from '@/dto/category.dto'
import type { AccountResponseDto } from '@/dto/account.dto'
import type { CategoryResponseDto } from '@/dto/category.dto'

const toast = useToast()
const router = useRouter()

const accounts = ref<AccountResponseDto[]>([])
const categories = ref<CategoryResponseDto[]>([])
const isLoadingOptions = ref(false)
const isSubmitting = ref(false)
const showSavedDialog = ref(false)
const isAnalyzingReceipt = ref(false)
const receiptInput = ref<HTMLInputElement | null>(null)
const receiptFileName = ref('')

const type = ref<TransactionType>(TransactionType.EXPENSE)
const { value: amount, onInput: onAmountInput } = useAmountField()
const sourceAccountId = ref('')
const destinationAccountId = ref('')
const categoryId = ref('')
const transactionDate = ref('')
const merchantName = ref('')
const description = ref('')
const note = ref('')
const isRecurring = ref(false)

const TRANSACTION_TYPES = [
    { value: TransactionType.INCOME, label: 'Income' },
    { value: TransactionType.EXPENSE, label: 'Expense' },
    { value: TransactionType.TRANSFER, label: 'Transfer' }
]

const PAYMENT_METHODS = [
    { value: PaymentMethod.CASH, label: 'Cash' },
    { value: PaymentMethod.BANK, label: 'Bank' },
    { value: PaymentMethod.E_WALLET, label: 'E-Wallet' },
    { value: PaymentMethod.CREDIT_CARD, label: 'Credit Card' }
]

const needsSource = computed(() =>
    type.value === TransactionType.EXPENSE || type.value === TransactionType.TRANSFER
)

const needsDestination = computed(() =>
    type.value === TransactionType.INCOME || type.value === TransactionType.TRANSFER
)

const expectedCategoryType = computed(() =>
    type.value === TransactionType.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE
)

const availableCategories = computed(() =>
    toCategoryOptions(categories.value).filter(
        (option) => option.type === expectedCategoryType.value
    )
)

const categoryOptions = computed(() => [
    { value: '', label: 'No category' },
    ...availableCategories.value.map((option) => ({
        value: String(option.id),
        label: option.label,
        disabled: option.hasChildren
    }))
])

const accountOptions = computed(() => [
    { value: '', label: 'Select account' },
    ...accounts.value.map((account) => ({
        value: String(account.id),
        label: `${account.name} (${account.currency})`
    }))
])

const sourceAccount = computed(
    () => accounts.value.find((account) => String(account.id) === String(sourceAccountId.value)) ?? null
)

const destinationAccount = computed(
    () =>
        accounts.value.find((account) => String(account.id) === String(destinationAccountId.value)) ??
        null
)

const paymentMethodSourceAccount = computed(() =>
    type.value === TransactionType.INCOME ? destinationAccount.value : sourceAccount.value
)

const paymentMethod = computed<PaymentMethod | ''>(() =>
    toPaymentMethod(paymentMethodSourceAccount.value?.type)
)

const paymentMethodLabel = computed(
    () => PAYMENT_METHODS.find((method) => method.value === paymentMethod.value)?.label ?? ''
)

const isSubmitEnabled = computed(() => {
  if (isSubmitting.value || isLoadingOptions.value) return false
  if (!amount.value.trim()) return false
  if (needsSource.value && !sourceAccountId.value) return false
  if (needsDestination.value && !destinationAccountId.value) return false
  return true
})

const validate = (): string => {
  const parsedAmount = parseAmount(amount.value)
  if (parsedAmount === null) return 'Amount not valid.'
  if (parsedAmount <= 0) return 'Amount must be greater than 0.'
  if (countDecimalPlaces(amount.value) > 2) return 'Amount must be less than 2 decimal places.'
  if (needsSource.value && !sourceAccountId.value) return 'Source account must be filled for expense or transfer.'
  if (needsDestination.value && !destinationAccountId.value) {
    return 'Destination account must be filled for income or transfer.'
  }
  if (
    needsSource.value &&
    needsDestination.value &&
    sourceAccountId.value === destinationAccountId.value
  ) {
    return 'Source and destination account cannot be the same.'
  }
  return ''
}

const loadOptions = async () => {
  isLoadingOptions.value = true
  try {
    const [accountResult, categoryResult] = await Promise.all([
      accountService.list(),
      categoryService.list()
    ])
    accounts.value = accountResult?.data ?? []
    categories.value = categoryResult.data ?? []
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Failed to load data master.'))
  } finally {
    isLoadingOptions.value = false
  }
}

const openReceiptPicker = () => receiptInput.value?.click()

const applyMatchedAccount = (accountId: number | null, currency: string | null) => {
  if (accountId === null) return
  const account = accounts.value.find((item) => item.id === accountId)
  if (!account) return
  if (currency && account.currency !== currency) {
    toast.info('The receipt currency differs from the matched account. Please select an account manually.')
    return
  }
  sourceAccountId.value = String(account.id)
}

const applyMatchedCategory = (categoryIdFromOcr: number | null) => {
  if (categoryIdFromOcr === null) return
  const category = toCategoryOptions(categories.value).find(
    (option) =>
      option.id === categoryIdFromOcr &&
      option.type === CategoryType.EXPENSE &&
      !option.hasChildren
  )
  if (category) categoryId.value = String(category.id)
}

const applyTransactionDate = (value: string | null) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return
  const dateParts = value.split('-').map(Number)
  const year = dateParts[0]
  const month = dateParts[1]
  const day = dateParts[2]
  if (year === undefined || month === undefined || day === undefined) return

  const parsedDate = new Date(year, month - 1, day)
  if (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  ) {
    transactionDate.value = `${value}T12:00`
  }
}

const applyReceiptAnalysis = (analysis: NonNullable<Awaited<ReturnType<typeof ocrService.analyzeReceipt>>['data']>) => {
  type.value = TransactionType.EXPENSE
  destinationAccountId.value = ''
  if (analysis.amount !== null && Number.isFinite(analysis.amount)) amount.value = String(analysis.amount)
  if (analysis.merchantName) merchantName.value = analysis.merchantName
  applyMatchedAccount(analysis.accountId, analysis.currency)
  applyMatchedCategory(analysis.categoryId)
  applyTransactionDate(analysis.transactionDate)
}

const handleReceiptSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const selectedFile = input.files?.[0]
  input.value = ''
  if (!selectedFile) return

  isAnalyzingReceipt.value = true
  try {
    const preparedImage = await prepareOcrImage(selectedFile)
    receiptFileName.value = preparedImage.name
    const result = await ocrService.analyzeReceipt(preparedImage, navigator.language || 'und')
    if (!result.success || !result.data) {
      toast.error(result.message || 'The receipt could not be analyzed.')
      return
    }

    applyReceiptAnalysis(result.data)
    toast.success('Receipt analyzed. Review the transaction fields before saving.')
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Failed to analyze the receipt.'))
  } finally {
    isAnalyzingReceipt.value = false
  }
}

const resetForm = () => {
  amount.value = ''
  sourceAccountId.value = ''
  destinationAccountId.value = ''
  categoryId.value = ''
  transactionDate.value = ''
  merchantName.value = ''
  description.value = ''
  note.value = ''
  isRecurring.value = false
}

const handleSubmit = async () => {
  if (!isSubmitEnabled.value) return

  const validationError = validate()
  if (validationError) {
    toast.error(validationError)
    return
  }

  const payload: CreateTransactionRequestDto = {
    type: type.value,
    amount: parseAmount(amount.value) as number,
    isRecurring: isRecurring.value
  }

  if (needsSource.value) {
    payload.sourceAccountId = Number(sourceAccountId.value)
  }
  if (needsDestination.value) {
    payload.destinationAccountId = Number(destinationAccountId.value)
  }
  if (categoryId.value) {
    payload.categoryId = Number(categoryId.value)
  }
  if (paymentMethod.value) {
    payload.paymentMethod = paymentMethod.value
  }
  if (transactionDate.value) {
    payload.transactionDate = new Date(transactionDate.value).toISOString()
  }
  if (merchantName.value.trim()) {
    payload.merchantName = merchantName.value.trim()
  }
  if (description.value.trim()) {
    payload.description = description.value.trim()
  }
  if (note.value.trim()) {
    payload.note = note.value.trim()
  }

  isSubmitting.value = true
  try {
    await transactionService.create(payload)
    toast.success('Transaction saved successfully.')
    showSavedDialog.value = true
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Failed to save the transaction.'))
  } finally {
    isSubmitting.value = false
  }
}

const addAnotherTransaction = () => {
  showSavedDialog.value = false
  resetForm()
}

const goToTransactionList = () => {
  showSavedDialog.value = false
  void router.push({ name: 'transactions' })
}

onMounted(loadOptions)
</script>

<template>
  <div class="max-w-2xl space-y-6">
    
    <!-- Header -->
    <div class="space-y-1">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">New Transaction</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">Record income, expense, or a transfer between accounts.</p>
    </div>

    <section class="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
      <div>
        <h2 class="text-sm font-semibold text-slate-900 dark:text-white">Scan a receipt</h2>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Large images are resized on this device, then analyzed to prefill an expense draft.</p>
        <p v-if="receiptFileName" class="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{{ receiptFileName }}</p>
      </div>
      <input
        ref="receiptInput"
        id="receipt-image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="sr-only"
        @change="handleReceiptSelected"
      />
      <label for="receipt-image" class="sr-only">Receipt image</label>
      <button
        type="button"
        :disabled="isAnalyzingReceipt || isLoadingOptions"
        @click="openReceiptPicker"
        class="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        {{ isAnalyzingReceipt ? 'Analyzing...' : 'Choose receipt image' }}
      </button>
    </section>

    <div v-if="isLoadingOptions" class="text-sm text-slate-500 dark:text-slate-400">Loading accounts and categories...</div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-5">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="transaction-type" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Transaction Type</label>
          <SelectField id="transaction-type" v-model="type" :options="TRANSACTION_TYPES" />
        </div>

        <div>
          <label for="transaction-amount" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Amount</label>
          <input
            id="transaction-amount"
            :value="amount"
            @input="onAmountInput"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="0,00"
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-if="needsSource">
          <label for="source-account" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Source Account</label>
          <SelectField
            id="source-account"
            v-model="sourceAccountId"
            :options="accountOptions"
            placeholder="Select account"
          />
        </div>

        <div v-if="needsDestination">
          <label for="destination-account" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Destination Account</label>
          <SelectField
            id="destination-account"
            v-model="destinationAccountId"
            :options="accountOptions"
            placeholder="Select account"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="transaction-category" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Category</label>
          <SelectField id="transaction-category" v-model="categoryId" :options="categoryOptions" />
        </div>

        <div>
          <label for="payment-method" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Payment Method</label>
          <input
            id="payment-method"
            :value="paymentMethodLabel"
            type="text"
            disabled
            class="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
          />
          <p class="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Follows the type of
            <span v-if="paymentMethodSourceAccount">
              {{ type === TransactionType.INCOME ? 'destination' : 'source' }}
              ({{ paymentMethodSourceAccount.name }})
            </span>
            <span v-else>transaction account</span>.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="transaction-date" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Transaction Date</label>
          <input
            id="transaction-date"
            v-model="transactionDate"
            type="datetime-local"
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label for="merchant-name" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Merchant</label>
          <input
            id="merchant-name"
            v-model="merchantName"
            type="text"
            maxlength="100"
            placeholder="Merchant name"
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label for="transaction-description" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Description</label>
        <textarea
          id="transaction-description"
          v-model="description"
          rows="2"
          placeholder="Short transaction note"
          class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-y"
        ></textarea>
      </div>

      <div>
        <label for="transaction-note" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Note</label>
        <input
          id="transaction-note"
          v-model="note"
          type="text"
          placeholder="Internal note"
          class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
        />
      </div>

      <div class="space-y-1">
        <label class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 cursor-not-allowed">
          <input
            v-model="isRecurring"
            type="checkbox"
            disabled
            class="w-4 h-4 rounded border-slate-300 bg-slate-100 text-indigo-600 opacity-60 cursor-not-allowed dark:border-slate-600 dark:bg-slate-800"
          />
          Recurring transaction
        </label>
        <p class="text-xs text-slate-500 dark:text-slate-500">Recurring transaction feature is not available yet.</p>
      </div>

      <button
        type="submit"
        :disabled="!isSubmitEnabled"
        class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-700"
      >
        {{ isSubmitting ? 'Saving...' : 'Save Transaction' }}
      </button>
    </form>

    <!-- Saved dialog -->
    <div
      v-if="showSavedDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      @click.self="addAnotherTransaction"
    >
      <div class="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Transaction saved</h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Do you want to add another transaction?</p>
        <div class="mt-5 space-y-2">
          <button
            type="button"
            @click="addAnotherTransaction"
            class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Add another transaction
          </button>
          <button
            type="button"
            @click="goToTransactionList"
            class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            View transactions
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
