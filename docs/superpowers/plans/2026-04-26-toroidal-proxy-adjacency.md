# Toroidal Proxy Adjacency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the 8-neighbor conflict check in `computeProxies` to wrap around grid edges so that tiles on opposite edges are treated as adjacent, correctly modelling a tiled/repeated export.

**Architecture:** Replace the bounds-check `continue` in the 8-neighbor loop with toroidal modulo arithmetic — no structural changes. The same-row and same-column checks are unchanged because they already cover every tile in those lines. Tests are added directly to the existing `computeProxies.test.ts`.

**Tech Stack:** TypeScript, Vitest.

---

## File Map

| File | Change |
|---|---|
| `src/lib/computeProxies.ts` | Replace bounds-check `continue` with `((x % n) + n) % n` modulo wrap in 8-neighbor loop |
| `src/lib/computeProxies.test.ts` | Add 3 deterministic wrapping test cases |

---

### Task 1: Toroidal 8-neighbor adjacency (TDD)

**Files:**
- Modify: `src/lib/computeProxies.ts` (the 8-neighbor loop, lines 46–54)
- Modify: `src/lib/computeProxies.test.ts` (append 3 new `it` blocks inside the existing `describe`)

- [ ] **Step 1: Write the failing tests**

Open `src/lib/computeProxies.test.ts` and append these three `it` blocks inside the existing `describe('computeProxies', () => { ... })`, before the closing `})`:

```ts
  it('treats right-edge diagonal tile as a wrapped neighbor of a left-edge blank', () => {
    // 2-row × 3-col grid:
    //   null  'b'  'a'    (row 0, indices 0-2)
    //   'b'   'b'  'c'    (row 1, indices 3-5)
    // Blank at (row=0, col=0). Without wrapping, 'c' at (row=1, col=2) is not adjacent.
    // With toroidal wrap, (dr=-1, dc=-1) → (row=1, col=2) = 'c', so 'c' becomes adjacent.
    // Adjacent IDs: {'a', 'b', 'c'}. Only 'd' is non-adjacent → proxy must be 'd'.
    const slots = [null, 'b', 'a', 'b', 'b', 'c']
    const ids = ['a', 'b', 'c', 'd']
    const result = computeProxies(slots, ids, { cols: 3, rows: 2 })
    expect(result.get(0)).toBe('d')
  })

  it('treats left-edge diagonal tile as a wrapped neighbor of a right-edge blank', () => {
    // 2-row × 3-col grid:
    //   'a'  'b'  null    (row 0, indices 0-2)
    //   'c'  'b'  'b'     (row 1, indices 3-5)
    // Blank at (row=0, col=2). Without wrapping, 'c' at (row=1, col=0) is not adjacent.
    // With toroidal wrap, (dr=-1, dc=+1) → col (3 % 3) = 0, row = 1 → 'c' is adjacent.
    // Adjacent IDs: {'a', 'b', 'c'}. Only 'd' is non-adjacent → proxy must be 'd'.
    const slots = ['a', 'b', null, 'c', 'b', 'b']
    const ids = ['a', 'b', 'c', 'd']
    const result = computeProxies(slots, ids, { cols: 3, rows: 2 })
    expect(result.get(2)).toBe('d')
  })

  it('treats the opposite corner as a wrapped diagonal neighbor of a corner blank', () => {
    // 3-row × 3-col grid:
    //   null  'b'  'b'    (row 0, indices 0-2)
    //   'b'   'b'  'b'    (row 1, indices 3-5)
    //   'b'   'b'  'a'    (row 2, indices 6-8)
    // Blank at (row=0, col=0). Without wrapping, 'a' at (row=2, col=2) is not adjacent.
    // With toroidal wrap, (dr=-1, dc=-1) → (row=2, col=2) = 'a', so 'a' becomes adjacent.
    // Adjacent IDs: {'a', 'b'}. Only 'c' is non-adjacent → proxy must be 'c'.
    const slots = [null, 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'a']
    const ids = ['a', 'b', 'c']
    const result = computeProxies(slots, ids, { cols: 3, rows: 3 })
    expect(result.get(0)).toBe('c')
  })
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/computeProxies.test.ts
```

Expected: the 3 new tests FAIL (the existing 9 tests should still pass). The new failures look like:
```
AssertionError: expected 'a' to be 'c'  (or 'd')
```

- [ ] **Step 3: Implement the fix**

In `src/lib/computeProxies.ts`, locate the 8-neighbor loop (currently around lines 46–54):

```ts
    // 8 neighbors
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const adjRow = blankRow + dr
        const adjCol = blankCol + dc
        if (adjRow < 0 || adjRow >= grid.rows || adjCol < 0 || adjCol >= grid.cols) continue
        addSlot(adjRow * grid.cols + adjCol)
      }
    }
```

Replace it with:

```ts
    // 8 neighbors — toroidal: opposite edges are treated as adjacent
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const adjRow = ((blankRow + dr) % grid.rows + grid.rows) % grid.rows
        const adjCol = ((blankCol + dc) % grid.cols + grid.cols) % grid.cols
        addSlot(adjRow * grid.cols + adjCol)
      }
    }
```

The `(x % n + n) % n` pattern is required because JavaScript's `%` operator returns negative values for negative operands (e.g., `-1 % 3 === -1`, not `2`).

- [ ] **Step 4: Run tests to confirm they all pass**

```bash
npx vitest run src/lib/computeProxies.test.ts
```

Expected: 12 tests PASS (9 existing + 3 new), 0 failures.

- [ ] **Step 5: Run the full suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/computeProxies.ts src/lib/computeProxies.test.ts
git commit -m "feat: toroidal 8-neighbor adjacency in computeProxies"
```
