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
    try {
      const loaded = await loadImages(files)
      onFiles(loaded)
    } catch (err) {
      console.error('Failed to load dropped images:', err)
    }
  }

  return (
    <Dropzone
      onDrop={handleDrop}
      accept={IMAGE_MIME_TYPE}
      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Group
        justify="center"
        align="center"
        gap="xl"
        style={{ pointerEvents: 'none' }}
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
            They will be tiled into a collage
          </Text>
        </div>
      </Group>
    </Dropzone>
  )
}
