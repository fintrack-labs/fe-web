<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { accountService } from '@/services/account.service'
import type { AccountListParams, AccountSortOrder } from '@/services/account.service'
import { AccountType, CurrencyType } from '@/dto/account.dto'
import type { AccountResponseDto } from '@/dto/account.dto'
import SelectField from '@/components/SelectField.vue'
import { useToast } from '@/composables/useToast'
import { useScrollIdle } from '@/composables/useScrollIdle'
import { useResizableColumns } from '@/composables/useResizableColumns'
import { getApiErrorMessage } from '@/utils/api-error'
import { formatCurrency } from '@/utils/format'
import { toAccountTypeBadgeClass, toAccountTypeLabel } from '@/utils/account-type'

type SortKey = 'name' | 'type' | 'balance'

const WIDTH_STORAGE_KEY = 'fintrack.account_columns'

const toast = useToast()
const router = useRouter()
const { isScrolling, onScroll } = useScrollIdle()

const accounts = ref<AccountResponseDto[]>([])
const isLoading = ref(false)
const search = ref('')
const debouncedSearch = ref('')
const isFilterOpen = ref(false)
const typeFilter = ref('')
const currencyFilter = ref('')
const sortKey = ref<SortKey>('balance')
const sortOrder = ref<AccountSortOrder>('DESC')

const columns = ref([
    { key: 'name', label: 'Account', width: 240, sortable: true, align: 'left' },
    { key: 'type', label: 'Type', width: 140, sortable: true, align: 'left' },
    { key: 'balance', label: 'Balance', width: 170, sortable: true, align: 'right' },
    { key: 'action', label: 'Action', width: 110, sortable: false, align: 'right' }
])

const { startResize, reset } = useResizableColumns(columns, WIDTH_STORAGE_KEY)

const tableWidth = computed(() =>
    columns.value.reduce((total, column) => total + column.width, 0)
)

const TYPE_OPTIONS = [
    { value: '', label: 'All types' },
    ...Object.values(AccountType).map((value) => ({ value, label: toAccountTypeLabel(value) }))
]

const CURRENCY_OPTIONS = [
    { value: '', label: 'All currencies' },
    ...Object.values(CurrencyType).map((value) => ({ value, label: value }))
]

const SUMMARY_OPTIONS = computed(() => {
    const totals = new Map<string, number>()
    for (const account of accounts.value) {
        totals.set(account.currency, (totals.get(account.currency) ?? 0) + (account.balance ?? 0))
    }
    return [...totals.entries()].map(([currency, total]) => ({ currency, total }))
})

const balanceClass = (balance: number) =>
    balance < 0 ? 'text-rose-400' : balance > 0 ? 'text-emerald-400' : 'text-slate-400'

const sortIndicator = (key: string) =>
    sortKey.value === key ? (sortOrder.value === 'ASC' ? '↑' : '↓') : ''

const activeFilterCount = computed(() =>
    [search.value, typeFilter.value, currencyFilter.value].filter((value) => value !== '').length
)

const isActiveFilter = computed(() => activeFilterCount.value > 0)

const loadAccounts = async () => {
    isLoading.value = true
    try {
        const params: AccountListParams = {
            sortBy: sortKey.value,
            sortOrder: sortOrder.value
        }
        if (debouncedSearch.value.trim()) params.search = debouncedSearch.value.trim()
        if (typeFilter.value) params.type = typeFilter.value as AccountType
        if (currencyFilter.value) params.currency = currencyFilter.value as CurrencyType

        const response = await accountService.list(params)
        accounts.value = response?.data ?? []
    } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load accounts.'))
    } finally {
        isLoading.value = false
    }
}

const toggleSort = (key: string) => {
    if (sortKey.value === key) {
        sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
    } else {
        sortKey.value = key as SortKey
        sortOrder.value = key === 'balance' ? 'DESC' : 'ASC'
    }
    void loadAccounts()
}

const clearFilters = () => {
    search.value = ''
    debouncedSearch.value = ''
    typeFilter.value = ''
    currencyFilter.value = ''
}

const goToAdjustment = (account: AccountResponseDto) => {
    void router.push({
        name: 'transaction-adjustment',
        query: { accountId: String(account.id) }
    })
}

let searchTimer: number | undefined

watch(search, (value) => {
    if (searchTimer !== undefined) window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => {
        debouncedSearch.value = value
    }, 300)
})

watch([debouncedSearch, typeFilter, currencyFilter], () => {
    void loadAccounts()
})

onMounted(loadAccounts)

onBeforeUnmount(() => {
    if (searchTimer !== undefined) window.clearTimeout(searchTimer)
})
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-1">
            <h1 class="text-2xl font-bold text-white">Accounts</h1>
            <p class="text-sm text-slate-400">All your accounts with the latest recorded balance.</p>
        </div>

        <div v-if="SUMMARY_OPTIONS.length > 0" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div
                v-for="summary in SUMMARY_OPTIONS"
                :key="summary.currency"
                class="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
            >
                <p class="text-xs font-medium text-slate-400">
                    Total balance
                    <span class="text-slate-500">· {{ summary.currency }}</span>
                </p>
                <p
                    class="mt-1 text-xl font-semibold tabular-nums"
                    :class="balanceClass(summary.total)"
                >
                    {{ formatCurrency(summary.total, summary.currency) }}
                </p>
            </div>

            <div class="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <p class="text-xs font-medium text-slate-400">Accounts</p>
                <p class="mt-1 text-xl font-semibold tabular-nums text-white">
                    {{ accounts.length }}
                </p>
            </div>
        </div>

        <div class="flex items-center justify-end gap-2">
            <button
                type="button"
                @click="reset"
                class="hidden rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 sm:block"
            >
                Reset widths
            </button>
            <button
                type="button"
                @click="isFilterOpen = !isFilterOpen"
                class="relative rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-slate-700 md:hidden"
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
        </div>

        <div
            class="flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 md:flex-row md:items-end md:border-0 md:bg-transparent md:p-0"
            :class="isFilterOpen ? 'flex' : 'hidden md:flex'"
        >
            <div class="w-full md:w-64">
                <label class="block text-xs font-medium text-slate-300 mb-1">Search</label>
                <input
                    v-model="search"
                    type="search"
                    placeholder="Account name"
                    class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
            </div>
            <div class="w-full md:w-44">
                <label class="block text-xs font-medium text-slate-300 mb-1">Type</label>
                <SelectField v-model="typeFilter" :options="TYPE_OPTIONS" />
            </div>
            <div class="w-full md:w-40">
                <label class="block text-xs font-medium text-slate-300 mb-1">Currency</label>
                <SelectField v-model="currencyFilter" :options="CURRENCY_OPTIONS" />
            </div>
            <button
                v-if="isActiveFilter"
                type="button"
                @click="clearFilters"
                class="self-start px-1 py-2 text-xs text-indigo-400 transition-colors hover:text-indigo-300 md:self-auto"
            >
                Clear filters
            </button>
        </div>

        <div class="rounded-xl border border-slate-800 bg-slate-900">
            <div
                class="thin-scrollbar overflow-x-auto overscroll-x-contain"
                :class="isScrolling ? 'is-scrolling' : ''"
                @scroll.passive="onScroll"
            >
                <table class="table-fixed text-sm" :style="{ width: `${tableWidth}px` }">
                    <colgroup>
                        <col
                            v-for="column in columns"
                            :key="column.key"
                            :style="{ width: `${column.width}px` }"
                        />
                    </colgroup>
                    <thead class="bg-slate-900 text-slate-300">
                        <tr>
                            <th
                                v-for="column in columns"
                                :key="column.key"
                                scope="col"
                                class="relative border-b border-slate-800 px-4 py-2.5 font-medium select-none"
                                :class="[
                                    column.sortable ? 'cursor-pointer hover:text-white' : '',
                                    column.align === 'right' ? 'text-right' : 'text-left'
                                ]"
                                @click="column.sortable && toggleSort(column.key)"
                            >
                                <span
                                    class="inline-flex items-center gap-1"
                                    :class="column.align === 'right' ? 'flex-row-reverse' : ''"
                                >
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
                    <tbody>
                        <tr
                            v-for="account in accounts"
                            :key="account.id"
                            class="border-b border-slate-800/60 last:border-b-0 hover:bg-slate-800/40"
                        >
                            <td class="px-4 py-3">
                                <p class="font-medium text-white">{{ account.name }}</p>
                                <p v-if="account.accountNumber" class="text-xs text-slate-500">
                                    {{ account.accountNumber }}
                                </p>
                            </td>
                            <td class="px-4 py-3">
                                <span
                                    class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
                                    :class="toAccountTypeBadgeClass(account.type)"
                                >
                                    {{ toAccountTypeLabel(account.type) }}
                                </span>
                            </td>
                            <td
                                class="px-4 py-3 text-right font-medium tabular-nums"
                                :class="balanceClass(account.balance)"
                            >
                                {{ formatCurrency(account.balance, account.currency) }}
                            </td>
                            <td class="px-4 py-3 text-right">
                                <button
                                    type="button"
                                    @click="goToAdjustment(account)"
                                    class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-white"
                                >
                                    Adjust
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p v-if="isLoading" class="px-4 py-6 text-center text-sm text-slate-400">
                Loading accounts...
            </p>
            <p v-else-if="accounts.length === 0" class="px-4 py-6 text-center text-sm text-slate-400">
                No account found.
            </p>
        </div>
    </div>
</template>
