export enum CategoryType {
    EXPENSE = 'EXPENSE',
    INCOME = 'INCOME'
}

export interface CategoryResponseDto {
    id: number
    userId: string | null
    name: string
    type: CategoryType
    parentId: string | null
    children?: CategoryResponseDto[]
    createdAt: string
}
