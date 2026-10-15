# Custom media library (CE.SDK video editor, React)

An example application: the CE.SDK video editor with three additions, all
backed by your own storage:

- **Elements panel**: the dock's Elements button opens a custom panel with
  search and sections for images, videos, audio, stickers and shapes. Images,
  videos and audio have "Add File" and "My Collection" buttons.
- **My Collection panel**: a new dock button with its own icon. The panel lists
  the user's files in Images, Videos and Audio tabs.
- **My Collection modal**: filters the user's files by date, type, favorites
  and prompt, groups them by Today, Yesterday, Last 7 days and Older, and adds
  several files to the video at once.

**Live demo:** https://orfaf1ip.imgly.dev/ (no login needed)

The example runs with demo storage: sample files instead of a real collection.
Uploads stay in the browser and are gone after a reload. "Connect your
storage" below replaces it with your backend.

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
| `src/video-editor/`     | The video editor configuration: features, dock, panels      | `plugin.ts`               |
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
const storage = createHttpStorage('https://your-api.example.com');
```

`createHttpStorage` (`src/storage/httpStorage.ts`) expects two endpoints. The
file header describes the requests and responses. They are a proposal, so
adapt them to the collection API you already have:

1. **List**: returns the signed-in user's files as `MediaAsset` objects,
   filtered by kind, search text, date range and favorites, newest first.
2. **Upload**: returns a signed PUT URL and the asset for the new file. The
   browser uploads straight into the bucket, and your backend can then
   register the file in the user's collection.

With one Google Cloud Storage bucket shared by all users, the backend does the
per-user filtering and signs the URLs, for example as V4 signed URLs. The
browser never lists the bucket. If your collection API has a different shape,
write your own `MediaStorage` instead; nothing else changes.

Things to set up on the bucket and backend:

- **Read URLs**: each file needs a `meta.uri` the browser can load, for
  example a V4 signed URL. `MediaAsset` in `MediaStorage.ts` lists the other
  fields the editor and the modal need.
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

## Documentation

- [Create a custom panel](https://img.ly/docs/cesdk/react/user-interface/ui-extensions/create-custom-panel-d87b83/)
- [Dock and component order](https://img.ly/docs/cesdk/react/user-interface/customization/reference/component-order-api-d4e5f6/)
- [Asset library basics: asset sources and library entries](https://img.ly/docs/cesdk/react/import-media/asset-library/basics-f29078/)
- [Load assets from your server](https://img.ly/docs/cesdk/react/import-media/from-remote-source/your-server-b91910/)
- [User uploads](https://img.ly/docs/cesdk/react/import-media/from-local-source/user-upload-c6c7d9/)
- [The `uploadFile` action](https://img.ly/docs/cesdk/react/actions-6ch24x/)
- [URI resolver, for signed URLs that expire](https://img.ly/docs/cesdk/react/open-the-editor/uri-resolver-36b624/)
