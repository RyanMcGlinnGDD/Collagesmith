import { useEffect, useState } from 'react'
import { Modal, Group, NumberInput, SegmentedControl, Button, Text, Stack } from '@mantine/core'
import { LoadedImage } from '../types'
import { GridLayout } from '../lib/gridLayout'
import { drawCollage } from '../lib/drawCollage'
import { ExportFormat, getExportMimeType, getExportExtension } from '../lib/exportUtils'

const MAX_DIMENSION = 8192

interface Props {
  opened: boolean
  onClose: () => void
  images: (LoadedImage | null)[]
  grid: GridLayout
  aspectRatio: number
  cropOffsets: Map<string, number>
}

export function ExportModal({ opened, onClose, images, grid, aspectRatio, cropOffsets }: Props) {
  const [width, setWidth] = useState(1920)
  const [height, setHeight] = useState(Math.round(1920 * aspectRatio))
  const [format, setFormat] = useState<ExportFormat>('png')
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Reset to defaults whenever the modal opens
  useEffect(() => {
    if (!opened) return
    setWidth(1920)
    setHeight(Math.round(1920 * aspectRatio))
    setFormat('png')
    setIsExporting(false)
    setExportError(null)
  }, [opened]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleWidthChange = (v: number | string) => {
    if (typeof v !== 'number') return
    const w = Math.min(v, MAX_DIMENSION)
    const naturalH = Math.round(w * aspectRatio)
    if (naturalH > MAX_DIMENSION) {
      setHeight(MAX_DIMENSION)
      setWidth(Math.round(MAX_DIMENSION / aspectRatio))
    } else {
      setWidth(w)
      setHeight(naturalH)
    }
  }

  const handleHeightChange = (v: number | string) => {
    if (typeof v !== 'number') return
    const h = Math.min(v, MAX_DIMENSION)
    const naturalW = Math.round(h / aspectRatio)
    if (naturalW > MAX_DIMENSION) {
      setWidth(MAX_DIMENSION)
      setHeight(Math.round(MAX_DIMENSION * aspectRatio))
    } else {
      setHeight(h)
      setWidth(naturalW)
    }
  }

  const handleExport = () => {
    if (isExporting) return
    setExportError(null)
    setIsExporting(true)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setIsExporting(false)
      setExportError('Failed to initialize canvas. Try a smaller resolution.')
      return
    }
    drawCollage(ctx, canvas, images, grid, cropOffsets)
    const mimeType = getExportMimeType(format)
    const quality = format === 'png' ? undefined : 0.92
    canvas.toBlob((blob) => {
      setIsExporting(false)
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `collage.${getExportExtension(format)}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
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
              max={MAX_DIMENSION}
              style={{ flex: 1 }}
            />
            <Text mb={6}>×</Text>
            <NumberInput
              label="Height"
              value={height}
              onChange={handleHeightChange}
              min={1}
              max={MAX_DIMENSION}
              style={{ flex: 1 }}
            />
          </Group>
          <Text size="xs" c="dimmed" mt={4}>Locked to canvas ratio · max {MAX_DIMENSION}px</Text>
          {exportError && <Text size="xs" c="red" mt={4}>{exportError}</Text>}
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
          <Button onClick={handleExport} loading={isExporting}>Export</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
