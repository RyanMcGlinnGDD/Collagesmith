import { GridLayout } from './gridLayout'

/**
 * Assigns proxy image IDs to blank (null) slots in the canvas layout.
 *
 * Rules:
 * - Round-robin: each image is used as proxy equally before any is reused.
 * - No same-source conflicts: a proxy won't share a source with any slot in
 *   the same row, same column, or 8 immediate neighbors (real or proxy).
 *   The constraint is relaxed only when impossible to satisfy.
 *
 * @param slots   Full slot array (length === grid.cols * grid.rows); null = blank
 * @param imageIds  All available image IDs to use as proxies
 * @param grid    Grid dimensions
 * @returns Map from slot index to proxy image ID (only for blank slots)
 */
export function computeProxies(
  slots: (string | null)[],
  imageIds: string[],
  grid: GridLayout
): Map<number, string> {
  const result = new Map<number, string>()
  if (imageIds.length === 0) return result

  const blankIndices: number[] = []
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] === null) blankIndices.push(i)
  }
  if (blankIndices.length === 0) return result

  const usageCount = new Map<string, number>(imageIds.map((id) => [id, 0]))

  for (const blankIdx of blankIndices) {
    const blankCol = blankIdx % grid.cols
    const blankRow = Math.floor(blankIdx / grid.cols)

    // Collect IDs from: 8 neighbors, full row, and full column (real + already-assigned proxies)
    const adjacentIds = new Set<string>()
    const addSlot = (idx: number) => {
      const realId = slots[idx]
      if (realId != null) adjacentIds.add(realId)
      const proxyId = result.get(idx)
      if (proxyId !== undefined) adjacentIds.add(proxyId)
    }
    // 8 neighbors — toroidal: opposite edges are treated as adjacent
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const adjRow = ((blankRow + dr) % grid.rows + grid.rows) % grid.rows
        const adjCol = ((blankCol + dc) % grid.cols + grid.cols) % grid.cols
        addSlot(adjRow * grid.cols + adjCol)
      }
    }
    // Same row
    for (let c = 0; c < grid.cols; c++) {
      if (c !== blankCol) addSlot(blankRow * grid.cols + c)
    }
    // Same column
    for (let r = 0; r < grid.rows; r++) {
      if (r !== blankRow) addSlot(r * grid.cols + blankCol)
    }

    const minUsage = Math.min(...imageIds.map((id) => usageCount.get(id)!))

    // Prefer: least-used AND non-adjacent
    let candidates = imageIds.filter(
      (id) => usageCount.get(id) === minUsage && !adjacentIds.has(id)
    )
    // Relax adjacency if no valid candidate exists
    if (candidates.length === 0) {
      candidates = imageIds.filter((id) => usageCount.get(id) === minUsage)
    }
    if (candidates.length === 0) candidates = [...imageIds]

    const chosen = candidates[Math.floor(Math.random() * candidates.length)]
    result.set(blankIdx, chosen)
    usageCount.set(chosen, (usageCount.get(chosen) ?? 0) + 1)
  }

  return result
}
