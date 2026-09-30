import axios from 'axios'
import type { ApiErrorResponse } from '@/dto/auth.dto'

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
        return error.response?.data?.message ?? error.message ?? fallback
    }
    if (error instanceof Error && error.message) {
        return error.message
    }
    return fallback
}
