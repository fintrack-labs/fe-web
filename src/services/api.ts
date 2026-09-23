import axios from 'axios'
import { STORAGE_KEY } from '@/constants/storage'

export const authApi = axios.create({
    baseURL: import.meta.env.VITE_AUTH_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

authApi.interceptors.request.use((config) => {
    const token = localStorage.getItem(STORAGE_KEY.TOKEN)
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

authApi.interceptors.response.use(
    (response) => response.data?.data ?? response.data,
    (error) => {
        return Promise.reject(error)
    }
)