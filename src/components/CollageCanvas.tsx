import { useEffect, useRef, useState } from 'react'
import { LoadedImage } from '../types'
import { gridLayout } from '../lib/gridLayout'
import { drawCollage } from '../lib/drawCollage'

interface Props {
  images: LoadedImage[]
}

export function CollageCanvas({ images }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      setCanvasSize((prev) => {
        if (prev.width === width) return prev
        return { width, height: Math.round(width * 9 / 16) }
      })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasSize.width === 0) return
    canvas.width = canvasSize.width
    canvas.height = canvasSize.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCollage(ctx, canvas, images, gridLayout(images.length))
  }, [images, canvasSize])

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
    </div>
  )
}
