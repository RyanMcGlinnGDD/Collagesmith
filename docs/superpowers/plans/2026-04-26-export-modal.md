# Export Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an export button to the header that opens a modal where the user configures output resolution (W×H, always proportional) and format (PNG/JPEG/WebP), then downloads the collage as an image file.

**Architecture:** Extract `getExportMimeType` and `getExportExtension` into a pure utility module, build `ExportModal` as a self-contained Mantine modal component that creates an offscreen canvas and triggers a browser download, then wire the button and modal into the existing `HomePage`.

**Tech Stack:** React 18, Mantine 7 (`Modal`, `NumberInput`, `SegmentedControl`, `Button`, `Stack`, `Group`, `Text`, `useDisclosure`), `@tabler/icons-react` (`IconDownload`), Vitest, existing `drawCollage` function.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/exportUtils.ts` | Create | Pure helpers: MIME type and file extension lookup |
| `src/lib/exportUtils.test.ts` | Create | Unit tests for the two helpers |
| `src/components/ExportModal.tsx` | Create | Modal UI + export/download handler |
| `src/routes/index.tsx` | Modify | Add `useDisclosure`, export `ActionIcon`, render `ExportModal` |

---

### Task 1: Export utility helpers (TDD)

**Files:**
- Create: `src/lib/exportUtils.ts`
- Create: `src/lib/exportUtils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/exportUtils.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/exportUtils.test.ts
```

Expected: FAIL — `Cannot find module './exportUtils'`

- [ ] **Step 3: Implement the utility**

Create `src/lib/exportUtils.ts`:

```ts
export type ExportFormat = 'png' | 'jpeg' | 'webp'

export function getExportMimeType(format: ExportFormat): string {
  switch (format) {
    case 'png': return 'image/png'
    case 'jpeg': return 'image/jpeg'
    case 'webp': return 'image/webp'
  }
}

export function getExportExtension(format: ExportFormat): string {
  switch (format) {
    case 'png': return 'png'
    case 'jpeg': return 'jpg'
    case 'webp': return 'webp'
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/exportUtils.test.ts
```

Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/exportUtils.ts src/lib/exportUtils.test.ts
git commit -m "feat: add export format utility helpers"
```

---

### Task 2: ExportModal component

**Files:**
- Create: `src/components/ExportModal.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/ExportModal.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Modal, Group, NumberInput, SegmentedControl, Button, Text, Stack } from '@mantine/core'
import { LoadedImage } from '../types'
import { GridLayout } from '../lib/gridLayout'
import { drawCollage } from '../lib/drawCollage'
import { ExportFormat, getExportMimeType, getExportExtension } from '../lib/exportUtils'

interface Props {
  opened: boolean
  onClose: () => void
  images: (LoadedImage | null)[]
  grid: GridLayout
  cropOffsets: Map<string, number>
  aspectRatio: number
}

export function ExportModal({ opened, onClose, images, grid, cropOffsets, aspectRatio }: Props) {
  const [width, setWidth] = useState(1920)
  const [height, setHeight] = useState(Math.round(1920 * aspectRatio))
  const [format, setFormat] = useState<ExportFormat>('png')

  // Reset to defaults whenever the modal opens
  useEffect(() => {
    if (!opened) return
    setWidth(1920)
    setHeight(Math.round(1920 * aspectRatio))
    setFormat('png')
  }, [opened]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleWidthChange = (v: number | string) => {
    if (typeof v !== 'number') return
    setWidth(v)
    setHeight(Math.round(v * aspectRatio))
  }

  const handleHeightChange = (v: number | string) => {
    if (typeof v !== 'number') return
    setHeight(v)
    setWidth(Math.round(v / aspectRatio))
  }

  const handleExport = () => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCollage(ctx, canvas, images, grid, cropOffsets)
    const mimeType = getExportMimeType(format)
    const quality = format === 'png' ? undefined : 0.92
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `collage.${getExportExtension(format)}`
      a.click()
      URL.revokeObjectURL(url)
      onClose()
    }, mimeType, quality)
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Export Collage" size="sm">
      <Stack gap="md">
        <div>
          <Text size="xs" c="dimmed" mb={6}>Resolution</Text>
          <Group gap="sm" align="flex-end">
            <NumberInput
              label="Width"
              value={width}
              onChange={handleWidthChange}
              min={1}
              style={{ flex: 1 }}
            />
            <Text mb={6}>×</Text>
            <NumberInput
              label="Height"
              value={height}
              onChange={handleHeightChange}
              min={1}
              style={{ flex: 1 }}
            />
          </Group>
          <Text size="xs" c="dimmed" mt={4}>🔒 Locked to canvas ratio</Text>
        </div>
        <div>
          <Text size="xs" c="dimmed" mb={6}>Format</Text>
          <SegmentedControl
            fullWidth
            value={format}
            onChange={(v) => setFormat(v as ExportFormat)}
            data={[
              { label: 'PNG', value: 'png' },
              { label: 'JPEG', value: 'jpeg' },
              { label: 'WebP', value: 'webp' },
            ]}
          />
        </div>
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport}>Export</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ExportModal.tsx
git commit -m "feat: add ExportModal component"
```

---

### Task 3: Wire export button into HomePage

**Files:**
- Modify: `src/routes/index.tsx`

The current header imports in `index.tsx`:
- Line 2: `import { AppShell, Box, Button, Group, NumberInput, Paper, Radio, Stack, Text, ActionIcon } from '@mantine/core'`
- Line 4: `import { IconArrowsShuffle, IconRefresh, IconPlus, IconTrash, IconUpload } from '@tabler/icons-react'`

- [ ] **Step 1: Add imports**

In `src/routes/index.tsx`, make these three changes:

**Add a new import line** after the existing `@mantine/hooks` import (or after line 5 if none exists yet):

```ts
import { useDisclosure } from '@mantine/hooks'
```

**Add `IconDownload`** to the existing tabler icons import:

```ts
import { IconArrowsShuffle, IconRefresh, IconPlus, IconTrash, IconUpload, IconDownload } from '@tabler/icons-react'
```

**Add `ExportModal` import** after the other component imports:

```ts
import { ExportModal } from '../components/ExportModal'
```

- [ ] **Step 2: Add disclosure state to HomePage**

Inside the `HomePage` function body, directly after the existing `const fileInputRef = ...` line, add:

```ts
const [exportOpened, { open: openExport, close: closeExport }] = useDisclosure(false)
```

- [ ] **Step 3: Add the export ActionIcon to the header**

In the header `<Group gap="xs">` (the one that contains the `IconPlus` and `IconTrash` buttons), add the export button **before** the trash `ActionIcon`:

```tsx
<ActionIcon
  variant="subtle"
  size="lg"
  onClick={openExport}
  aria-label="Export collage"
>
  <IconDownload size={18} />
</ActionIcon>
```

The full updated group should be:

```tsx
<Group gap="xs">
  <Text size="sm" c="dimmed">{images.length}</Text>
  <ActionIcon
    variant="subtle"
    size="lg"
    onClick={() => fileInputRef.current?.click()}
    aria-label="Add more images"
  >
    <IconPlus size={18} />
  </ActionIcon>
  <ActionIcon
    variant="subtle"
    size="lg"
    onClick={openExport}
    aria-label="Export collage"
  >
    <IconDownload size={18} />
  </ActionIcon>
  <ActionIcon
    variant="subtle"
    size="lg"
    color="red"
    onClick={handleReset}
    aria-label="Reset collage"
  >
    <IconTrash size={18} />
  </ActionIcon>
</Group>
```

- [ ] **Step 4: Render ExportModal in the JSX**

Inside the outer `<>` fragment, add `<ExportModal>` just before the closing `</>`. It passes `orderedForCanvas` (already computed as `const orderedForCanvas: (LoadedImage | null)[]`) as `images`:

```tsx
<ExportModal
  opened={exportOpened}
  onClose={closeExport}
  images={orderedForCanvas}
  grid={grid}
  cropOffsets={cropOffsets}
  aspectRatio={aspectRatio}
/>
```

- [ ] **Step 5: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Run full test suite**

```bash
npx vitest run
```

Expected: all tests PASS (including the new exportUtils tests)

- [ ] **Step 7: Manual smoke test**

Start the dev server:

```bash
npm run dev
```

1. Open the app, drop in 2+ images
2. Confirm the download icon appears in the header (right of the + button, left of the trash)
3. Click it — modal should open with Width=1920, Height computed from canvas AR
4. Change Width — Height should update proportionally
5. Change Height — Width should update proportionally
6. Select JPEG, click Export — a `collage.jpg` file should download
7. Select PNG, click Export — a `collage.png` file should download
8. Open a new image viewer and confirm the downloaded file looks correct
9. Click Cancel — modal closes, no download

- [ ] **Step 8: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: wire export button and modal into HomePage"
```
