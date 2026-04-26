import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { AppShell, Box, Button, Group, NumberInput, Paper, Radio, Stack, Text, ActionIcon } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone'
import { IconArrowsShuffle, IconRefresh, IconPlus, IconTrash, IconUpload, IconDownload } from '@tabler/icons-react'
import { modals } from '@mantine/modals'
import { LoadedImage } from '../types'
import { DropZoneArea } from '../components/DropZoneArea'
import { CollageCanvas } from '../components/CollageCanvas'
import { ImageList } from '../components/ImageList'
import { ExportModal } from '../components/ExportModal'
import { loadImages } from '../lib/loadImages'
import { computeProxies } from '../lib/computeProxies'

type TileAspectRatio = '16:9' | '4:3' | '1:1' | 'custom'

/** Returns the column count whose canvas aspect ratio is closest to 16:9. */
function bestCols(n: number, tileAR: number): number {
  if (n <= 0) return 1
  let best = 1
  let bestDiff = Infinity
  for (let c = 1; c <= n; c++) {
    const r = Math.ceil(n / c)
    const diff = Math.abs((c * tileAR) / r - 16 / 9)
    if (diff < bestDiff) { bestDiff = diff; best = c }
  }
  return best
}

export function HomePage() {
  const [images, setImages] = useState<LoadedImage[]>([])
  const [cols, setCols] = useState(1)
  const [tileAR, setTileAR] = useState<TileAspectRatio>('16:9')
  const [customARWidth, setCustomARWidth] = useState(16)
  const [customARHeight, setCustomARHeight] = useState(9)
  const [gapHandling, setGapHandling] = useState<'blank' | 'duplicate'>('blank')
  // null = natural insertion order; array = explicit slot layout (null entries are blank slots)
  const [canvasSlots, setCanvasSlots] = useState<(string | null)[] | null>(null)
  // slot index → proxy image ID (only populated in duplicate mode)
  const [proxyMap, setProxyMap] = useState<Map<number, string>>(new Map())
  const [cropOffsets, setCropOffsets] = useState<Map<string, number>>(new Map())
  const [proxyVersion, setProxyVersion] = useState(0)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const [exportOpened, { open: openExport, close: closeExport }] = useDisclosure(false)

  const tileARValue =
    tileAR === '16:9' ? 16 / 9 :
    tileAR === '4:3' ? 4 / 3 :
    tileAR === '1:1' ? 1 :
    Math.max(0.01, customARWidth) / Math.max(0.01, customARHeight)
  const clampedCols = Math.max(1, Math.min(cols, images.length || 1))
  const rows = images.length === 0 ? 0 : Math.ceil(images.length / clampedCols)
  const grid = { cols: clampedCols, rows }
  // Canvas H/W = rows / (cols * tileAR)
  const aspectRatio = rows > 0 ? rows / (clampedCols * tileARValue) : 9 / 16

  const totalSlots = grid.cols * grid.rows

  // Full slot layout with explicit blank entries, padded/clamped to current grid size
  const normalizedSlots = useMemo<(string | null)[]>(() => {
    const base = canvasSlots ?? images.map((img) => img.id)
    const padded = [...base]
    while (padded.length < totalSlots) padded.push(null)
    return padded.slice(0, totalSlots)
  }, [canvasSlots, images, totalSlots])

  const imageMap = useMemo(
    () => new Map(images.map((img) => [img.id, img])),
    [images]
  )

  // Recompute proxy assignments whenever layout, images, or slot arrangement changes
  useEffect(() => {
    if (gapHandling !== 'duplicate') {
      setProxyMap(new Map())
      return
    }
    const g = { cols: grid.cols, rows: grid.rows }
    setProxyMap(computeProxies(normalizedSlots, images.map((img) => img.id), g))
  }, [gapHandling, normalizedSlots, images, grid.cols, grid.rows, proxyVersion])

  // What the canvas draws: real images in their slots, proxies (or null) in blank slots
  const orderedForCanvas: (LoadedImage | null)[] = normalizedSlots.map((id, i) => {
    if (id !== null) return imageMap.get(id) ?? null
    if (gapHandling === 'duplicate') {
      const proxyId = proxyMap.get(i)
      return proxyId ? (imageMap.get(proxyId) ?? null) : null
    }
    return null
  })

  useEffect(() => {
    if (images.length === 0) {
      dragCounterRef.current = 0
      setIsDraggingOver(false)
      return
    }

    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      dragCounterRef.current++
      setIsDraggingOver(true)
    }
    const onDragLeave = () => {
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
      if (dragCounterRef.current === 0) setIsDraggingOver(false)
    }
    const onDragOver = (e: DragEvent) => e.preventDefault()
    const onDrop = () => {
      dragCounterRef.current = 0
      setIsDraggingOver(false)
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [images.length])

  const handleFiles = useCallback((loaded: LoadedImage[]) => {
    setImages((prev) => {
      const next = [...prev, ...loaded]
      if (prev.length === 0) {
        // First load: pick the column count closest to 16:9 for the selected tile AR
        setCols(bestCols(next.length, tileARValue))
      }
      return next
    })
    setCanvasSlots((prev) => {
      if (prev === null) return null
      const slots = [...prev]
      let idx = 0
      for (let i = 0; i < slots.length && idx < loaded.length; i++) {
        if (slots[i] === null) { slots[i] = loaded[idx].id; idx++ }
      }
      while (idx < loaded.length) { slots.push(loaded[idx].id); idx++ }
      return slots
    })
  }, [tileARValue])

  const handleTileARChange = useCallback((value: string) => {
    setTileAR(value as TileAspectRatio)
  }, [])

  const handleRandomize = useCallback(() => {
    setImages((prev) => {
      const slots: (string | null)[] = [
        ...prev.map((img) => img.id),
        ...Array<null>(Math.max(0, clampedCols * rows - prev.length)).fill(null),
      ]
      for (let i = slots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]]
      }
      setCanvasSlots(slots)
      return prev
    })
  }, [clampedCols, rows])

  const handleReset = useCallback(() => {
    modals.openConfirmModal({
      title: 'Reset collage',
      children: 'All loaded images will be removed. Are you sure?',
      labels: { confirm: 'Reset', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        setImages((prev) => { prev.forEach((img) => URL.revokeObjectURL(img.url)); return [] })
        setCanvasSlots(null)
        setCropOffsets(new Map())
      },
    })
  }, [])

  const handleCropOffsetChange = useCallback((id: string, offset: number) => {
    setCropOffsets((prev) => new Map(prev).set(id, offset))
  }, [])

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((img) => img.id !== id)
    })
    setCanvasSlots((prev) => {
      if (prev === null) return null
      return prev.map((slot) => (slot === id ? null : slot))
    })
    setCropOffsets((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const handleAddMoreChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target
      const files = Array.from(input.files ?? [])
      if (files.length === 0) return
      try {
        const loaded = await loadImages(files)
        handleFiles(loaded)
      } catch (err) {
        console.error('Failed to load images:', err)
      }
      input.value = ''
    },
    [handleFiles]
  )

  const handleOverlayDrop = useCallback(async (files: File[]) => {
    setIsDraggingOver(false)
    dragCounterRef.current = 0
    try {
      const loaded = await loadImages(files)
      handleFiles(loaded)
    } catch (err) {
      console.error('Failed to load dropped images:', err)
    }
  }, [handleFiles])

  return (
    <>
      {isDraggingOver && (
        <Dropzone
          onDrop={handleOverlayDrop}
          accept={IMAGE_MIME_TYPE}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            border: 'none',
            borderRadius: 0,
          }}
        >
          <Group justify="center" align="center" gap="md" style={{ pointerEvents: 'none' }}>
            <IconUpload size={48} color="white" />
            <Text c="white" size="xl" fw={600}>Drop images to add them</Text>
          </Group>
        </Dropzone>
      )}
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
              </>
            )}
          </Group>
        </AppShell.Header>
        <AppShell.Main style={{ display: 'flex', flexDirection: 'column' }}>
          {images.length === 0
            ? <DropZoneArea onFiles={handleFiles} />
            : (
              <Stack gap="md" p="md">
                <Group align="flex-start" gap="md" wrap="nowrap" style={{ maxWidth: 1060, margin: '0 auto', width: '100%' }}>
                  <Paper withBorder p="md" style={{ width: 160, flexShrink: 0 }}>
                    <Stack gap={0}>
                      <Button
                        variant="light"
                        size="xs"
                        fullWidth
                        leftSection={<IconArrowsShuffle size={14} />}
                        onClick={handleRandomize}
                        mb="md"
                      >
                        Randomize
                      </Button>
                      <NumberInput
                        label="Columns"
                        labelProps={{ fw: 'normal' }}
                        value={clampedCols}
                        onChange={(v) => typeof v === 'number' && setCols(v)}
                        min={1}
                        max={images.length || 1}
                      />
                      <Radio.Group
                        mt="md"
                        label="Tile Aspect Ratio"
                        value={tileAR}
                        onChange={handleTileARChange}
                      >
                        <Stack gap="xs" mt={4}>
                          <Radio value="16:9" label="16:9" />
                          <Radio value="4:3" label="4:3" />
                          <Radio value="1:1" label="1:1" />
                          <Radio value="custom" label="Custom" />
                        </Stack>
                      </Radio.Group>
                      <Group gap={4} mt={4} wrap="nowrap">
                        <NumberInput
                          style={{ flex: 1, minWidth: 0 }}
                          size="xs"
                          value={customARWidth}
                          onChange={(v) => typeof v === 'number' && setCustomARWidth(v)}
                          disabled={tileAR !== 'custom'}
                          min={1}
                        />
                        <Text size="xs" style={{ alignSelf: 'center', flexShrink: 0 }}>:</Text>
                        <NumberInput
                          style={{ flex: 1, minWidth: 0 }}
                          size="xs"
                          value={customARHeight}
                          onChange={(v) => typeof v === 'number' && setCustomARHeight(v)}
                          disabled={tileAR !== 'custom'}
                          min={1}
                        />
                      </Group>
                      <Radio.Group
                        mt="md"
                        label="Gap Handling"
                        value={gapHandling}
                        onChange={(v) => setGapHandling(v as 'blank' | 'duplicate')}
                      >
                        <Stack gap="xs" mt={4}>
                          <Radio value="blank" label="Blank" />
                          <Radio value="duplicate" label="Proxy" />
                        </Stack>
                      </Radio.Group>
                      <Button
                        variant="light"
                        size="xs"
                        fullWidth
                        mt={4}
                        leftSection={<IconRefresh size={14} />}
                        disabled={gapHandling !== 'duplicate'}
                        onClick={() => setProxyVersion((v) => v + 1)}
                      >
                        Reroll Proxy
                      </Button>
                    </Stack>
                  </Paper>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <CollageCanvas images={orderedForCanvas} grid={grid} aspectRatio={aspectRatio} cropOffsets={cropOffsets} />
                  </Box>
                </Group>
                <Paper withBorder style={{ maxWidth: 1060, width: '100%', margin: '0 auto' }}>
                  <ImageList
                    images={images}
                    onRemove={removeImage}
                    cropOffsets={cropOffsets}
                    onCropOffsetChange={handleCropOffsetChange}
                    tileARValue={tileARValue}
                  />
                </Paper>
              </Stack>
            )}
        </AppShell.Main>
      </AppShell>
      <ExportModal
        opened={exportOpened}
        onClose={closeExport}
        images={orderedForCanvas}
        grid={grid}
        aspectRatio={aspectRatio}
      />
    </>
  )
}
