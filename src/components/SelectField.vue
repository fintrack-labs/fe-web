<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useScrollIdle } from '@/composables/useScrollIdle'

interface SelectOption {
    value: string
    label: string
    disabled?: boolean
}

const props = withDefaults(
    defineProps<{
        modelValue: string
        options: SelectOption[]
        id?: string
        placeholder?: string
        disabled?: boolean
    }>(),
    { placeholder: 'Select', disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const GAP = 8
const MIN_POPUP_SPACE = 120
const MAX_POPUP_HEIGHT = 288

const root = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const activeIndex = ref(-1)
const placement = ref<'top' | 'bottom'>('bottom')
const maxHeight = ref(MAX_POPUP_HEIGHT)

const { isScrolling: isListScrolling, onScroll: onListScroll } = useScrollIdle()

const transitionName = computed(() =>
    placement.value === 'top' ? 'select-field-up' : 'select-field-down'
)

const selectedLabel = computed(() => {
    const option = props.options.find((item) => item.value === props.modelValue)
    return option ? option.label.replace(/^[\u00A0]+/, '') : ''
})

function firstSelectableIndex(): number {
    const index = props.options.findIndex((option) => !option.disabled)
    return index
}

function open(): void {
    if (props.disabled) return
    updatePosition()
    isOpen.value = true
    const selected = props.options.findIndex((option) => option.value === props.modelValue)
    activeIndex.value = selected >= 0 ? selected : firstSelectableIndex()
    void scrollActiveIntoView()
}

function close(): void {
    isOpen.value = false
    activeIndex.value = -1
}

function toggle(): void {
    if (isOpen.value) close()
    else open()
}

function moveActive(step: number): void {
    const total = props.options.length
    if (total === 0) return

    let index = activeIndex.value
    for (let attempt = 0; attempt < total; attempt += 1) {
        index = (index + step + total) % total
        if (!props.options[index]?.disabled) {
            activeIndex.value = index
            void scrollActiveIntoView()
            return
        }
    }
}

function select(option: SelectOption): void {
    if (option.disabled) return
    emit('update:modelValue', option.value)
    close()
}

function commitActive(): void {
    const option = props.options[activeIndex.value]
    if (option) select(option)
}

function handleKeydown(event: KeyboardEvent): void {
    if (props.disabled) return

    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault()
            if (!isOpen.value) open()
            else moveActive(1)
            break
        case 'ArrowUp':
            event.preventDefault()
            if (!isOpen.value) open()
            else moveActive(-1)
            break
        case 'Enter':
        case ' ':
            event.preventDefault()
            if (!isOpen.value) open()
            else commitActive()
            break
        case 'Escape':
            if (isOpen.value) {
                event.preventDefault()
                close()
            }
            break
        case 'Tab':
            close()
            break
    }
}

async function scrollActiveIntoView(): Promise<void> {
    await nextTick()
    list.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
}

function handleDocumentPointer(event: Event): void {
    if (!isOpen.value) return
    if (root.value && event.target instanceof Node && root.value.contains(event.target)) return
    close()
}

function handleScrollOutside(event: Event): void {
    if (!isOpen.value) return
    if (event.target instanceof Node && root.value?.contains(event.target)) return
    close()
}

function updatePosition(): void {
    const element = root.value
    if (!element) return

    const rect = element.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - GAP
    const spaceAbove = rect.top - GAP
    const shouldFlip = spaceBelow < MIN_POPUP_SPACE && spaceAbove > spaceBelow

    placement.value = shouldFlip ? 'top' : 'bottom'
    maxHeight.value = Math.max(
        MIN_POPUP_SPACE,
        Math.min(MAX_POPUP_HEIGHT, shouldFlip ? spaceAbove : spaceBelow)
    )
}

watch(isOpen, (openState) => {
    if (!openState) return
    document.addEventListener('pointerdown', handleDocumentPointer, true)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', handleScrollOutside, true)
})

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', handleDocumentPointer, true)
    window.removeEventListener('resize', updatePosition)
    window.removeEventListener('scroll', handleScrollOutside, true)
})
</script>

<template>
    <div ref="root" class="relative">
        <button
            type="button"
            :id="id"
            :disabled="disabled"
            class="flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-left text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:bg-slate-800 dark:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:border-slate-800 dark:disabled:bg-slate-900"
            :class="isOpen ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-700'"
            :aria-expanded="isOpen"
            aria-haspopup="listbox"
            @click="toggle"
            @keydown="handleKeydown"
        >
            <span class="truncate" :class="selectedLabel ? '' : 'text-slate-400 dark:text-slate-500'">
                {{ selectedLabel || placeholder }}
            </span>
            <svg
                class="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500 transition-transform"
                :class="isOpen ? 'rotate-180' : ''"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
            >
                <path d="M5 7.5 10 12.5 15 7.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        </button>

        <Transition :name="transitionName">
            <ul
                v-if="isOpen"
                ref="list"
                class="select-field-list thin-scrollbar absolute z-30 w-full touch-pan-y overflow-y-auto overscroll-contain rounded-xl border border-slate-300/70 bg-white/95 p-1 shadow-2xl shadow-black/10 backdrop-blur-sm ring-1 ring-slate-900/5 dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-black/50 dark:ring-white/5"
                :class="[
                    placement === 'top' ? 'bottom-full mb-1' : 'mt-1',
                    isListScrolling ? 'is-scrolling' : ''
                ]"
                :style="{ maxHeight: `${maxHeight}px` }"
                role="listbox"
                @scroll.passive="onListScroll"
            >
                <li
                    v-for="(option, index) in options"
                    :key="option.value"
                    role="option"
                    class="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 transition-colors duration-100 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                    :class="[
                        option.disabled
                            ? 'cursor-not-allowed hover:bg-transparent hover:text-slate-700 dark:hover:text-slate-200'
                            : '',
                        index === activeIndex && !option.disabled && option.value !== modelValue
                            ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                            : '',
                        option.value === modelValue
                            ? 'bg-indigo-500/10 font-medium text-indigo-600 dark:text-indigo-300'
                            : ''
                    ]"
                    :data-active="index === activeIndex && !option.disabled ? 'true' : 'false'"
                    :aria-selected="option.value === modelValue"
                    :aria-disabled="option.disabled ? 'true' : undefined"
                    @click="select(option)"
                    @mousemove="activeIndex = index"
                >
                    <span class="truncate">{{ option.label }}</span>
                    <svg
                        v-if="option.value === modelValue"
                        class="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        aria-hidden="true"
                    >
                        <path d="M4.5 10.5 8 14l7.5-8" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </li>
            </ul>
        </Transition>
    </div>
</template>

<style scoped>
.select-field-down-enter-active,
.select-field-down-leave-active,
.select-field-up-enter-active,
.select-field-up-leave-active {
    transition: opacity 0.14s ease, transform 0.14s ease;
}

.select-field-down-enter-from,
.select-field-down-leave-to {
    opacity: 0;
    transform: translateY(-6px) scale(0.985);
}

.select-field-up-enter-from,
.select-field-up-leave-to {
    opacity: 0;
    transform: translateY(6px) scale(0.985);
}
</style>
