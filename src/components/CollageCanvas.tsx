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
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      setCanvasSize((prev) => (prev.width === width ? prev : { width, height: 0 }))
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasSize.width === 0) return
    canvas.width = canvasSize.width
    canvas.height = Math.round(canvasSize.width * aspectRatio)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCollage(ctx, canvas, images, grid, cropOffsets)
  }, [images, canvasSize, grid, aspectRatio, cropOffsets])

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
    </div>
  )
}
