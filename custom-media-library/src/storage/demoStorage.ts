/**
 * In-memory `MediaStorage` so the example runs without a backend.
 *
 * It starts with copies of the editor's demo assets, spread over the last
 * weeks, so the modal has something to group and filter. Uploads stay in the
 * browser and are lost on reload. Replace it with `createHttpStorage`.
 */

import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { AssetDefinition } from '@cesdk/cesdk-js';

import type { MediaKind, MediaQuery, MediaStorage } from './MediaStorage';
import { toAssetResult } from './MediaStorage';

const SEED_SOURCES: Record<MediaKind, string> = {
  image: 'ly.img.image',
  video: 'ly.img.video',
  audio: 'ly.img.audio'
};

const SEED_DAYS_AGO = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 3, 4, 5, 6, 6, 6];

export function createDemoStorage(cesdk: CreativeEditorSDK): MediaStorage {
  const files: Record<MediaKind, Promise<AssetDefinition[]>> = {
    image: seed('image'),
    video: seed('video'),
    audio: seed('audio')
  };

  async function seed(kind: MediaKind): Promise<AssetDefinition[]> {
    const { assets } = await cesdk.engine.asset.findAssets(SEED_SOURCES[kind], {
      page: 0,
      perPage: 24
    });
    return assets.map((asset, index) => ({
      id: `demo-${asset.id}`,
      label: { en: asset.label ?? asset.id },
      meta: {
        ...asset.meta,
        createdAt: daysAgo(SEED_DAYS_AGO[index] ?? 10 + index).toISOString(),
        favorite: index % 4 === 0,
        prompt: asset.label
      }
    }));
  }

  return {
    async list(kind, query) {
      const matches = (await files[kind]).filter((asset) =>
        isMatch(asset, query)
      );
      const start = query.page * query.perPage;
      return {
        assets: matches.slice(start, start + query.perPage).map(toAssetResult),
        total: matches.length,
        currentPage: query.page,
        nextPage:
          start + query.perPage < matches.length ? query.page + 1 : undefined
      };
    },

    async upload(kind, file) {
      // localUpload keeps the bytes in the browser and fills in the metadata
      // (size, thumbnail, duration) that the editor needs to apply the asset.
      const uploaded = await cesdk.utils.localUpload(file);
      const asset: AssetDefinition = {
        ...uploaded,
        meta: {
          ...uploaded.meta,
          createdAt: new Date().toISOString(),
          favorite: false
        }
      };
      (await files[kind]).unshift(asset);
      return asset;
    }
  };
}

function isMatch(asset: AssetDefinition, query: MediaQuery): boolean {
  const meta = asset.meta ?? {};
  const createdAt = new Date(String(meta.createdAt));
  const text = [asset.label?.en, meta.prompt, meta.filename]
    .join(' ')
    .toLowerCase();
  return (
    text.includes(query.query?.toLowerCase() ?? '') &&
    (query.from == null || createdAt >= query.from) &&
    (query.to == null || createdAt <= query.to) &&
    (!query.favoritesOnly || meta.favorite === true)
  );
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}
