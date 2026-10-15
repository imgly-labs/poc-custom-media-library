/**
 * Custom "My Collection" panel with its own dock button and icon.
 *
 * Built with `cesdk.ui.registerPanel`, CE.SDK's stable panel API: the panel is
 * described with builder components and rendered by the editor, so it matches
 * the editor's styling and theme. The library inside lists the user's files
 * from your storage, one tab per media kind.
 */

import type CreativeEditorSDK from '@cesdk/cesdk-js';

import { dockButtonFor } from '../shared/dockButton';
import { uploadFromDisk } from '../shared/uploadFromDisk';
import { MEDIA_KINDS, storageSourceId, type MediaKind } from '../storage';

export const COLLECTION_PANEL_ID = 'custom.collection';

const TABS: { id: MediaKind; label: string }[] = [
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Videos' },
  { id: 'audio', label: 'Audio' }
];

// Symbol IDs must start with '@'. Use your own icon here.
const COLLECTION_ICON = `<svg xmlns="http://www.w3.org/2000/svg">
  <symbol id="@custom/Collection" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
    <rect x="3" y="7" width="14" height="13" rx="2" />
    <path d="M7 4h11a3 3 0 0 1 3 3v9" />
    <path d="m6 17 3.5-4 2.5 3 1.5-1.5L16 17" />
  </symbol>
</svg>`;

export function setupCollectionPanel(cesdk: CreativeEditorSDK): void {
  // 1. One library entry per media kind, showing the storage's asset source.
  for (const kind of MEDIA_KINDS) {
    cesdk.ui.addAssetLibraryEntry({
      id: storageSourceId(kind),
      sourceIds: [storageSourceId(kind)],
      gridColumns: kind === 'audio' ? 1 : 3,
      gridItemHeight: kind === 'audio' ? 'auto' : 'square'
    });
  }

  // 2. The panel. The render function runs again when its state changes.
  cesdk.i18n.setTranslations({
    en: {
      [`panel.${COLLECTION_PANEL_ID}`]: 'My Collection',
      'custom.collection.dock.label': 'My Collection'
    }
  });
  cesdk.ui.registerPanel(COLLECTION_PANEL_ID, ({ builder, state }) => {
    const tab = state<MediaKind>('kind', 'image');
    const kind = tab.value;

    // A Section gives its children the panel's padding; the Library below
    // brings its own.
    builder.Section('controls', {
      children: () => {
        builder.Tabs('kinds', {
          tabs: TABS,
          value: kind,
          setValue: (value) => tab.setValue(value as MediaKind)
        });
        builder.Button('add-file', {
          label: 'Add File',
          icon: '@imgly/Plus',
          onClick: () => void uploadFromDisk(cesdk, kind)
        });
      }
    });
    // A click on an asset adds it to the scene. One ID per kind, so switching
    // tabs starts a fresh library with an empty search.
    builder.Library(`library-${kind}`, {
      entries: [storageSourceId(kind)],
      searchable: true
    });
  });

  // 3. A dock button with a custom icon, after the Uploads button.
  cesdk.ui.addIconSet('custom', COLLECTION_ICON);
  cesdk.ui.insertOrderComponent(
    { in: 'ly.img.dock', after: { key: 'ly.img.upload' } },
    {
      id: 'ly.img.assetLibrary.dock',
      key: COLLECTION_PANEL_ID,
      icon: '@custom/Collection',
      label: 'custom.collection.dock.label',
      ...dockButtonFor(cesdk, COLLECTION_PANEL_ID)
    }
  );
}
