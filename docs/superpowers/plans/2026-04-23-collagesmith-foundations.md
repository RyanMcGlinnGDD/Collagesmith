# Collagesmith Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a Vite + React + TypeScript SPA that lets users drop image files onto a page and renders them as a center-cropped uniform-grid collage on a 16:9 canvas.

**Architecture:** Code-based TanStack Router with one route. A single `useState<LoadedImage[]>` in `HomePage` drives conditional rendering between a Mantine Dropzone (empty state) and a canvas (loaded state). All draw logic lives in pure functions in `src/lib/` so they are testable without React.

**Tech Stack:** Vite 6, React 18 + TypeScript 5, Mantine v7, TanStack Router v1, Vitest + jsdom, native HTML5 Canvas API.

---

## File Map

| File | Purpose |
|---|---|
| `index.html` | Entry HTML |
| `vite.config.ts` | Vite + Vitest config |
| `tsconfig.json` | TypeScript config |
| `tsconfig.node.json` | Node-context TS config (for vite.config.ts) |
| `.gitignore` | Ignores node_modules, dist, .superpowers |
| `src/main.tsx` | Creates router, renders `<MantineProvider>` + `<RouterProvider>` |
| `src/types.ts` | `LoadedImage` interface |
| `src/routes/__root.tsx` | Pass-through: renders `<Outlet />` only |
| `src/routes/index.tsx` | `HomePage` — owns `useState<LoadedImage[]>`, renders AppShell with header |
| `src/components/DropZoneArea.tsx` | Mantine Dropzone wrapper; calls `loadImages`, emits `LoadedImage[]` |
| `src/components/CollageCanvas.tsx` | Canvas + ResizeObserver + draw effect (no "Add more" button — that lives in the header) |
| `src/lib/gridLayout.ts` | Pure fn: `(n) → { cols, rows }` |
| `src/lib/drawCollage.ts` | Pure fn: clears canvas, center-crops + draws each tile |
| `src/lib/loadImages.ts` | `File[] → Promise<LoadedImage[]>` via `createObjectURL` |
| `src/test/setup.ts` | Vitest setup: imports `@testing-library/jest-dom` |
| `src/lib/gridLayout.test.ts` | Unit tests for gridLayout |
| `src/lib/drawCollage.test.ts` | Unit tests for getCropParams + drawCollage |

---

## Task 1: Project Scaffold

**Files:**
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `.gitignore`

- [ ] **Step 1: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Collagesmith</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Write `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Write `.gitignore`**

```
node_modules
dist
.superpowers
```

- [ ] **Step 6: Commit**

```bash
git add index.html vite.config.ts tsconfig.json tsconfig.node.json .gitignore
git commit -m "chore: add project config files"
```

---

## Task 2: Install Dependencies

**Files:** `package.json` (created by npm init + installs)

- [ ] **Step 1: Initialise package.json**

```bash
npm init -y
```

Update the generated `package.json` so it contains exactly:

```json
{
  "name": "collagesmith",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install react react-dom @mantine/core @mantine/hooks @mantine/dropzone @tabler/icons-react @tanstack/react-router
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 4: Verify install**

```bash
npm list --depth=0
```

Expected: no peer dependency errors. `react`, `@mantine/core`, `@tanstack/react-router`, `vitest` all listed.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add npm dependencies"
```

---

## Task 3: Types + Test Infrastructure

**Files:**
- Create: `src/types.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Write `src/types.ts`**

```ts
export interface LoadedImage {
  id: string
  element: HTMLImageElement
  name: string
}
```

- [ ] **Step 2: Write `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Verify Vitest runs (no tests yet)**

```bash
npm test
```

Expected output contains: `No test files found` or exits 0 with 0 tests.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/test/setup.ts
git commit -m "chore: add shared types and test setup"
```

---

## Task 4: gridLayout (TDD)

**Files:**
- Create: `src/lib/gridLayout.ts`
- Create: `src/lib/gridLayout.test.ts`

- [ ] **Step 1: Write `src/lib/gridLayout.test.ts`**

```ts
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module './gridLayout'`

- [ ] **Step 3: Write `src/lib/gridLayout.ts`**

```ts
export interface GridLayout {
  cols: number
  rows: number
}

export function gridLayout(n: number): GridLayout {
  if (n === 0) return { cols: 0, rows: 0 }
  const cols = Math.ceil(Math.sqrt(n))
  const rows = Math.ceil(n / cols)
  return { cols, rows }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: PASS — 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/gridLayout.ts src/lib/gridLayout.test.ts
git commit -m "feat: add gridLayout pure function with tests"
```

---

## Task 5: drawCollage (TDD)

**Files:**
- Create: `src/lib/drawCollage.ts`
- Create: `src/lib/drawCollage.test.ts`

The two exported symbols are `getCropParams` (the math — pure, no canvas) and `drawCollage` (uses the canvas context).

- [ ] **Step 1: Write `src/lib/drawCollage.test.ts`**

```ts
import { getCropParams, drawCollage } from './drawCollage'
import { GridLayout } from './gridLayout'
import { LoadedImage } from '../types'

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

  function makeImage(naturalWidth: number, naturalHeight: number): LoadedImage {
    return {
      id: '1',
      name: 'test.jpg',
      element: { naturalWidth, naturalHeight } as HTMLImageElement,
    }
  }

  it('fills the canvas black before drawing', () => {
    const ctx = makeCtx()
    drawCollage(ctx, makeCanvas(320, 180), [], { cols: 0, rows: 0 })
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

  it('skips drawing for empty trailing slots', () => {
    const ctx = makeCtx()
    // 3 images in a 2×2 grid → 4 slots, only 3 drawn
    const images = [makeImage(100, 100), makeImage(100, 100), makeImage(100, 100)]
    drawCollage(ctx, makeCanvas(320, 180), images, { cols: 2, rows: 2 })
    expect(ctx.drawImage).toHaveBeenCalledTimes(3)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module './drawCollage'`

- [ ] **Step 3: Write `src/lib/drawCollage.ts`**

```ts
import { LoadedImage } from '../types'
import { GridLayout } from './gridLayout'

export function getCropParams(
  iw: number,
  ih: number,
  tw: number,
  th: number
): { sx: number; sy: number; sw: number; sh: number } {
  const scale = Math.max(tw / iw, th / ih)
  const sw = tw / scale
  const sh = th / scale
  const sx = (iw - sw) / 2
  const sy = (ih - sh) / 2
  return { sx, sy, sw, sh }
}

export function drawCollage(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  images: LoadedImage[],
  grid: GridLayout
): void {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (grid.cols === 0 || grid.rows === 0) return

  const tileW = canvas.width / grid.cols
  const tileH = canvas.height / grid.rows

  images.forEach((image, i) => {
    const col = i % grid.cols
    const row = Math.floor(i / grid.cols)
    const { sx, sy, sw, sh } = getCropParams(
      image.element.naturalWidth,
      image.element.naturalHeight,
      tileW,
      tileH
    )
    ctx.drawImage(image.element, sx, sy, sw, sh, col * tileW, row * tileH, tileW, tileH)
  })
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm test
```

Expected: PASS — all tests in gridLayout and drawCollage pass (13 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/lib/drawCollage.ts src/lib/drawCollage.test.ts
git commit -m "feat: add drawCollage pure function with tests"
```

---

## Task 6: loadImages

**Files:**
- Create: `src/lib/loadImages.ts`

No unit tests — this function is a thin wrapper over browser APIs (`URL.createObjectURL`, `Image`). Correctness is verified by the smoke test in Task 12.

- [ ] **Step 1: Write `src/lib/loadImages.ts`**

```ts
import { LoadedImage } from '../types'

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Failed to load image: ${file.name}`))
    }
    img.src = url
  })
}

export async function loadImages(files: File[]): Promise<LoadedImage[]> {
  return Promise.all(
    files.map(async (file) => {
      const element = await loadImageElement(file)
      return {
        id: crypto.randomUUID(),
        element,
        name: file.name,
      }
    })
  )
}
```

- [ ] **Step 2: Run tests — verify nothing broke**

```bash
npm test
```

Expected: PASS — same 13 tests, all green.

- [ ] **Step 3: Commit**

```bash
git add src/lib/loadImages.ts
git commit -m "feat: add loadImages browser utility"
```

---

## Task 7: Root Layout

**Files:**
- Create: `src/routes/__root.tsx`

`__root.tsx` is a pass-through. The AppShell and header live in `HomePage` so that the "Add more" button has direct access to `images` state.

- [ ] **Step 1: Write `src/routes/__root.tsx`**

```tsx
import { Outlet } from '@tanstack/react-router'

export function RootLayout() {
  return <Outlet />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/__root.tsx
git commit -m "feat: add root layout pass-through"
```

---

## Task 8: DropZoneArea Component

**Files:**
- Create: `src/components/DropZoneArea.tsx`

- [ ] **Step 1: Write `src/components/DropZoneArea.tsx`**

```tsx
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone'
import { Group, Text, rem } from '@mantine/core'
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react'
import { loadImages } from '../lib/loadImages'
import { LoadedImage } from '../types'

interface Props {
  onFiles: (images: LoadedImage[]) => void
}

export function DropZoneArea({ onFiles }: Props) {
  const handleDrop = async (files: File[]) => {
    const loaded = await loadImages(files)
    onFiles(loaded)
  }

  return (
    <Dropzone
      onDrop={handleDrop}
      accept={IMAGE_MIME_TYPE}
      style={{ height: '100%' }}
    >
      <Group
        justify="center"
        align="center"
        gap="xl"
        style={{ minHeight: 300, pointerEvents: 'none' }}
      >
        <Dropzone.Accept>
          <IconUpload style={{ width: rem(52), height: rem(52) }} stroke={1.5} />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX style={{ width: rem(52), height: rem(52) }} stroke={1.5} />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconPhoto style={{ width: rem(52), height: rem(52) }} stroke={1.5} />
        </Dropzone.Idle>
        <div>
          <Text size="xl" inline>
            Drop images here or click to select
          </Text>
          <Text size="sm" c="dimmed" inline mt={7}>
            Any number of images — they'll be tiled into a 16:9 collage
          </Text>
        </div>
      </Group>
    </Dropzone>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DropZoneArea.tsx
git commit -m "feat: add DropZoneArea component"
```

---

## Task 9: CollageCanvas Component

**Files:**
- Create: `src/components/CollageCanvas.tsx`

`CollageCanvas` only handles the canvas. The "Add more" file input is owned by `HomePage` (Task 10) so it can live in the header.

- [ ] **Step 1: Write `src/components/CollageCanvas.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { Box } from '@mantine/core'
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
      setCanvasSize({ width, height: Math.round(width * 9 / 16) })
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
    <Box ref={containerRef} style={{ width: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CollageCanvas.tsx
git commit -m "feat: add CollageCanvas component with ResizeObserver and draw effect"
```

---

## Task 10: HomePage Route

**Files:**
- Create: `src/routes/index.tsx`

`HomePage` owns the full layout (AppShell + header) so the "Add more" button in the header has direct access to `images` state and the hidden file input ref.

- [ ] **Step 1: Write `src/routes/index.tsx`**

```tsx
import { useState, useCallback, useRef } from 'react'
import { AppShell, Group, Text, ActionIcon } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { LoadedImage } from '../types'
import { DropZoneArea } from '../components/DropZoneArea'
import { CollageCanvas } from '../components/CollageCanvas'
import { loadImages } from '../lib/loadImages'

export function HomePage() {
  const [images, setImages] = useState<LoadedImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((loaded: LoadedImage[]) => {
    setImages((prev) => [...prev, ...loaded])
  }, [])

  const handleAddMoreChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length === 0) return
      const loaded = await loadImages(files)
      handleFiles(loaded)
      e.target.value = ''
    },
    [handleFiles]
  )

  return (
    <AppShell header={{ height: 56 }}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text fw={700} size="lg">Collagesmith</Text>
          {images.length > 0 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleAddMoreChange}
              />
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Add more images"
              >
                <IconPlus size={18} />
              </ActionIcon>
            </>
          )}
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        {images.length === 0
          ? <DropZoneArea onFiles={handleFiles} />
          : <CollageCanvas images={images} />}
      </AppShell.Main>
    </AppShell>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: add HomePage with AppShell, conditional dropzone/canvas, and Add More header button"
```

---

## Task 11: main.tsx Wiring

**Files:**
- Create: `src/main.tsx`

- [ ] **Step 1: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { MantineProvider } from '@mantine/core'
import { RootLayout } from './routes/__root'
import { HomePage } from './routes/index'
import '@mantine/core/styles.css'
import '@mantine/dropzone/styles.css'

const rootRoute = createRootRoute({ component: RootLayout })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute]) })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>
  </StrictMode>
)
```

- [ ] **Step 2: Commit**

```bash
git add src/main.tsx
git commit -m "feat: wire up router and Mantine provider in main.tsx"
```

---

## Task 12: Smoke Test

- [ ] **Step 1: Run the test suite one final time**

```bash
npm test
```

Expected: PASS — 13 tests, all green, no TypeScript errors from test files.

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```

Expected: Vite server starts, prints a localhost URL, no compile errors.

- [ ] **Step 3: Manual verification in browser**

Open the printed localhost URL. Verify:
1. Page loads with "Collagesmith" header and a dashed dropzone
2. Drop 1 image → dropzone disappears, canvas fills the page with the single image
3. Drop 2 images at once → canvas shows a 2×1 grid, each image center-cropped to 16:9
4. Drop 4 images at once → canvas shows a 2×2 grid
5. Drop 5 images at once → canvas shows a 3×2 grid with one black empty cell (bottom-right)
6. Click the "+" button (top-right of canvas) → file picker opens, adding images appends to the grid
7. Resize the browser window → canvas redraws to fit the new width while maintaining 16:9

- [ ] **Step 4: Commit**

No new files — final commit is the smoke test confirmation. If any issues were found and fixed in Step 3, commit those fixes now.
