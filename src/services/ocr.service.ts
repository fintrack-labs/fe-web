import { ocrApi } from '@/services/api'

export interface OcrAnalysisData {
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | null
    detectedLanguage: string | null
    transactionDate: string | null
    merchantName: string | null
    amount: number | null
    currency: string | null
    accountId: number | null
    accountName: string | null
    categoryId: number | null
    categoryName: string | null
    confidence: number | null
    rawText: string | null
}

export interface OcrAnalysisResponse {
    success: boolean
    message: string
    data: OcrAnalysisData | null
}

export const ocrService = {
    analyzeReceipt: (image: File, locale: string) => {
        const baseURL = import.meta.env.VITE_OCR_SERVICE_URL?.trim()
        if (!baseURL) throw new Error('OCR service URL is not configured.')

        const body = new FormData()
        body.append('image', image, image.name)
        body.append('documentType', 'receipt')
        body.append('locale', locale)

        return ocrApi.post<unknown, OcrAnalysisResponse>('/v1/ocr/analyze', body, {
            baseURL,
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    }
}