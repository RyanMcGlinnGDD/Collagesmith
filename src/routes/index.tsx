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
      try {
        const loaded = await loadImages(files)
        handleFiles(loaded)
      } catch (err) {
        console.error('Failed to load images:', err)
      }
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
