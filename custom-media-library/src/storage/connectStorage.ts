/**
 * Connects a `MediaStorage` to the editor. This is the only place where
 * storage and CE.SDK meet.
 *
 * - One asset source per media kind lists the storage. The panels read these
 *   sources, and `engine.asset.apply` adds an asset from them to the scene.
 * - The `uploadFile` action stores every upload in the editor, including the
 *   built-in Uploads panel, in the same storage.
 */

import type CreativeEditorSDK from '@cesdk/cesdk-js';

import type { MediaKind, MediaStorage } from './MediaStorage';
import { MEDIA_KINDS, mediaKindOf } from './MediaStorage';

/** The asset source that lists one kind of file from your storage. */
export function storageSourceId(kind: MediaKind): string {
  return `custom.storage.${kind}`;
}

export function connectStorage(
  cesdk: CreativeEditorSDK,
  storage: MediaStorage
): void {
  const { engine } = cesdk;

  for (const kind of MEDIA_KINDS) {
    engine.asset.addSource({
      id: storageSourceId(kind),
      findAssets: (query) =>
        storage.list(kind, {
          query: query.query,
          page: query.page ?? 0,
          perPage: query.perPage ?? 30
        })
    });
  }

  cesdk.actions.register('uploadFile', async (file) => {
    const kind = mediaKindOf(file);
    const asset = await storage.upload(kind, file);
    // Tells every panel that lists this source to load it again.
    engine.asset.assetSourceContentsChanged(storageSourceId(kind));
    return asset;
  });
}
