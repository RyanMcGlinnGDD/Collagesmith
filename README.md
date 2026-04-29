# Collagesmith

A browser-based tool for assembling images into a tiled collage. Configure the grid layout, adjust how each image is cropped to its tile, and export at any resolution. Everything runs locally in your browser with no account or server required.

---

## Features

### Image loading

- **Drag and drop** images onto the canvas or click to open a file picker
- **Add more** at any time via the + button in the header
- If any file in a batch fails to load, a modal lists the filenames that were skipped with the rest loading as normal

### Grid layout

- **Columns** - set the number of columns; rows adjust automatically to fit all images
- On first load the column count is automatically chosen to make the canvas closest to **16:9**
- **Tile aspect ratio**: 16:9, 4:3, 1:1, or a custom W:H ratio
- **Randomize** shuffles the image order across all slots

### Gap handling

- **Blank** - unfilled slots are left black
- **Proxy** - unfilled slots are filled with duplicates of existing images, chosen to avoid repeating the same image in adjacent tiles, the same row, or the same column
- **Reroll Proxy** re-randomizes proxy assignments without changing the layout

### Crop adjustment

- Each image has a **crop slider** that pans it within its tile
- The slider moves horizontally for landscape images in portrait tiles, and vertically for portrait images in landscape tiles
- Images that exactly match the tile aspect ratio with no excess have their slider is disabled

### Export

- Set the export **width or height**; the other dimension updates automatically to match the canvas aspect ratio
- Both dimensions are capped at **8192 px**
- **Format**: PNG (lossless), JPEG, or WebP
- The exported file is rendered directly to an offscreen canvas at the chosen resolution (not screenshotted from the viewport)

---

## Usage

### Loading images

1. Drag image files onto the drop zone, or click it to open a file picker
2. Use the **+** button in the header to add more images at any time
3. Click the **×** on any image row to remove it

### Adjusting the layout

1. Use the **Columns** input to change the grid width
2. Select a **Tile Aspect Ratio** to control the shape of each cell
3. Click **Randomize** to shuffle image positions
4. Switch **Gap Handling** to **Proxy** to fill empty slots automatically, then click **Reroll Proxy** to try different assignments

### Adjusting crops

1. Find the image in the list below the canvas
2. Drag its crop slider left or right to pan it within its tile

### Exporting

1. Click the download icon in the header
2. Enter a width or height. The other field updates automatically
3. Select a format
4. Click **Export** to download the file immediately

---

## Data storage

All image data is held in memory as object URLs for the duration of the session. Refreshing or closing the tab clears all loaded images.

---

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```
npm install
```

### Run locally

```
npm run dev
```

### Run tests

```
npm test
```

### Build

```
npm run build
```

### Tech stack

- React 18 + TypeScript
- Vite - build tool
- Mantine 7 - UI components
- TanStack Router - client-side routing
- Vitest + jsdom - unit tests
