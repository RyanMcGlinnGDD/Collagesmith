import { LoadedImage } from '../types'
import { GridLayout } from './gridLayout'

export function getCropParams(
  iw: number,
  ih: number,
  tw: number,
  th: number
): { sx: number; sy: number; sw: number; sh: number } {
  const scale = Math.max(tw / iw, th / ih)
  const sw = tw / scale
  const sh = th / scale
  const sx = (iw - sw) / 2
  const sy = (ih - sh) / 2
  return { sx, sy, sw, sh }
}

export function drawCollage(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  images: LoadedImage[],
  grid: GridLayout
): void {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (grid.cols === 0 || grid.rows === 0) return

  const tileW = canvas.width / grid.cols
  const tileH = canvas.height / grid.rows

  images.forEach((image, i) => {
    const col = i % grid.cols
    const row = Math.floor(i / grid.cols)
    const { sx, sy, sw, sh } = getCropParams(
      image.element.naturalWidth,
      image.element.naturalHeight,
      tileW,
      tileH
    )
    ctx.drawImage(image.element, sx, sy, sw, sh, col * tileW, row * tileH, tileW, tileH)
  })
}
