import { useEffect, useRef, useState } from 'react'
import { LoadedImage } from '../types'
import { GridLayout } from '../lib/gridLayout'
import { drawCollage } from '../lib/drawCollage'

interface Props {
  images: (LoadedImage | null)[]
  grid: GridLayout
  aspectRatio: number
  cropOffsets: Map<string, number>
}

export function CollageCanvas({ images, grid, aspectRatio, cropOffsets }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      setContainerWidth((prev) => (prev === width ? prev : width))
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || containerWidth === 0) return
    canvas.width = containerWidth
    canvas.height = Math.round(containerWidth * aspectRatio)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCollage(ctx, canvas, images, grid, cropOffsets)
  }, [images, containerWidth, grid, aspectRatio, cropOffsets])

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
    </div>
  )
}
