import { LoadedImage } from '../types'

function loadImageElement(file: File): Promise<{ element: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ element: img, url })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Failed to load image: ${file.name}`))
    }
    img.src = url
  })
}

export interface LoadImagesResult {
  loaded: LoadedImage[]
  failed: string[]
}

export async function loadImages(files: File[]): Promise<LoadImagesResult> {
  const results = await Promise.allSettled(
    files.map(async (file) => {
      const { element, url } = await loadImageElement(file)
      return { id: crypto.randomUUID(), element, name: file.name, url }
    })
  )
  const loaded: LoadedImage[] = []
  const failed: string[] = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      loaded.push(r.value as LoadedImage)
    } else {
      failed.push(files[i].name)
    }
  })
  return { loaded, failed }
}
