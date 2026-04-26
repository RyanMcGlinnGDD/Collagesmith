import { useState, useCallback, useRef } from 'react'
import { AppShell, Group, Text, ActionIcon } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPlus, IconDownload } from '@tabler/icons-react'
import { LoadedImage } from '../types'
import { DropZoneArea } from '../components/DropZoneArea'
import { CollageCanvas } from '../components/CollageCanvas'
import { ExportModal } from '../components/ExportModal'
import { loadImages } from '../lib/loadImages'
import { gridLayout } from '../lib/gridLayout'

export function HomePage() {
  const [images, setImages] = useState<LoadedImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [exportOpened, { open: openExport, close: closeExport }] = useDisclosure(false)

  const handleFiles = useCallback((loaded: LoadedImage[]) => {
    setImages((prev) => [...prev, ...loaded])
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

  const orderedForCanvas: (LoadedImage | null)[] = images
  const grid = gridLayout(images.length)
  const aspectRatio = 9 / 16

  return (
    <>
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
                </Group>
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
