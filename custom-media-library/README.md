# Custom media library (CE.SDK video editor, React)

The video editor starter kit with three additions, all backed by your own
storage:

- **Elements panel**: the dock's Elements button opens a custom panel with
  search and sections for images, videos, audio, stickers and shapes. Images,
  videos and audio have "Add File" and "My Collection" buttons.
- **My Collection panel**: a new dock button with its own icon. The panel lists
  the user's files in Images, Videos and Audio tabs.
- **My Collection modal**: filters the user's files by date, type, favorites
  and prompt, and adds several files at once.

## Run

```bash
cp .env.example .env   # then set VITE_CESDK_LICENSE
npm install
npm run dev
```

Without a license key, the editor runs as a trial with a watermark. Built with
CE.SDK 1.84.0.

## Where to look

| Folder                  | What it holds                                               | Start with                |
| ----------------------- | ----------------------------------------------------------- | ------------------------- |
| `src/storage/`          | Everything about your storage                               | `MediaStorage.ts`         |
| `src/elements-panel/`   | The custom Elements panel (React)                           | `setupElementsPanel.tsx`  |
| `src/collection-panel/` | The custom My Collection panel (builder) and dock button    | `setupCollectionPanel.ts` |
| `src/collection-modal/` | The My Collection modal                                     | `CollectionModal.tsx`     |
| `src/shared/`           | Code both panels use: the dock button toggle and the upload | `dockButton.ts`           |
| `src/App.tsx`           | Creates the editor and wires the pieces together            |                           |
| `src/video-editor/`     | The video editor configuration from our starter kit         | `plugin.ts`               |
| `labs/`                 | Only for our demo host, img.ly Labs. Not needed in your app |                           |

Each panel folder has a `setup…` file: register the panel, then point a dock
button at it. The two panels show the two ways to build a panel:

- **My Collection** uses `cesdk.ui.registerPanel`, CE.SDK's stable panel API.
  The panel is described with builder components (tabs, buttons, an asset
  library), and the editor renders it in its own style. Prefer this.
- **Elements** is a React component mounted with
  `cesdk.ui.unstable_registerCustomPanel`. That API is experimental and may
  change or be removed in a future CE.SDK version. Use it only for a layout
  the builder components cannot produce, as this design needs.

## Connect your storage

All listing and uploading goes through one interface, `MediaStorage`
(`src/storage/MediaStorage.ts`). `connectStorage` turns it into one CE.SDK
asset source per media kind and into the editor's `uploadFile` action, so the
panels and the built-in Uploads panel all use your storage.

To use your backend, change one line in `src/App.tsx`:

```ts
const storage = createHttpStorage("https://your-api.example.com");
```

`createHttpStorage` (`src/storage/httpStorage.ts`) expects two endpoints:

1. **List**: returns the signed-in user's files as `MediaAsset` objects,
   filtered by kind, search text, date range and favorites, newest first.
2. **Upload**: returns a signed PUT URL and the asset for the new file. The
   browser uploads straight into the bucket.

With one Google Cloud Storage bucket shared by all users, the backend does the
per-user filtering and signs the URLs, for example as V4 signed URLs. The
browser never lists the bucket. If your collection API has a different shape,
write your own `MediaStorage` instead; nothing else changes.

Things to set up on the bucket and backend:

- **CORS**: allow `GET` and `PUT` from the editor's origin, otherwise the
  editor cannot load or upload files.
- **Expiring URLs**: saved scenes keep each file's URL. If read URLs expire,
  store a stable URL in the asset and sign it at load time with
  `cesdk.engine.editor.setURIResolver`.

## Asset hosting

Serve the CE.SDK assets (`baseURL`) from the same origin as the page. The
Elements panel, as a custom panel, copies the editor stylesheet's rules, which
the browser blocks for a cross-origin stylesheet.

This example loads them from `/cesdk-assets/`. In development, Vite passes that
path through to the IMG.LY CDN (`vite.config.ts`). In production, serve the
CE.SDK assets and the asset sources you use from your own server at that path.
The IMG.LY CDN is for testing only.
