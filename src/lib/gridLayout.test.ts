import { describe, it, expect } from 'vitest'
import { gridLayout } from './gridLayout'

describe('gridLayout', () => {
  it('returns 0×0 for 0 images', () => {
    expect(gridLayout(0)).toEqual({ cols: 0, rows: 0 })
  })
  it('returns 1×1 for 1 image', () => {
    expect(gridLayout(1)).toEqual({ cols: 1, rows: 1 })
  })
  it('returns 2×1 for 2 images', () => {
    expect(gridLayout(2)).toEqual({ cols: 2, rows: 1 })
  })
  it('returns 2×2 for 3 images', () => {
    expect(gridLayout(3)).toEqual({ cols: 2, rows: 2 })
  })
  it('returns 2×2 for 4 images', () => {
    expect(gridLayout(4)).toEqual({ cols: 2, rows: 2 })
  })
  it('returns 3×2 for 5 images', () => {
    expect(gridLayout(5)).toEqual({ cols: 3, rows: 2 })
  })
  it('returns 3×2 for 6 images', () => {
    expect(gridLayout(6)).toEqual({ cols: 3, rows: 2 })
  })
  it('returns 3×3 for 7 images', () => {
    expect(gridLayout(7)).toEqual({ cols: 3, rows: 3 })
  })
  it('returns 3×3 for 9 images', () => {
    expect(gridLayout(9)).toEqual({ cols: 3, rows: 3 })
  })
})
