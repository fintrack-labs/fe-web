import { authApi } from '@/services/api'
import type {
    LoginRequestDto,
    LoginResponseDto,
    LogoutRequestDto,
    RegisterRequestDto,
    RegisterResponseDto
} from '@/dto/auth.dto'

export const authService = {
    login: (body: LoginRequestDto) =>
        authApi.post<LoginResponseDto, LoginResponseDto>('/login', body),

    register: (body: RegisterRequestDto) =>
        authApi.post<RegisterResponseDto, RegisterResponseDto>('/user/register', body),

    logout: (body: LogoutRequestDto) =>
        authApi.post<void, { statusCode: number; message: string }>('/logout', body)
}
