export interface ApiEnvelope<T> {
    statusCode: number
    message: string
    data?: T
}

export interface LoginRequestDto {
    email: string
    password: string
    clientId: string
    clientSecret: string
}

export interface LoginResponseDto {
    accessToken: string
    refreshToken?: string
    tokenType: string
    expiresIn: number
}

export interface RefreshTokenRequestDto {
    refreshToken: string
    clientId: string
    clientSecret: string
}

export interface RefreshTokenResponseDto {
    accessToken: string
    refreshToken?: string
    tokenType: string
    expiresIn: number
}

export interface LogoutRequestDto {
    refreshToken: string
    clientId: string
    clientSecret: string
}

export interface RegisterRequestDto {
    name: string
    email: string
    password: string
}

export interface RegisterUserDto {
    userId: string
    name: string
    email: string
    status: string
    createdAt?: string
}

export interface RegisterResponseDto {
    user: RegisterUserDto
}

export interface ApiErrorResponse {
    statusCode: number
    error?: string
    message: string
    details?: unknown
    timestamp?: string
}
