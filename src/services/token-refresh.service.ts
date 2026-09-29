import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { notifyUnauthorized } from '@/services/session'
import { decodeJwt } from '@/utils/jwt'
import { getAccessToken, getRefreshToken } from '@/utils/token'
import type { TokenPayload } from '@/utils/token'
import type {
    ApiEnvelope,
    RefreshTokenRequestDto,
    RefreshTokenResponseDto
} from '@/dto/auth.dto'

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL
const CLIENT_CREDENTIALS = {
    clientId: import.meta.env.VITE_CLIENT_ID,
    clientSecret: import.meta.env.VITE_CLIENT_SECRET
}
const REFRESH_PATH = '/refresh-token'
const REFRESH_MARGIN_MS = 5 * 60 * 1000
const MIN_REFRESH_DELAY_MS = 30 * 1000

let refreshPromise: Promise<string> | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null

export function getTokenExpiryMs(): number | null {
    const token = getAccessToken()
    if (!token) return null

    const payload = decodeJwt<TokenPayload>(token)
    if (!payload?.exp) return null

    return payload.exp * 1000
}

export function cancelTokenRefresh(): void {
    if (refreshTimer) {
        clearTimeout(refreshTimer)
        refreshTimer = null
    }
}

export function refreshAccessToken(): Promise<string> {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const authStore = useAuthStore()
            const currentRefreshToken = authStore.refreshToken ?? getRefreshToken()
            if (!currentRefreshToken) {
                throw new Error('Refresh token is not available')
            }

            const body: RefreshTokenRequestDto = {
                refreshToken: currentRefreshToken,
                ...CLIENT_CREDENTIALS
            }
            const { data } = await axios.post<ApiEnvelope<RefreshTokenResponseDto>>(
                `${AUTH_BASE_URL}${REFRESH_PATH}`,
                body
            )
            if (!data?.data?.accessToken) {
                throw new Error('Failed to refresh the refresh token')
            }

            authStore.setToken(data.data.accessToken, data.data.refreshToken ?? currentRefreshToken)
            scheduleTokenRefresh()
            return data.data.accessToken
        })().finally(() => {
            refreshPromise = null
        })
    }

    return refreshPromise
}

export function scheduleTokenRefresh(): void {
    cancelTokenRefresh()

    const expiry = getTokenExpiryMs()
    if (expiry === null) return

    const delay = Math.max(expiry - Date.now() - REFRESH_MARGIN_MS, MIN_REFRESH_DELAY_MS)
    refreshTimer = setTimeout(() => {
        void performScheduledRefresh()
    }, delay)
}

async function performScheduledRefresh(): Promise<void> {
    if (!useAuthStore().refreshToken) {
        cancelTokenRefresh()
        return
    }

    try {
        await refreshAccessToken()
    } catch {
        useAuthStore().logout()
        notifyUnauthorized()
    }
}
