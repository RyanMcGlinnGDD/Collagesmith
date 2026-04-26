import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone'
import { Group, Stack, Text, rem } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react'
import { loadImages } from '../lib/loadImages'
import { LoadedImage } from '../types'

interface Props {
  onFiles: (images: LoadedImage[]) => void
}

export function DropZoneArea({ onFiles }: Props) {
  const handleDrop = async (files: File[]) => {
    const { loaded, failed } = await loadImages(files)
    if (loaded.length > 0) onFiles(loaded)
    if (failed.length > 0) {
      modals.open({
        title: `${failed.length} image${failed.length === 1 ? '' : 's'} failed to load`,
        children: (
          <Stack gap="xs">
            {failed.map((name, i) => <Text key={i} size="sm">{name}</Text>)}
          </Stack>
        ),
      })
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
