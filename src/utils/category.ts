import { CategoryType } from '@/dto/category.dto'
import type { CategoryResponseDto } from '@/dto/category.dto'

const INDENT_WIDTH = 4
const INDENT_CHAR = '\u00A0'

export interface CategoryOption {
    id: number
    name: string
    type: CategoryType
    depth: number
    hasChildren: boolean
    label: string
}

export function toCategoryOptions(categories: CategoryResponseDto[]): CategoryOption[] {
    const options: CategoryOption[] = []
    const rendered = new Set<string>()

    const walk = (nodes: CategoryResponseDto[], depth: number): void => {
        for (const node of nodes) {
            const key = String(node.id)
            if (rendered.has(key)) continue
            rendered.add(key)

            options.push({
                id: node.id,
                name: node.name,
                type: node.type,
                depth,
                hasChildren: Boolean(node.children?.length),
                label: `${INDENT_CHAR.repeat(depth * INDENT_WIDTH)}${node.name}`
            })

            if (node.children?.length) walk(node.children, depth + 1)
        }
    }

    walk(categories, 0)
    return options
}
