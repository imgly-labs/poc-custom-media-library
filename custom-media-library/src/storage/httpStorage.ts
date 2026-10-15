/**
 * `MediaStorage` backed by your own API, for example in front of a Google
 * Cloud Storage bucket that all users share.
 *
 * The browser never lists the bucket. Your backend knows the signed-in user,
 * returns only that user's files, and hands out signed URLs:
 *
 *   GET  {apiBaseUrl}/media?kind=image&query=…&page=0&perPage=30
 *        optional: &from=<ISO date>&to=<ISO date>&favorites=true
 *     → { items: MediaAsset[], total: number }, newest first.
 *       `meta.uri` and `meta.thumbUri` are read URLs, e.g. GCS V4 signed URLs.
 *
 *   POST {apiBaseUrl}/media/uploads   { kind, filename, mimeType }
 *     → { uploadUrl: string, asset: MediaAsset }
 *       `uploadUrl` is a signed PUT URL, so the file goes from the browser
 *       straight into the bucket. `asset` describes the file once uploaded.
 *
 * Requests send cookies (`credentials: 'include'`), so your existing session
 * identifies the user. Use a bearer token instead if your API expects one.
 */

import type { MediaAsset, MediaStorage } from './MediaStorage';
import { toAssetResult } from './MediaStorage';

export function createHttpStorage(apiBaseUrl: string): MediaStorage {
  return {
    async list(kind, query) {
      const params = new URLSearchParams({
        kind,
        query: query.query ?? '',
        page: String(query.page),
        perPage: String(query.perPage)
      });
      if (query.from != null) params.set('from', query.from.toISOString());
      if (query.to != null) params.set('to', query.to.toISOString());
      if (query.favoritesOnly) params.set('favorites', 'true');

      const response = await fetch(`${apiBaseUrl}/media?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`Listing failed: ${response.status}`);
      const { items, total } = (await response.json()) as {
        items: MediaAsset[];
        total: number;
      };
      return {
        assets: items.map(toAssetResult),
        total,
        currentPage: query.page,
        nextPage:
          (query.page + 1) * query.perPage < total ? query.page + 1 : undefined
      };
    },

    async upload(kind, file) {
      const response = await fetch(`${apiBaseUrl}/media/uploads`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, filename: file.name, mimeType: file.type })
      });
      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
      const { uploadUrl, asset } = (await response.json()) as {
        uploadUrl: string;
        asset: MediaAsset;
      };

      // The Content-Type must match the one the URL was signed for.
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      if (!put.ok) throw new Error(`Upload failed: ${put.status}`);
      return asset;
    }
  };
}
