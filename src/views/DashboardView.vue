<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { TransactionType } from '@/dto/transaction.dto'
import {
    currentMonthKey,
    formatMonthLabel,
    shiftMonth,
    TRANSACTION_TYPES
} from '@/utils/dashboard'
import type { DashboardMonthResponseDto } from '@/dto/dashboard.dto'
import { dashboardService } from '@/services/dashboard.service'
import { getApiErrorMessage } from '@/utils/api-error'
import { formatCurrency } from '@/utils/format'

interface TypeMeta {
    label: string
    barClass: string
    textClass: string
    dotClass: string
}

const TYPE_META: Record<TransactionType, TypeMeta> = {
    [TransactionType.INCOME]: {
        label: 'Income',
        barClass: 'bg-emerald-500',
        textClass: 'text-emerald-600 dark:text-emerald-400',
        dotClass: 'bg-emerald-500 dark:bg-emerald-400'
    },
    [TransactionType.EXPENSE]: {
        label: 'Expense',
        barClass: 'bg-rose-500',
        textClass: 'text-rose-600 dark:text-rose-400',
        dotClass: 'bg-rose-500 dark:bg-rose-400'
    },
    [TransactionType.TRANSFER]: {
        label: 'Transfer',
        barClass: 'bg-sky-500',
        textClass: 'text-sky-600 dark:text-sky-400',
        dotClass: 'bg-sky-500 dark:bg-sky-400'
    },
    [TransactionType.ADJUSTMENT]: {
        label: 'Adjustment',
        barClass: 'bg-indigo-500',
        textClass: 'text-indigo-600 dark:text-indigo-400',
        dotClass: 'bg-indigo-500 dark:bg-indigo-400'
    }
}

const MIN_MONTHS_BACK = 5

const today = new Date()
const cursorKey = ref(currentMonthKey())
const currentKey = currentMonthKey()
const dashboardData = ref<DashboardMonthResponseDto | null>(null)
const isLoading = ref(false)
const loadError = ref('')
let dashboardRequestId = 0

function emptyDashboard(key: string): DashboardMonthResponseDto {
    const year = Number(key.slice(0, 4))
    const monthIndex = Number(key.slice(5, 7)) - 1
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const totals = Object.fromEntries(TRANSACTION_TYPES.map((type) => [type, 0])) as Record<TransactionType, number>

    return {
        key,
        year,
        monthIndex,
        daysInMonth,
        totals,
        previousTotals: { ...totals },
        daily: Object.fromEntries(
            TRANSACTION_TYPES.map((type) => [type, Array.from({ length: daysInMonth }, () => 0)])
        ) as Record<TransactionType, number[]>
    }
}

const loadDashboard = async () => {
    const requestId = ++dashboardRequestId
    const monthKey = cursorKey.value
    isLoading.value = true
    loadError.value = ''

    try {
        const response = await dashboardService.getMonth(monthKey)
        if (requestId === dashboardRequestId) dashboardData.value = response
    } catch (error) {
        if (requestId === dashboardRequestId) {
            dashboardData.value = emptyDashboard(monthKey)
            loadError.value = getApiErrorMessage(error, 'Unable to load dashboard data.')
        }
    } finally {
        if (requestId === dashboardRequestId) isLoading.value = false
    }
}

watch(cursorKey, (key) => {
    dashboardData.value = emptyDashboard(key)
    void loadDashboard()
}, { immediate: true })

const selectedLabel = computed(() => formatMonthLabel(cursorKey.value))
const month = computed(() => dashboardData.value ?? emptyDashboard(cursorKey.value))
const activeDays = computed(() => {
    return cursorKey.value === currentKey
        ? Math.min(today.getDate(), month.value.daysInMonth)
        : month.value.daysInMonth
})

const previous = computed(() => ({ totals: month.value.previousTotals }))

const isCurrentMonth = computed(() => cursorKey.value === currentKey)
const canGoNext = computed(() => cursorKey.value < currentKey)

const prevKey = computed(() => shiftMonth(cursorKey.value, -1))
const prevLabel = computed(() => formatMonthLabel(prevKey.value))

const nextKeyIsBeforeMin = (key: string): boolean => {
    const minKey = shiftMonth(currentKey, -MIN_MONTHS_BACK)
    return key < minKey
}

const isBeforeMin = computed(() => nextKeyIsBeforeMin(shiftMonth(cursorKey.value, -1)))

const movePrevious = () => {
    if (isBeforeMin.value) return
    cursorKey.value = shiftMonth(cursorKey.value, -1)
}

const moveNext = () => {
    if (!canGoNext.value) return
    cursorKey.value = shiftMonth(cursorKey.value, 1)
}

// ---------------------------------------------------------------------------
// KPI
// ---------------------------------------------------------------------------

const incomeTotal = computed(() => month.value.totals[TransactionType.INCOME] ?? 0)
const expenseTotal = computed(() => month.value.totals[TransactionType.EXPENSE] ?? 0)
const transferTotal = computed(() => month.value.totals[TransactionType.TRANSFER] ?? 0)
const netTotal = computed(() => incomeTotal.value - expenseTotal.value)

const prevIncome = computed(() => previous.value.totals[TransactionType.INCOME] ?? 0)
const prevExpense = computed(() => previous.value.totals[TransactionType.EXPENSE] ?? 0)
const prevTransfer = computed(() => previous.value.totals[TransactionType.TRANSFER] ?? 0)
const prevNet = computed(() => prevIncome.value - prevExpense.value)

function deltaPercent(current: number, baseline: number): number | null {
    if (!baseline) return null
    return ((current - baseline) / baseline) * 100
}

const kpis = computed(() => [
    {
        key: 'income',
        label: 'Income',
        value: incomeTotal.value,
        delta: deltaPercent(incomeTotal.value, prevIncome.value),
        accent: 'text-emerald-400',
        icon: '↑',
        good: true
    },
    {
        key: 'expense',
        label: 'Expense',
        value: expenseTotal.value,
        delta: deltaPercent(expenseTotal.value, prevExpense.value),
        accent: 'text-rose-400',
        icon: '↓',
        good: false
    },
    {
        key: 'net',
        label: 'Net this month',
        value: netTotal.value,
        delta: deltaPercent(netTotal.value, prevNet.value),
        accent: netTotal.value >= 0 ? 'text-emerald-400' : 'text-rose-400',
        icon: '◇',
        good: true
    },
    {
        key: 'transfer',
        label: 'Transfers',
        value: transferTotal.value,
        delta: deltaPercent(transferTotal.value, prevTransfer.value),
        accent: 'text-sky-400',
        icon: '⇄',
        good: null
    }
])

function deltaText(delta: number | null): string {
    if (delta === null) return '—'
    return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
}

function deltaBadgeClass(delta: number | null, good: boolean | null): string {
    if (delta === null) return 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
    const up = delta > 0
    const isGood = good === null ? undefined : up === good
    if (isGood === undefined) return 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
    return isGood ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
}

const deltaArrow = (delta: number | null): string => {
    if (delta === null) return '→'
    return delta >= 0 ? '↑' : '↓'
}

// ---------------------------------------------------------------------------
// Daily chart
// ---------------------------------------------------------------------------

const visibleTypes = ref<TransactionType[]>([...TRANSACTION_TYPES])

const toggleType = (type: TransactionType) => {
    if (visibleTypes.value.includes(type)) {
        if (visibleTypes.value.length === 1) return
        visibleTypes.value = visibleTypes.value.filter((item) => item !== type)
    } else {
        visibleTypes.value = [...visibleTypes.value, type]
    }
}

const maxDailyTotal = computed(() => {
    let max = 0
    for (let day = 0; day < month.value.daysInMonth; day += 1) {
        const total = visibleTypes.value.reduce(
            (sum, type) => sum + (month.value.daily[type][day] ?? 0),
            0
        )
        if (total > max) max = total
    }
    return max || 1
})

const dayColumns = computed(() =>
    Array.from({ length: activeDays.value }, (_, dayIndex) => ({
        dayNumber: dayIndex + 1,
        label: dayIndex + 1,
        segments: visibleTypes.value
            .filter((type) => (month.value.daily[type][dayIndex] ?? 0) > 0)
            .map((type) => ({
                type,
                amount: month.value.daily[type][dayIndex] ?? 0,
                height: ((month.value.daily[type][dayIndex] ?? 0) / maxDailyTotal.value) * 100
            }))
    }))
)

// ---------------------------------------------------------------------------
// Type comparison
// ---------------------------------------------------------------------------

const typeComparisons = computed(() =>
    TRANSACTION_TYPES.map((type) => {
        const current = month.value.totals[type] ?? 0
        const lastMonth = previous.value.totals[type] ?? 0
        const max = Math.max(current, lastMonth, 1)
        return {
            type,
            current,
            lastMonth,
            currentPct: (current / max) * 100,
            lastPct: (lastMonth / max) * 100,
            delta: deltaPercent(current, lastMonth)
        }
    })
)

const isEmpty = computed(() =>
    TRANSACTION_TYPES.every((type) => (month.value.totals[type] ?? 0) === 0)
)

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatCompact(value: number): string {
    const abs = Math.abs(value)
    if (abs >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}B`
    }
    if (abs >= 1_000_000) {
        return `${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}M`
    }
    if (abs >= 1_000) {
        return `${(value / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}K`
    }
    return value.toLocaleString('id-ID')
}

const dayTickLabel = (dayIndex: number): string =>
    (dayIndex + 1) % 5 === 0 || dayIndex === activeDays.value - 1
        ? String(dayIndex + 1)
        : ''
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    Daily activity and month-over-month comparison for {{ selectedLabel }}.
                </p>
                <div v-if="loadError" role="alert" class="flex items-center gap-3 text-xs text-rose-600 dark:text-rose-400">
                    <span>{{ loadError }}</span>
                    <button type="button" class="font-semibold underline" @click="loadDashboard">Retry</button>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <button
                    type="button"
                    :disabled="isBeforeMin"
                    @click="movePrevious"
                    class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    aria-label="Previous month"
                >
                    ‹
                </button>
                <span class="min-w-36 text-center text-sm font-medium text-slate-900 dark:text-white">
                    {{ selectedLabel }}
                </span>
                <button
                    type="button"
                    :disabled="!canGoNext"
                    @click="moveNext"
                    class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    aria-label="Next month"
                >
                    ›
                </button>
            </div>
        </div>

        <!-- KPI cards -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div
                v-for="kpi in kpis"
                :key="kpi.key"
                class="rounded-xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900"
            >
                <div class="flex items-center justify-between gap-2">
                    <p class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ kpi.label }}</p>
                    <span
                        class="rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
                        :class="deltaBadgeClass(kpi.delta, kpi.good)"
                    >
                        {{ deltaArrow(kpi.delta) }} {{ deltaText(kpi.delta) }}
                    </span>
                </div>
                <p
                    class="mt-2 truncate text-2xl font-semibold tabular-nums text-slate-900 dark:text-white"
                    :title="formatCurrency(kpi.value, 'IDR')"
                >
                    {{ formatCurrency(kpi.value, 'IDR') }}
                </p>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-500">versus {{ prevLabel }}</p>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <!-- Daily trend -->
            <div class="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-3 dark:border-slate-800 dark:bg-slate-900">
                <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 class="text-sm font-semibold text-slate-900 dark:text-white">Daily trends</h2>
                        <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
                            Stacked daily totals by type · {{ selectedLabel }}
                        </p>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                        <button
                            v-for="type in TRANSACTION_TYPES"
                            :key="type"
                            type="button"
                            @click="toggleType(type)"
                            class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
                            :class="[
                                visibleTypes.includes(type)
                                    ? 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                    : 'border-slate-200 bg-transparent text-slate-500 dark:border-slate-800 dark:text-slate-600',
                                TYPE_META[type].textClass
                            ]"
                        >
                            <span class="h-2 w-2 rounded-full" :class="TYPE_META[type].dotClass"></span>
                            {{ TYPE_META[type].label }}
                        </button>
                    </div>
                </div>

                <div v-if="isLoading" class="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    Loading dashboard data...
                </div>
                <div v-else-if="loadError" class="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    Dashboard data is unavailable.
                </div>
                <div v-else-if="isEmpty" class="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    No transactions recorded for {{ selectedLabel }}.
                </div>

                <div v-else class="mt-6">
                    <div class="flex h-56 items-stretch gap-px">
                        <div
                            v-for="column in dayColumns"
                            :key="column.dayNumber"
                            class="group relative flex h-full flex-1 flex-col-reverse items-stretch justify-end"
                        >
                            <div
                                v-for="segment in column.segments"
                                :key="segment.type"
                                class="w-full transition-opacity"
                                :class="TYPE_META[segment.type].barClass"
                                :style="{ height: `${segment.height}%` }"
                            ></div>

                            <div
                                v-if="column.segments.length"
                                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[210px] -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs shadow-2xl opacity-0 transition-opacity duration-100 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900"
                            >
                                <p class="mb-1 font-medium text-slate-900 dark:text-white">
                                    {{ column.label }}
                                    <span class="font-normal text-slate-500 dark:text-slate-500">{{ selectedLabel }}</span>
                                </p>
                                <div class="space-y-0.5">
                                    <div
                                        v-for="segment in column.segments"
                                        :key="segment.type"
                                        class="flex items-center justify-between gap-3"
                                    >
                                        <span class="flex items-center gap-1.5">
                                            <span class="h-2 w-2 rounded-full" :class="TYPE_META[segment.type].dotClass"></span>
                                            <span class="text-slate-600 dark:text-slate-300">{{ TYPE_META[segment.type].label }}</span>
                                        </span>
                                        <span class="font-medium tabular-nums text-slate-900 dark:text-white">
                                            {{ formatCompact(segment.amount) }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-2 flex gap-px text-center text-[10px] text-slate-500 dark:text-slate-600">
                        <div v-for="column in dayColumns" :key="column.dayNumber" class="flex-1">
                            {{ dayTickLabel(column.dayNumber - 1) }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Type comparison -->
            <div class="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <h2 class="text-sm font-semibold text-slate-900 dark:text-white">By transaction type</h2>
                        <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
                            {{ selectedLabel }} versus {{ prevLabel }}
                        </p>
                    </div>
                    <div class="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-500">
                        <span class="flex items-center gap-1">
                            <span class="h-2 w-3 rounded-sm bg-slate-300 dark:bg-slate-300"></span>
                            this month
                        </span>
                        <span class="flex items-center gap-1">
                            <span class="h-2 w-3 rounded-sm bg-slate-400 dark:bg-slate-700"></span>
                            last month
                        </span>
                    </div>
                </div>

                <div v-if="isLoading" class="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    Loading dashboard data...
                </div>
                <div v-else-if="loadError" class="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    Dashboard data is unavailable.
                </div>
                <div v-else-if="isEmpty" class="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    No data for {{ selectedLabel }}.
                </div>

                <div v-else class="mt-6 space-y-7">
                    <div v-for="item in typeComparisons" :key="item.type">
                        <div class="flex items-center justify-between gap-2">
                            <span class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <span class="h-2.5 w-2.5 rounded-full" :class="TYPE_META[item.type].dotClass"></span>
                                {{ TYPE_META[item.type].label }}
                            </span>
                            <span
                                class="rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
                                :class="deltaBadgeClass(item.delta, item.type === TransactionType.EXPENSE ? false : true)"
                            >
                                {{ deltaArrow(item.delta) }} {{ deltaText(item.delta) }}
                            </span>
                        </div>
                        <div class="mt-1.5 flex items-baseline justify-between text-xs">
                            <span class="font-medium text-slate-900 dark:text-white">{{ formatCompact(item.current) }}</span>
                            <span class="text-slate-500 dark:text-slate-500">{{ formatCompact(item.lastMonth) }} last month</span>
                        </div>
                        <div class="mt-2 space-y-1">
                            <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                <div
                                    class="h-full rounded-full"
                                    :class="TYPE_META[item.type].barClass"
                                    :style="{ width: `${item.currentPct}%` }"
                                ></div>
                            </div>
                            <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                <div
                                    class="h-full rounded-full bg-slate-500/50"
                                    :style="{ width: `${item.lastPct}%` }"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>