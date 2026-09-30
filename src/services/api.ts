import axios from 'axios'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { notifyUnauthorized } from '@/services/session'
import { refreshAccessToken } from '@/services/token-refresh.service'
import { getAccessToken } from '@/utils/token'

const SKIP_REFRESH_PATHS = ['/login', '/logout', '/refresh-token']

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

function unwrapAuthEnvelope(body: unknown): unknown {
  if (
    body &&
    typeof body === 'object' &&
    'statusCode' in body &&
    'message' in body &&
    'data' in body
  ) {
    return (body as { data: unknown }).data
  }
  return body
}

function createApiClient(baseURL: string, useAuthEnvelope: boolean, timeout = 10000): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json'
    },
    timeout
  })

  client.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (response) => {
      if (useAuthEnvelope) {
        return unwrapAuthEnvelope(response.data)
      }
      return response.data
    },
    async (error: AxiosError) => {
      const config = error.config as RetriableConfig | undefined
      const status = error.response?.status

      if (
        status !== 401 ||
        !config ||
        config._retry ||
        SKIP_REFRESH_PATHS.some((path) => config.url?.includes(path))
      ) {
        throw error
      }

      config._retry = true

      try {
        const accessToken = await refreshAccessToken()
        config.headers.Authorization = `Bearer ${accessToken}`
        return await client(config)
      } catch (refreshError) {
        useAuthStore().logout()
        notifyUnauthorized()
        throw refreshError
      }
    }
  )

  return client
}

export const authApi = createApiClient(import.meta.env.VITE_AUTH_BASE_URL, true)
export const coreApi = createApiClient(import.meta.env.VITE_API_BASE_URL, false)
export const ocrApi = createApiClient(import.meta.env.VITE_OCR_SERVICE_URL ?? '', false, 60000)
