import { LoadedImage } from '../types'
import { GridLayout } from './gridLayout'

export function getCropParams(
  iw: number,
  ih: number,
  tw: number,
  th: number,
  offset = 0
): { sx: number; sy: number; sw: number; sh: number } {
  if (iw <= 0 || ih <= 0 || tw <= 0 || th <= 0) {
    return { sx: 0, sy: 0, sw: 0, sh: 0 }
  }
  const scale = Math.max(tw / iw, th / ih)
  const sw = tw / scale
  const sh = th / scale
  // offset ∈ [-1, 1]: -1 = top/left edge, 0 = center, 1 = bottom/right edge
  const sx = (iw - sw) / 2 + offset * (iw - sw) / 2
  const sy = (ih - sh) / 2 + offset * (ih - sh) / 2
  return { sx, sy, sw, sh }
}

export function drawCollage(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  images: (LoadedImage | null)[],
  grid: GridLayout,
  cropOffsets: Map<string, number> = new Map()
): void {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (grid.cols === 0 || grid.rows === 0) return

  const tileW = canvas.width / grid.cols
  const tileH = canvas.height / grid.rows

  images.forEach((image, i) => {
    if (image === null) return
    const col = i % grid.cols
    const row = Math.floor(i / grid.cols)
    const offset = cropOffsets.get(image.id) ?? 0
    const destX = Math.round(col * tileW)
    const destY = Math.round(row * tileH)
    const destW = Math.round((col + 1) * tileW) - destX
    const destH = Math.round((row + 1) * tileH) - destY
    const { sx, sy, sw, sh } = getCropParams(
      image.element.naturalWidth,
      image.element.naturalHeight,
      destW,
      destH,
      offset
    )
    ctx.drawImage(image.element, sx, sy, sw, sh, destX, destY, destW, destH)
  })
}
