import { getCropParams, drawCollage } from './drawCollage'
import { LoadedImage } from '../types'
import { describe, it, expect, vi } from 'vitest'

describe('getCropParams', () => {
  it('center-crops a tall portrait image into a landscape tile', () => {
    // image: 100×200, tile: 160×90
    // scale = max(160/100, 90/200) = max(1.6, 0.45) = 1.6
    // sw = 160/1.6 = 100, sh = 90/1.6 = 56.25
    // sx = (100 - 100) / 2 = 0, sy = (200 - 56.25) / 2 = 71.875
    const p = getCropParams(100, 200, 160, 90)
    expect(p.sx).toBeCloseTo(0)
    expect(p.sy).toBeCloseTo(71.875)
    expect(p.sw).toBeCloseTo(100)
    expect(p.sh).toBeCloseTo(56.25)
  })

  it('center-crops a wide landscape image into a landscape tile', () => {
    // image: 400×100, tile: 160×90
    // scale = max(160/400, 90/100) = max(0.4, 0.9) = 0.9
    // sw = 160/0.9 ≈ 177.78, sh = 90/0.9 = 100
    // sx = (400 - 177.78) / 2 ≈ 111.11, sy = (100 - 100) / 2 = 0
    const p = getCropParams(400, 100, 160, 90)
    expect(p.sx).toBeCloseTo(111.11, 1)
    expect(p.sy).toBeCloseTo(0)
    expect(p.sw).toBeCloseTo(177.78, 1)
    expect(p.sh).toBeCloseTo(100)
  })

  it('returns full source rect when image exactly matches tile aspect ratio', () => {
    // image: 160×90, tile: 160×90 — no crop needed
    const p = getCropParams(160, 90, 160, 90)
    expect(p.sx).toBeCloseTo(0)
    expect(p.sy).toBeCloseTo(0)
    expect(p.sw).toBeCloseTo(160)
    expect(p.sh).toBeCloseTo(90)
  })

  it('returns zero rect for zero-dimension inputs', () => {
    expect(getCropParams(0, 100, 160, 90)).toEqual({ sx: 0, sy: 0, sw: 0, sh: 0 })
  })
})

describe('drawCollage', () => {
  function makeCtx() {
    return {
      fillStyle: '' as string,
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
  }

  function makeCanvas(w: number, h: number) {
    return { width: w, height: h } as HTMLCanvasElement
  }

  function makeImage(naturalWidth: number, naturalHeight: number, id = '1'): LoadedImage {
    return {
      id,
      name: 'test.jpg',
      url: 'blob:test',
      element: { naturalWidth, naturalHeight } as HTMLImageElement,
    }
  }

  it('fills the canvas black before drawing', () => {
    const ctx = makeCtx()
    drawCollage(ctx, makeCanvas(320, 180), [], { cols: 0, rows: 0 })
    expect(ctx.fillStyle).toBe('#000000')
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 320, 180)
  })

  it('calls drawImage once per image', () => {
    const ctx = makeCtx()
    const images = [makeImage(100, 100), makeImage(100, 100)]
    drawCollage(ctx, makeCanvas(320, 180), images, { cols: 2, rows: 1 })
    expect(ctx.drawImage).toHaveBeenCalledTimes(2)
  })

  it('places first tile at top-left and second tile offset by tileW', () => {
    const ctx = makeCtx()
    // canvas 320×180, grid 2×1 → tileW=160, tileH=180
    // image 160×180 exactly fits both tiles
    const images = [makeImage(160, 180), makeImage(160, 180)]
    drawCollage(ctx, makeCanvas(320, 180), images, { cols: 2, rows: 1 })
    const calls = (ctx.drawImage as ReturnType<typeof vi.fn>).mock.calls
    // drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
    expect(calls[0][5]).toBeCloseTo(0)    // first tile dx = 0
    expect(calls[1][5]).toBeCloseTo(160)  // second tile dx = 160
  })

  it('places second-row tile offset by tileH', () => {
    const ctx = makeCtx()
    // canvas 160×180, grid 1×2 → tileW=160, tileH=90
    const images = [makeImage(160, 90), makeImage(160, 90)]
    drawCollage(ctx, makeCanvas(160, 180), images, { cols: 1, rows: 2 })
    const calls = (ctx.drawImage as ReturnType<typeof vi.fn>).mock.calls
    // drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
    expect(calls[0][6]).toBeCloseTo(0)   // first tile dy = 0
    expect(calls[1][6]).toBeCloseTo(90)  // second tile dy = 90
  })

  it('skips drawing for null slots', () => {
    const ctx = makeCtx()
    // 2 images + 1 null in a 2×2 grid → only 2 drawn
    const images: (LoadedImage | null)[] = [makeImage(100, 100), null, makeImage(100, 100), null]
    drawCollage(ctx, makeCanvas(320, 180), images, { cols: 2, rows: 2 })
    expect(ctx.drawImage).toHaveBeenCalledTimes(2)
  })

  it('applies cropOffset to shift the source region', () => {
    const ctx = makeCtx()
    // image: 400×100, tile: 160×90
    // scale = max(160/400, 90/100) = 0.9; sw ≈ 177.78, sh = 100
    // center sx ≈ 111.11; offset=1 → sx = (400-177.78)/2 + 1*(400-177.78)/2 ≈ 222.22
    const offsets = new Map([['1', 1]])
    drawCollage(ctx, makeCanvas(160, 90), [makeImage(400, 100)], { cols: 1, rows: 1 }, offsets)
    const call = (ctx.drawImage as ReturnType<typeof vi.fn>).mock.calls[0]
    // sx (arg index 1) should be ~222.22, not ~111.11
    expect(call[1]).toBeCloseTo(222.22, 1)
    expect(call[2]).toBeCloseTo(0) // sy unchanged (horizontal crop)
  })
})
