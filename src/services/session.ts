type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
    unauthorizedHandler = handler
}

export function notifyUnauthorized(): void {
    unauthorizedHandler?.()
}
