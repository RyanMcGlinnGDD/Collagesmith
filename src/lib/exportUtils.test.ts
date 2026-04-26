import { describe, it, expect } from 'vitest'
import { getExportMimeType, getExportExtension } from './exportUtils'

describe('getExportMimeType', () => {
  it('returns image/png for png', () => {
    expect(getExportMimeType('png')).toBe('image/png')
  })
  it('returns image/jpeg for jpeg', () => {
    expect(getExportMimeType('jpeg')).toBe('image/jpeg')
  })
  it('returns image/webp for webp', () => {
    expect(getExportMimeType('webp')).toBe('image/webp')
  })
})

describe('getExportExtension', () => {
  it('returns png for png', () => {
    expect(getExportExtension('png')).toBe('png')
  })
  it('returns jpg for jpeg (not jpeg)', () => {
    expect(getExportExtension('jpeg')).toBe('jpg')
  })
  it('returns webp for webp', () => {
    expect(getExportExtension('webp')).toBe('webp')
  })
})
