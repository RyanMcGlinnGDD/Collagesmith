# Toroidal Proxy Adjacency — Design Spec

**Date:** 2026-04-26

## Overview

Update `computeProxies` so that blank slots on the edges of the canvas grid treat tiles on the opposite edge as neighbors. This reflects the fact that the exported collage may be tiled (repeated), so an image appearing on both the right edge and the left edge of adjacent copies would be visually adjacent.

## Algorithm Change

### File: `src/lib/computeProxies.ts`

**Current behavior:** The 8-neighbor loop skips any neighbor whose row or column falls outside the grid bounds:

```ts
if (adjRow < 0 || adjRow >= grid.rows || adjCol < 0 || adjCol >= grid.cols) continue
addSlot(adjRow * grid.cols + adjCol)
```

**New behavior:** Replace the bounds-check skip with toroidal (wrapping) modulo arithmetic. Every neighbor is valid — out-of-bounds coordinates wrap to the opposite edge:

```ts
const adjRow = ((blankRow + dr) % grid.rows + grid.rows) % grid.rows
const adjCol = ((blankCol + dc) % grid.cols + grid.cols) % grid.cols
addSlot(adjRow * grid.cols + adjCol)
```

The double-modulo pattern (`(x % n + n) % n`) handles negative values correctly in JavaScript, which is necessary for `dr = -1` or `dc = -1` when the blank is at row 0 or column 0.

### Corner behavior

For a blank slot at the top-left corner (row=0, col=0), the neighbor at offset `(dr=-1, dc=-1)` wraps to `(rows-1, cols-1)` — the bottom-right corner. All three opposite corners and the two wrapped edge neighbors are included, correctly modelling a tiled grid.

### Same-row / same-column checks

These are unchanged. They already iterate every tile in the row and column unconditionally, so wrapping adds nothing.

## What Does Not Change

- The proxy selection algorithm (round-robin, usage-count balancing, adjacency relaxation fallback)
- The function signature and return type
- The same-row and same-column conflict checks
- All callers (`src/routes/index.tsx`)

## Tests

### File: `src/lib/computeProxies.test.ts`

Add test cases covering:

1. **Left-edge blank** — the tile on the right edge of the same row is a wrapped neighbor and must not be selected as proxy if a non-adjacent alternative exists.
2. **Right-edge blank** — symmetric case; left-edge tile is a wrapped neighbor.
3. **Top-left corner blank** — the bottom-right corner tile is a wrapped diagonal neighbor.
4. **Single-row grid** — left/right wrapping works without selecting the same tile as its own neighbor (a tile at `(0,0)` with `dc=+1` in a 1-column grid would wrap back to `(0,0)`, which is fine since it's a blank slot and `addSlot` would just find no ID there).

## Files Changed

| File | Change |
|---|---|
| `src/lib/computeProxies.ts` | Replace bounds-check `continue` with toroidal modulo in the 8-neighbor loop |
| `src/lib/computeProxies.test.ts` | Add 4 wrapping test cases |
