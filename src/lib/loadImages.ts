import { LoadedImage } from '../types'

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Failed to load image: ${file.name}`))
    }
    img.src = url
  })
}

export async function loadImages(files: File[]): Promise<LoadedImage[]> {
  return Promise.all(
    files.map(async (file) => {
      const element = await loadImageElement(file)
      return {
        id: crypto.randomUUID(),
        element,
        name: file.name,
      }
    })
  )
}
