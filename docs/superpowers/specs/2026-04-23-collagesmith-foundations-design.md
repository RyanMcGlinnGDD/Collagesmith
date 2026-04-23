# Collagesmith Foundations — Design Spec
**Date:** 2026-04-23  
**Scope:** Initial SPA scaffold with image loading and 16:9 canvas collage rendering

---

## Overview

Collagesmith is a browser-only single-page application where users load image files and see them rendered as a uniform-grid collage on a 16:9 canvas. No server, no uploads, no persistence. This spec covers the foundational build: loading, rendering, and display only.

Out of scope for this build: image export/download, tile reordering, removing individual images, per-image crop adjustment.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Bundler | Vite |
| Framework | React + TypeScript |
| UI library | Mantine v7 |
| Routing | TanStack Router v1 |
| State | React `useState` |
| Canvas | Native HTML5 Canvas API |

---

## Architecture

Single-page app with one route (`/`). TanStack Router is included for extensibility but the app starts with one page. No context, no store — a single `useState<LoadedImage[]>` in the root page component is the source of truth.

The canvas is rendered with the native HTML5 Canvas API. No canvas library is used. All draw logic is extracted into pure functions in `lib/` so they can be tested in isolation and reused for future export.

---

## Component Structure

```
src/
  main.tsx                  → RouterProvider setup
  types.ts                  → shared types
  routes/
    __root.tsx              → root layout (Mantine AppShell, header)
    index.tsx               → HomePage — owns useState<LoadedImage[]>
  components/
    DropZoneArea.tsx         → Mantine Dropzone; visible when images.length === 0
    CollageCanvas.tsx        → canvas element + ResizeObserver + draw effect; visible when images.length > 0
  lib/
    loadImages.ts            → File[] → Promise<LoadedImage[]>
    gridLayout.ts            → (n: number) → { cols: number, rows: number }
    drawCollage.ts           → (ctx, images, grid) → void — pure, synchronous
```

### Key boundaries

- `drawCollage` and `gridLayout` are pure functions with no React dependencies. They receive only what they need and produce no side effects beyond writing to the canvas context passed in.
- `CollageCanvas` is the only component that owns a canvas ref, a ResizeObserver, and calls into the lib functions. It is the sole bridge between React state and canvas rendering.
- `DropZoneArea` and `CollageCanvas` are mutually exclusive in the DOM — `HomePage` conditionally renders one or the other based on `images.length`.

---

## Data Model

```ts
// types.ts
interface LoadedImage {
  id: string;               // crypto.randomUUID()
  element: HTMLImageElement;
  name: string;             // original filename
}
```

---

## Data Flow

### Image loading
1. User drops files or uses the file picker in `DropZoneArea`
2. Mantine Dropzone yields `File[]`
3. `loadImages(files)` maps each `File` to a `LoadedImage`:
   - `URL.createObjectURL(file)` → assign to `new Image().src`
   - await `image.onload`
   - return `{ id: crypto.randomUUID(), element, name: file.name }`
4. `HomePage` appends resolved images to state → `DropZoneArea` unmounts, `CollageCanvas` mounts

### Canvas rendering
1. `CollageCanvas` mounts → a `ResizeObserver` watches the container `div`
2. On resize: `canvas.width` and `canvas.height` are set to fill the container at 16:9 (width matches container, height = width × 9/16)
3. `useEffect([images, canvasSize])` → calls `drawCollage(ctx, images, gridLayout(images.length))`
4. `drawCollage` iterates each tile slot:
   - Tile rect: `{ x: col * tileW, y: row * tileH, w: tileW, h: tileH }`
   - For each occupied slot, calls `ctx.drawImage` with a center-crop source rect
   - Empty trailing slots (odd image counts) are left as canvas background (black)

### Center crop calculation
Given image natural dimensions `(iw, ih)` and tile dimensions `(tw, th)`:
- Scale factor: `scale = max(tw / iw, th / ih)`
- Scaled image size: `(iw * scale, ih * scale)`
- Source crop rect: `sx = (iw - tw/scale) / 2`, `sy = (ih - th/scale) / 2`, `sw = tw/scale`, `sh = th/scale`
- Draw: `ctx.drawImage(img, sx, sy, sw, sh, tileX, tileY, tw, th)`

No intermediate offscreen canvas needed — `drawImage` handles the crop and scale in one call.

---

## Grid Layout Algorithm

```ts
// gridLayout.ts
function gridLayout(n: number): { cols: number; rows: number } {
  if (n === 0) return { cols: 0, rows: 0 };
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  return { cols, rows };
}
```

| N | cols | rows | empty |
|---|------|------|-------|
| 1 | 1 | 1 | 0 |
| 2 | 2 | 1 | 0 |
| 3 | 2 | 2 | 1 |
| 4 | 2 | 2 | 0 |
| 5 | 3 | 2 | 1 |
| 6 | 3 | 2 | 0 |
| 7 | 3 | 3 | 2 |
| 9 | 3 | 3 | 0 |

---

## UI Layout

- **Empty state:** Full-page centered Mantine Dropzone with dashed border, icon, and "Drop images or click to select" label. Accepts `image/*` MIME types.
- **Loaded state:** Canvas fills the main content area.
- **Header:** Minimal — app name "Collagesmith" on the left, "Add more" `ActionIcon` on the right (only visible once images are loaded). Clicking it opens the native file picker to append more images.
- **Canvas background:** Black (`#000000`).
- **App background:** Mantine default dark or light theme — no custom theme required for foundations.

---

## Future Considerations (not in scope)

- **Export:** `canvas.toBlob()` → download link. Pure functions in `lib/` already make this straightforward to add.
- **Tile reordering:** Drag-and-drop on canvas tiles. Would require hit-testing and a tile index in state.
- **Per-image crop adjustment:** Store a `cropOffset: { x: number, y: number }` per `LoadedImage`. `drawCollage` already isolates the crop calc per tile.
- **Smart fill / balanced rows layout:** Alternative layout algorithms can be added to `lib/gridLayout.ts` and selected via a control.
- **Image removal:** Add a `removeImage(id)` handler in `HomePage`, surface as a hover action on tiles.
- **Zustand migration:** If state grows (crop offsets, layout config, export settings), extract `useState` to a Zustand store — the pure lib functions require no changes.
