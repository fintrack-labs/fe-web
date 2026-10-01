<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/auth.service'
import { useToast } from '@/composables/useToast'
import { getApiErrorMessage } from '@/utils/api-error'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const isActivating = ref(true)
const errorMessage = ref('')

onMounted(async () => {
    const token = route.query.token
    if (typeof token !== 'string' || !token) {
        errorMessage.value = 'The activation link is missing its token.'
        isActivating.value = false
        return
    }

    try {
        await authService.activate(token)
        toast.success('Email verified. Your account is now active. Please sign in.')
        await router.replace({ name: 'login' })
    } catch (error) {
        errorMessage.value = getApiErrorMessage(error, 'Unable to activate your account. Please try again.')
        toast.error(errorMessage.value)
    } finally {
        isActivating.value = false
    }
})
</script>

<template>
    <main class="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
        <section class="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <h1 class="text-xl font-semibold text-slate-900 dark:text-white">Account activation</h1>
            <p v-if="isActivating" role="status" class="text-sm text-slate-600 dark:text-slate-300">
                Verifying your email...
            </p>
            <div v-else-if="errorMessage" role="alert" class="space-y-4">
                <p class="text-sm text-rose-600 dark:text-rose-400">{{ errorMessage }}</p>
                <RouterLink :to="{ name: 'login' }" class="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    Go to sign in
                </RouterLink>
            </div>
        </section>
    </main>
</template>