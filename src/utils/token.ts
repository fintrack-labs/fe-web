import { STORAGE_KEY } from '@/constants/storage'
import { decodeJwt } from '@/utils/jwt'
import type { UserDto } from '@/dto/user.dto'

export interface TokenPayload {
    sub: string
    email: string
    name: string
    adGroup: string[]
    exp?: number
}

export function getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEY.TOKEN)
}

export function getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEY.REFRESH_TOKEN)
}

export function isAccessTokenValid(): boolean {
    const token = getAccessToken()
    if (!token) return false

    const payload = decodeJwt<TokenPayload>(token)
    if (!payload?.exp) return false

    return payload.exp * 1000 > Date.now()
}

export function setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(STORAGE_KEY.TOKEN, accessToken)
    localStorage.setItem(STORAGE_KEY.REFRESH_TOKEN, refreshToken)
    syncUser(accessToken)
}

export function clearTokens(): void {
    localStorage.removeItem(STORAGE_KEY.TOKEN)
    localStorage.removeItem(STORAGE_KEY.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEY.USER)
}

function syncUser(accessToken: string): void {
    const payload = decodeJwt<TokenPayload>(accessToken)
    if (!payload) return

    const user: UserDto = {
        userId: payload.sub,
        email: payload.email,
        adGroup: payload.adGroup ?? [],
        name: payload.name
    }
    localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(user))
}
