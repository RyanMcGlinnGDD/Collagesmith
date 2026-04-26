import { ActionIcon, Box, Group, ScrollArea, Slider, Stack, Text } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { LoadedImage } from '../types'

interface Props {
  images: LoadedImage[]
  onRemove: (id: string) => void
  cropOffsets: Map<string, number>
  onCropOffsetChange: (id: string, offset: number) => void
  tileARValue: number
}

function cropDirection(image: LoadedImage, tileAR: number): 'h' | 'v' | 'none' {
  const imgAR = image.element.naturalWidth / image.element.naturalHeight
  if (imgAR > tileAR + 0.001) return 'h'
  if (imgAR < tileAR - 0.001) return 'v'
  return 'none'
}

export function ImageList({ images, onRemove, cropOffsets, onCropOffsetChange, tileARValue }: Props) {
  return (
    <ScrollArea>
      <Stack gap={0}>
        {images.map((image) => {
          const dir = cropDirection(image, tileARValue)
          const offset = cropOffsets.get(image.id) ?? 0
          const pct = `${((offset + 1) / 2) * 100}%`
          const objectPosition = dir === 'h' ? `${pct} 50%` : dir === 'v' ? `50% ${pct}` : '50% 50%'
          const thumbH = Math.round(192 / tileARValue)
          return (
            <Group
              key={image.id}
              px="sm"
              py="xs"
              gap="sm"
              wrap="nowrap"
              style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
            >
              <img
                src={image.url}
                alt={image.name}
                style={{ width: 192, height: thumbH, objectFit: 'cover', objectPosition, borderRadius: 4, flexShrink: 0 }}
              />
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" style={{ wordBreak: 'break-all' }} mb={4}>{image.name}</Text>
                <Group gap="xs" wrap="nowrap">
                  <Text size="xs" c="dimmed" style={{ flexShrink: 0, userSelect: 'none' }}>
                    {dir === 'h' ? '↔' : dir === 'v' ? '↕' : '·'}
                  </Text>
                  <Slider
                    style={{ flex: 1 }}
                    size="xs"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={offset}
                    onChange={(v) => onCropOffsetChange(image.id, v)}
                    disabled={dir === 'none'}
                    label={null}
                  />
                </Group>
              </Box>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => onRemove(image.id)}
                aria-label={`Remove ${image.name}`}
                style={{ flexShrink: 0 }}
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>
          )
        })}
      </Stack>
    </ScrollArea>
  )
}
