/**
 * The contract between the editor and your storage.
 *
 * Everything in this example that lists or uploads files goes through a
 * `MediaStorage`. Implement it once for your backend and pass it to
 * `connectStorage` in `App.tsx`; no other file needs to change.
 *
 * - `demoStorage.ts`: in-memory, runs without a backend.
 * - `httpStorage.ts`: calls your backend, which owns the bucket.
 */

import type {
  AssetDefinition,
  AssetResult,
  AssetsQueryResult
} from '@cesdk/cesdk-js';

export type MediaKind = 'image' | 'video' | 'audio';

export const MEDIA_KINDS: MediaKind[] = ['image', 'video', 'audio'];

export interface MediaQuery {
  /** Free text, matched against the label and the generation prompt. */
  query?: string;
  page: number;
  perPage: number;
  /** Inclusive range on `meta.createdAt`. */
  from?: Date;
  to?: Date;
  favoritesOnly?: boolean;
}

export interface MediaStorage {
  /** Lists the current user's files of one kind, newest first. */
  list(kind: MediaKind, query: MediaQuery): Promise<AssetsQueryResult>;
  /** Stores a file for the current user and returns its asset. */
  upload(kind: MediaKind, file: File): Promise<AssetDefinition>;
}

/**
 * A file in your storage, as the editor needs it.
 *
 * `meta.uri` must load in the browser, so the bucket needs CORS for the
 * editor's origin. `createdAt`, `favorite` and `prompt` are this example's own
 * fields; the "My Collection" modal filters and groups by them.
 */
export type MediaAsset = AssetDefinition & {
  meta: AssetDefinition['meta'] & {
    uri: string;
    thumbUri?: string;
    mimeType: string;
    kind: MediaKind;
    width?: number;
    height?: number;
    /** ISO date. */
    createdAt: string;
    favorite?: boolean;
    prompt?: string;
  };
};

export function mediaKindOf(file: File): MediaKind {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'image';
}

export function toAssetResult(asset: AssetDefinition): AssetResult {
  return {
    id: asset.id,
    meta: asset.meta,
    label: asset.label?.en ?? String(asset.meta?.filename ?? asset.id)
  };
}
