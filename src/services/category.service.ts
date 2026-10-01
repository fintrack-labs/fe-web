import { coreApi } from '@/services/api'
import type { CategoryResponseDto } from '@/dto/category.dto'
import type { PaginatedResponse } from '@/dto/paginated.dto'

export const categoryService = {
    list: () => coreApi.get<unknown, PaginatedResponse<CategoryResponseDto>>('/categories')
}
