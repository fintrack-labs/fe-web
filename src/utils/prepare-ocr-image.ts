const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const TARGET_UPLOAD_BYTES = 8 * 1024 * 1024
const SERVICE_MAX_BYTES = 10 * 1024 * 1024
const MAX_SOURCE_BYTES = 30 * 1024 * 1024
const MAX_DIMENSION = 2400

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('The image could not be compressed in this browser.'))
        }, 'image/jpeg', quality)
    })
}

function withJpegExtension(fileName: string): string {
    const nameWithoutExtension = fileName.replace(/\.[^.]+$/, '') || 'receipt'
    return `${nameWithoutExtension}.jpg`
}

export async function prepareOcrImage(file: File): Promise<File> {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        throw new Error('Choose a JPEG, PNG, or WebP image.')
    }
    if (file.size > MAX_SOURCE_BYTES) {
        throw new Error('The selected image is too large to process on this device.')
    }

    let bitmap: ImageBitmap
    try {
        bitmap = await createImageBitmap(file)
    } catch {
        throw new Error('The selected image could not be opened.')
    }

    try {
        const longestSide = Math.max(bitmap.width, bitmap.height)
        if (file.size <= TARGET_UPLOAD_BYTES && longestSide <= MAX_DIMENSION) return file

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Image compression is unavailable in this browser.')

        let scale = Math.min(1, MAX_DIMENSION / longestSide)
        let bestBlob: Blob | null = null
        const qualities = [0.86, 0.78]

        for (let attempt = 0; attempt < 4; attempt += 1) {
            canvas.width = Math.max(1, Math.round(bitmap.width * scale))
            canvas.height = Math.max(1, Math.round(bitmap.height * scale))
            context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

            for (const quality of qualities) {
                bestBlob = await canvasToJpeg(canvas, quality)
                if (bestBlob.size <= TARGET_UPLOAD_BYTES) {
                    return new File([bestBlob], withJpegExtension(file.name), {
                        type: 'image/jpeg',
                        lastModified: file.lastModified
                    })
                }
            }

            scale *= 0.85
        }

        if (bestBlob && bestBlob.size <= SERVICE_MAX_BYTES) {
            return new File([bestBlob], withJpegExtension(file.name), {
                type: 'image/jpeg',
                lastModified: file.lastModified
            })
        }

        throw new Error('The image could not be reduced below the 10 MiB upload limit.')
    } finally {
        bitmap.close()
    }
}