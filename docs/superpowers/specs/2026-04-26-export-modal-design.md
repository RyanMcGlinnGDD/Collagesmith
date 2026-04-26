# Export Modal — Design Spec

**Date:** 2026-04-26

## Overview

Add an export button to the collage app header that opens a modal where the user can configure output resolution and format, then download the collage as an image file.

## Feature Details

### Export Button

- Added to the `AppShell.Header` in `src/routes/index.tsx`
- Only visible when `images.length > 0` (same condition as the existing trash/add buttons)
- Positioned to the left of the trash icon in the existing `Group`
- Uses `IconDownload` from `@tabler/icons-react`, styled as `ActionIcon` with `variant="subtle"`
- Modal open/close state managed via Mantine's `useDisclosure` hook, wired to the button's `onClick`

### ExportModal Component

**File:** `src/components/ExportModal.tsx`

**Props:**
```ts
interface Props {
  opened: boolean
  onClose: () => void
  images: (LoadedImage | null)[]
  grid: GridLayout
  cropOffsets: Map<string, number>
  aspectRatio: number  // canvas H/W ratio (height / width)
}
```

**Internal state:**
- `width: number` — default `1920`
- `height: number` — default `Math.round(1920 * aspectRatio)`
- `format: 'png' | 'jpeg' | 'webp'` — default `'png'`

**Resolution inputs:**
- Two `NumberInput` fields (Width and Height), rendered side-by-side
- Always linked: changing width recalculates `height = Math.round(newWidth * aspectRatio)`; changing height recalculates `width = Math.round(newHeight / aspectRatio)`
- No lock toggle — always proportional, with a small locked-ratio label below (e.g. "🔒 Locked to canvas ratio")
- Minimum value: `1` for both

**Format selector:**
- Segmented control (`SegmentedControl` from Mantine) with three options: `PNG`, `JPEG`, `WebP`
- Values map to MIME types: `image/png`, `image/jpeg`, `image/webp`

**Footer buttons:**
- Cancel — closes modal, no action
- Export — triggers download, then closes modal

### Export Logic

Runs inside the modal's Export button handler:

1. Create an offscreen `HTMLCanvasElement` (not appended to DOM)
2. Set `canvas.width = width`, `canvas.height = height`
3. Get `ctx = canvas.getContext('2d')`
4. Call existing `drawCollage(ctx, canvas, images, grid, cropOffsets)`
5. Call `canvas.toBlob(callback, mimeType, quality)`:
   - PNG: no quality argument (lossless)
   - JPEG / WebP: quality `0.92`
6. In the callback: create a temporary anchor element, set `href` to `URL.createObjectURL(blob)`, set `download` to `collage.png` / `collage.jpg` / `collage.webp`, click it, then `URL.revokeObjectURL`
7. Close the modal after triggering the download

## Files Changed

| File | Change |
|---|---|
| `src/components/ExportModal.tsx` | New component |
| `src/routes/index.tsx` | Add `useDisclosure`, export button, wire modal |

## Out of Scope

- JPEG/WebP quality slider (fixed at 0.92)
- Custom filename entry
- Export progress indicator
- Multiple file export
