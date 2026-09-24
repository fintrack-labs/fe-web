import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEY } from '@/constants/storage'
import { decodeJwt } from '@/utils/jwt'
import type { UserDto } from '@/dto/user.dto'

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem(STORAGE_KEY.TOKEN))
    const refreshToken = ref<string | null>(localStorage.getItem(STORAGE_KEY.REFRESH_TOKEN))
    const isAuthenticated = computed(() => !!token.value)

    function setToken(newToken: string | null, newRefreshToken: string | null) {
        if (!newToken || !newRefreshToken) {
            throw new Error('Token dan Refresh Token harus ada')
        }
        token.value = newToken
        refreshToken.value = newRefreshToken
        if (newToken) {
            localStorage.setItem(STORAGE_KEY.TOKEN, newToken)
        } else {
            localStorage.removeItem(STORAGE_KEY.TOKEN)
        }
        if (newRefreshToken) {
            localStorage.setItem(STORAGE_KEY.REFRESH_TOKEN, newRefreshToken)
        } else {
            localStorage.removeItem(STORAGE_KEY.REFRESH_TOKEN)
        }

        setUser()
    }

    function setUser() {
        if (!token.value) return
        const payload = decodeJwt(token.value)
        console.log('DEBUG payload', payload)
        if (!payload) return

        const userId = payload.sub
        const user: UserDto = {
            userId,
            adGroup: payload.adGroup,
            email: payload.email,
            name: payload.name
        }
        localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(user))
    }

    function logout() {
        token.value = null
        refreshToken.value = null
        localStorage.removeItem(STORAGE_KEY.TOKEN)
        localStorage.removeItem(STORAGE_KEY.REFRESH_TOKEN)
        localStorage.removeItem(STORAGE_KEY.USER)
    }

    return { token, isAuthenticated, setToken, logout }
})