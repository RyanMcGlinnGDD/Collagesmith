# Collagesmith

Collagesmith is a browser-based image collage creation tool. Drop images in and they will be arranged in a grid. Adjust crops, column count and aspect ratio, then export at any resolution.

## Features

The tool supports loading batches of images by drag-and-drop or file picker, with partial-failure handling so a single corrupt file doesn't abort the rest of the batch. Grid layout is configurable by column count and tile aspect ratio (16:9, 4:3, 1:1, or custom), with an automatic column suggestion on first load that targets a 16:9 canvas. Slots not filled by an image can be left black or filled with "proxy" duplicates chosen to avoid repeating the same image in adjacent tiles, the same row, or the same column.

## Design Approach

The application prioritizes non-destructive, real-time control. Each image has a crop slider that pans it within its tile along whichever axis has excess, and proxy assignments can be re-randomized without changing the underlying layout. Images can be added incrementally, removed individually, or shuffled at any time. Exported images are rendered directly to an offscreen canvas at the requested resolution rather than screenshotted from the browser viewport, so the output is resolution-independent and reflects all crop adjustments exactly.

## Technical Foundation

Built with React 18, TypeScript, Vite, and Mantine 7 for the UI layer. TanStack Router handles navigation and Vitest with jsdom handles quality assurance. All image data lives in memory as object URLs for the duration of the session.

## Architecture

The central state in `src/routes/index.tsx` separates image identity (`images`), slot arrangement (`canvasSlots`), proxy assignments (`proxyMap`), and crop offsets (`cropOffsets`) so each concern can change independently. The `canvasSlots` array uses `null` entries to represent blank slots and is `null` itself when images are in natural insertion order, avoiding unnecessary slot state until the user randomizes or removes an image. Rendering is handled by `drawCollage` in `src/lib/drawCollage.ts`, which cover-crops each image to its tile using scale-then-pan math and rounds destination coordinates cumulatively to eliminate sub-pixel gaps. Proxy selection in `src/lib/computeProxies.ts` enforces toroidal adjacency — opposite grid edges are treated as neighbours — so proxy placement is correct when the exported image is tiled.
