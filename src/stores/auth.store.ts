import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
    clearTokens,
    getAccessToken,
    getRefreshToken,
    isAccessTokenValid,
    setTokens
} from '@/utils/token'

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(getAccessToken())
    const refreshToken = ref<string | null>(getRefreshToken())
    const isAuthenticated = computed(() => !!token.value && isAccessTokenValid())

    function setToken(accessToken: string, newRefreshToken: string) {
        token.value = accessToken
        refreshToken.value = newRefreshToken
        setTokens(accessToken, newRefreshToken)
    }

    function logout() {
        token.value = null
        refreshToken.value = null
        clearTokens()
    }

    return { token, refreshToken, isAuthenticated, setToken, logout }
})
