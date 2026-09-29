<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import SelectField from '@/components/SelectField.vue'
import { accountService } from '@/services/account.service'
import { categoryService } from '@/services/category.service'
import { transactionService } from '@/services/transaction.service'
import { useToast } from '@/composables/useToast'
import { getApiErrorMessage } from '@/utils/api-error'
import { toCategoryOptions } from '@/utils/category'
import { formatCurrency } from '@/utils/format'
import { useResizableColumns } from '@/composables/useResizableColumns'
import { useScrollIdle } from '@/composables/useScrollIdle'
import { PaymentMethod, SortOrder, TransactionType } from '@/dto/transaction.dto'
import type { TransactionResponseDto } from '@/dto/transaction.dto'
import type { AccountResponseDto } from '@/dto/account.dto'
import type { CategoryResponseDto } from '@/dto/category.dto'
import type { PaginatedResponse } from '@/dto/paginated.dto'

const WIDTH_STORAGE_KEY = 'fintrack.transaction_columns'

const toast = useToast()

const accounts = ref<AccountResponseDto[]>([])
const categories = ref<CategoryResponseDto[]>([])
const transactions = ref<TransactionResponseDto[]>([])
const isLoading = ref(false)

const page = ref(1)
const limit = ref('10')
const totalItems = ref(0)
const pageCount = ref(0)

const typeFilter = ref('')
const categoryFilter = ref('')
const paymentMethodFilter = ref('')
const isFilterOpen = ref(false)
const sortBy = ref('transactionDate')
const sortOrder = ref<SortOrder>(SortOrder.DESC)

const activeFilterCount = computed(
  () =>
    [typeFilter.value, categoryFilter.value, paymentMethodFilter.value].filter(
      (value) => value !== ''
    ).length
)

const clearFilters = () => {
  typeFilter.value = ''
  categoryFilter.value = ''
  paymentMethodFilter.value = ''
}

const TYPE_FILTER_OPTIONS = [
    { value: '', label: 'All types' },
    { value: TransactionType.INCOME, label: 'Income' },
    { value: TransactionType.EXPENSE, label: 'Expense' },
    { value: TransactionType.TRANSFER, label: 'Transfer' },
    { value: TransactionType.ADJUSTMENT, label: 'Adjustment' }
]

const PAYMENT_METHOD_FILTER_OPTIONS = [
    { value: '', label: 'All methods' },
    { value: PaymentMethod.CASH, label: 'Cash' },
    { value: PaymentMethod.BANK, label: 'Bank' },
    { value: PaymentMethod.E_WALLET, label: 'E-Wallet' },
    { value: PaymentMethod.CREDIT_CARD, label: 'Credit Card' }
]

const LIMIT_OPTIONS = [10, 25, 50].map((size) => ({ value: String(size), label: `${size} / page` }))

const columns = ref([
    { key: 'transactionDate', label: 'Date', width: 150, sortable: true },
    { key: 'type', label: 'Type', width: 110, sortable: true },
    { key: 'amount', label: 'Amount', width: 150, sortable: true, align: 'right' },
    { key: 'paymentMethod', label: 'Payment', width: 120, sortable: false },
    { key: 'category', label: 'Category', width: 160, sortable: false },
    { key: 'merchantName', label: 'Merchant', width: 160, sortable: true },
    { key: 'source', label: 'Source', width: 160, sortable: false },
    { key: 'destination', label: 'Destination', width: 160, sortable: false },
    { key: 'description', label: 'Description', width: 200, sortable: false },
    { key: 'note', label: 'Note', width: 160, sortable: false }
])

const { startResize, reset } = useResizableColumns(columns, WIDTH_STORAGE_KEY)
const { isScrolling: isTableScrolling, onScroll: onTableScroll } = useScrollIdle()

const tableWidth = computed(() =>
    columns.value.reduce((total, column) => total + column.width, 0)
)

const categoryOptions = computed(() => [
    { value: '', label: 'All categories' },
    ...toCategoryOptions(categories.value).map((option) => ({
        value: String(option.id),
        label: option.label
    }))
])

const categoryNameMap = computed(() => {
    const map = new Map<number, string>()
    toCategoryOptions(categories.value).forEach((option) => map.set(option.id, option.name))
    return map
})

const accountNameMap = computed(() => {
    const map = new Map<number, AccountResponseDto>()
    accounts.value.forEach((account) => map.set(account.id, account))
    return map
})

function accountLabel(id: number | null): string {
    if (id === null) return '-'
    const account = accountNameMap.value.get(id)
    return account ? `${account.name} (${account.currency})` : `#${id}`
}

function categoryLabel(id: number | null): string {
    if (id === null) return '-'
    return categoryNameMap.value.get(id) ?? `#${id}`
}

function accountCurrency(transaction: TransactionResponseDto): string {
    const account =
        accountNameMap.value.get(transaction.sourceAccountId ?? -1) ??
        accountNameMap.value.get(transaction.destinationAccountId ?? -1)
    return account?.currency ?? 'IDR'
}

function formatDate(value: string): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

function typeLabel(type: TransactionType): string {
    return (
        {
            [TransactionType.INCOME]: 'Income',
            [TransactionType.EXPENSE]: 'Expense',
            [TransactionType.TRANSFER]: 'Transfer',
            [TransactionType.ADJUSTMENT]: 'Adjustment'
        }[type] ?? type
    )
}

function typeClass(type: TransactionType): string {
    if (type === TransactionType.INCOME) return 'text-emerald-400'
    if (type === TransactionType.EXPENSE) return 'text-rose-400'
    if (type === TransactionType.ADJUSTMENT) return 'text-indigo-400'
    return 'text-slate-300'
}

function amountText(transaction: TransactionResponseDto): string {
    const formatted = formatCurrency(transaction.amount, accountCurrency(transaction))
    if (transaction.type === TransactionType.EXPENSE) return `-${formatted}`
    if (transaction.type === TransactionType.INCOME) return `+${formatted}`
    return formatted
}

const amountClass = (transaction: TransactionResponseDto): string => {
    if (transaction.type === TransactionType.INCOME) return 'text-emerald-400'
    if (transaction.type === TransactionType.EXPENSE) return 'text-rose-400'
    return 'text-slate-200'
}

function toggleSort(key: string): void {
    if (sortBy.value === key) {
        sortOrder.value = sortOrder.value === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC
    } else {
        sortBy.value = key
        sortOrder.value = SortOrder.DESC
    }
}

function sortIndicator(key: string): string {
    if (sortBy.value !== key) return ''
    return sortOrder.value === SortOrder.ASC ? '▲' : '▼'
}

const loadOptions = async () => {
    try {
        const [accountResult, categoryResult] = await Promise.all([
            accountService.list(),
            categoryService.list()
        ])
        accounts.value = accountResult?.data ?? []
        categories.value = categoryResult?.data ?? []
    } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load reference data.'))
    } finally {
    }
}

const loadTransactions = async () => {
    isLoading.value = true
    try {
        const result = await transactionService.list({
            page: page.value,
            limit: Number(limit.value),
            sortBy: sortBy.value,
            sortOrder: sortOrder.value,
            ...(typeFilter.value ? { type: typeFilter.value as TransactionType } : {}),
            ...(paymentMethodFilter.value
                ? { paymentMethod: paymentMethodFilter.value as PaymentMethod }
                : {}),
            ...(categoryFilter.value ? { categoryId: Number(categoryFilter.value) } : {})
        })

        const payload: PaginatedResponse<TransactionResponseDto> | undefined = result
        transactions.value = payload?.data ?? []
        totalItems.value = payload?.totalItems ?? 0
        pageCount.value = payload?.pageCount ?? 0
    } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load transactions.'))
    } finally {
        isLoading.value = false
    }
}

watch([typeFilter, categoryFilter, paymentMethodFilter, limit], () => {
    page.value = 1
    void loadTransactions()
})

watch(sortBy, () => {
    page.value = 1
    void loadTransactions()
})

watch(sortOrder, () => {
    void loadTransactions()
})

watch(page, () => {
    void loadTransactions()
})

onMounted(async () => {
    await loadOptions()
    await loadTransactions()
})
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold text-white">Transactions</h1>
      <p class="text-sm text-slate-400">Browse every recorded transaction. Drag a column edge to resize.</p>
    </div>

    <div class="flex flex-wrap items-end gap-3">
      <button
        type="button"
        @click="isFilterOpen = !isFilterOpen"
        class="relative order-1 rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-slate-700 md:hidden"
        :class="isFilterOpen ? 'border-indigo-500 text-white' : ''"
        :aria-expanded="isFilterOpen"
        aria-label="Toggle filters"
      >
        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v1.09a1.5 1.5 0 0 1-.44 1.06l-4.5 4.5v3.19a1 1 0 0 1-.53.88l-2.2 1.1a1 1 0 0 1-1.4-1V12.15l-4.5-4.5A1.5 1.5 0 0 1 3 6.59V5.5Z" />
        </svg>
        <span
          v-if="activeFilterCount > 0"
          class="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-semibold text-white"
        >
          {{ activeFilterCount }}
        </span>
      </button>

      <div class="order-2 w-full md:w-48" :class="isFilterOpen ? 'block' : 'hidden md:block'">
        <label class="block text-xs font-medium text-slate-300 mb-1">Type</label>
        <SelectField v-model="typeFilter" :options="TYPE_FILTER_OPTIONS" />
      </div>
      <div class="order-3 w-full md:w-48" :class="isFilterOpen ? 'block' : 'hidden md:block'">
        <label class="block text-xs font-medium text-slate-300 mb-1">Category</label>
        <SelectField v-model="categoryFilter" :options="categoryOptions" />
      </div>
      <div class="order-4 w-full md:w-48" :class="isFilterOpen ? 'block' : 'hidden md:block'">
        <label class="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
        <SelectField v-model="paymentMethodFilter" :options="PAYMENT_METHOD_FILTER_OPTIONS" />
      </div>
      <div class="order-5 w-full md:w-32" :class="isFilterOpen ? 'block' : 'hidden md:block'">
        <label class="block text-xs font-medium text-slate-300 mb-1">Rows</label>
        <SelectField v-model="limit" :options="LIMIT_OPTIONS" />
      </div>
      <button
        v-if="activeFilterCount > 0"
        type="button"
        @click="clearFilters"
        class="order-7 self-start px-1 py-2 text-xs text-indigo-400 transition-colors hover:text-indigo-300 md:self-auto"
      >
        Clear filters
      </button>

      <div class="order-6 ml-auto flex items-center gap-2">
        <button
          type="button"
          @click="reset"
          class="hidden rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 sm:block"
        >
          Reset widths
        </button>

        <RouterLink
          :to="{ name: 'transaction-new' }"
          class="rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          New Transaction
        </RouterLink>
      </div>
    </div>

    <div class="rounded-xl border border-slate-800 bg-slate-900">
      <div
        class="thin-scrollbar overflow-x-auto overscroll-x-contain"
        :class="isTableScrolling ? 'is-scrolling' : ''"
        @scroll.passive="onTableScroll"
      >
        <table class="table-fixed text-sm" :style="{ width: `${tableWidth}px` }">
          <colgroup>
            <col v-for="column in columns" :key="column.key" :style="{ width: `${column.width}px` }" />
          </colgroup>
          <thead class="bg-slate-900 text-slate-300">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                scope="col"
                class="relative border-b border-slate-800 px-3 py-2.5 font-medium select-none"
                :class="[
                  column.sortable ? 'cursor-pointer hover:text-white' : '',
                  column.align === 'right' ? 'text-right' : 'text-left'
                ]"
                @click="column.sortable && toggleSort(column.key)"
              >
                <span class="inline-flex items-center gap-1" :class="column.align === 'right' ? 'flex-row-reverse' : ''">
                  {{ column.label }}
                  <span v-if="sortIndicator(column.key)" class="text-[10px] text-indigo-400">
                    {{ sortIndicator(column.key) }}
                  </span>
                </span>
                <span
                  class="absolute top-0 right-0 h-full w-2 cursor-col-resize touch-none hover:bg-indigo-500/60"
                  role="separator"
                  aria-orientation="vertical"
                  @click.stop
                  @pointerdown="startResize($event, column.key)"
                ></span>
              </th>
            </tr>
          </thead>
          <tbody v-if="transactions.length" class="divide-y divide-slate-800">
            <tr v-for="transaction in transactions" :key="transaction.id" class="hover:bg-slate-800/50">
              <td class="px-3 py-2 text-slate-300 whitespace-nowrap">
                {{ formatDate(transaction.transactionDate) }}
              </td>
              <td class="px-3 py-2 font-medium" :class="typeClass(transaction.type)">
                {{ typeLabel(transaction.type) }}
              </td>
              <td class="px-3 py-2 text-right font-medium whitespace-nowrap" :class="amountClass(transaction)">
                {{ amountText(transaction) }}
              </td>
              <td class="px-3 py-2 text-slate-400">
                {{ transaction.paymentMethod }}
              </td>
              <td class="px-3 py-2 text-slate-400 truncate">{{ categoryLabel(transaction.categoryId) }}</td>
              <td class="px-3 py-2 text-slate-300 truncate">{{ transaction.merchantName || '-' }}</td>
              <td class="px-3 py-2 text-slate-400 truncate">{{ accountLabel(transaction.sourceAccountId) }}</td>
              <td class="px-3 py-2 text-slate-400 truncate">{{ accountLabel(transaction.destinationAccountId) }}</td>
              <td class="px-3 py-2 text-slate-400 truncate">{{ transaction.description || '-' }}</td>
              <td class="px-3 py-2 text-slate-500 truncate">{{ transaction.note || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="isLoading" class="px-4 py-6 text-center text-sm text-slate-400">Loading transactions...</div>
      <div v-else-if="!transactions.length" class="px-4 py-6 text-center text-sm text-slate-400">
        No transactions found.
      </div>

      <div
        v-if="pageCount > 0"
        class="flex flex-col gap-2 border-t border-slate-800 px-4 py-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"
      >
        <span>Showing {{ transactions.length }} of {{ totalItems }} transactions</span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="page <= 1 || isLoading"
            @click="page = Math.max(1, page - 1)"
            class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {{ page }} of {{ pageCount }}</span>
          <button
            type="button"
            :disabled="page >= pageCount || isLoading"
            @click="page = Math.min(pageCount, page + 1)"
            class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
