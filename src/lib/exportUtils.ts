export type ExportFormat = 'png' | 'jpeg' | 'webp'

export function getExportMimeType(format: ExportFormat): string {
  switch (format) {
    case 'png': return 'image/png'
    case 'jpeg': return 'image/jpeg'
    case 'webp': return 'image/webp'
  }
}

export function getExportExtension(format: ExportFormat): string {
  switch (format) {
    case 'png': return 'png'
    case 'jpeg': return 'jpg'
    case 'webp': return 'webp'
  }
}
