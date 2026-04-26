import { describe, it, expect } from 'vitest'
import { computeProxies } from './computeProxies'

describe('computeProxies', () => {
  it('returns empty map when there are no blank slots', () => {
    const result = computeProxies(['a', 'b', 'c'], ['a', 'b', 'c'], { cols: 3, rows: 1 })
    expect(result.size).toBe(0)
  })

  it('returns empty map when imageIds is empty', () => {
    const result = computeProxies([null, null], [], { cols: 2, rows: 1 })
    expect(result.size).toBe(0)
  })

  it('assigns a proxy to every blank slot', () => {
    // 2 images, 4 slots (2 blank)
    const slots = ['a', null, 'b', null]
    const result = computeProxies(slots, ['a', 'b'], { cols: 2, rows: 2 })
    expect(result.has(1)).toBe(true)
    expect(result.has(3)).toBe(true)
  })

  it('only assigns proxies to null slots, not real ones', () => {
    const slots = ['a', null]
    const result = computeProxies(slots, ['a', 'b'], { cols: 2, rows: 1 })
    expect(result.has(0)).toBe(false)
    expect(result.has(1)).toBe(true)
  })

  it('assigns a valid image ID to each blank slot', () => {
    const slots = [null, null, null, null]
    const ids = ['x', 'y']
    const result = computeProxies(slots, ids, { cols: 2, rows: 2 })
    for (const [, id] of result) {
      expect(ids).toContain(id)
    }
  })

  it('distributes proxy usage evenly across available images', () => {
    // 4 blank slots, 2 images → each used exactly twice
    const slots: (string | null)[] = [null, null, null, null]
    const ids = ['a', 'b']
    const result = computeProxies(slots, ids, { cols: 2, rows: 2 })
    const counts = new Map<string, number>([['a', 0], ['b', 0]])
    for (const [, id] of result) counts.set(id, counts.get(id)! + 1)
    expect(counts.get('a')).toBe(2)
    expect(counts.get('b')).toBe(2)
  })

  it('does not assign a proxy that matches the real image in the same row', () => {
    // row 0: ['a', null] — blank at index 1 must not get proxy 'a'
    const slots = ['a', null]
    const ids = ['a', 'b']
    const result = computeProxies(slots, ids, { cols: 2, rows: 1 })
    expect(result.get(1)).toBe('b')
  })

  it('does not assign a proxy that matches the real image in the same column', () => {
    // col 0: ['a', null] (2×1 grid, col 0 has rows 0 and 1)
    const slots = ['a', null]
    const ids = ['a', 'b']
    const result = computeProxies(slots, ids, { cols: 1, rows: 2 })
    expect(result.get(1)).toBe('b')
  })

  it('does not assign a proxy that matches a diagonal neighbor', () => {
    // 2×2 grid with 3 images: slot 0 is blank, diag neighbor (1,1) has 'a', col neighbor (1,0) has 'c'
    // slots = [null, null, 'c', 'a'] → col0=[null,'c'], col1=[null,'a']
    // Adjacents for slot 0: diag (1,1)='a', neighbor (1,0)='c', row-peer (0,1)=null
    // Only 'b' is non-adjacent → slot 0 must get 'b'
    const slots = [null, null, 'c', 'a']
    const ids = ['a', 'b', 'c']
    const result = computeProxies(slots, ids, { cols: 2, rows: 2 })
    expect(result.get(0)).toBe('b')
  })

  it('relaxes adjacency constraint when all candidates are adjacent', () => {
    // Only 1 image available but there are blank slots — must still fill them
    const slots = ['a', null]
    const ids = ['a']
    const result = computeProxies(slots, ids, { cols: 2, rows: 1 })
    expect(result.get(1)).toBe('a')
  })

  it('handles a fully-blank grid with one image', () => {
    const slots: (string | null)[] = [null, null, null, null]
    const result = computeProxies(slots, ['a'], { cols: 2, rows: 2 })
    expect(result.size).toBe(4)
    for (const [, id] of result) expect(id).toBe('a')
  })
})
