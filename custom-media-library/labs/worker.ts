/**
 * img.ly Labs only: the demo host cannot store the CE.SDK assets (the engine
 * file alone exceeds its file size limit), so this worker passes
 * `/cesdk-assets/*` through to the IMG.LY CDN. The browser then loads them from
 * the app's own origin, as the custom Elements panel requires.
 *
 * Your own deployment does not need this file: serve the assets yourself.
 */

const CESDK_CDN = 'https://cdn.img.ly/packages/imgly/cesdk-js/1.84.0/assets/';
const PREFIX = '/cesdk-assets/';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(PREFIX)) {
      return new Response('Not found', { status: 404 });
    }
    const upstream = new URL(
      url.pathname.slice(PREFIX.length) + url.search,
      CESDK_CDN
    );
    const headers = new Headers();
    const range = request.headers.get('Range');
    if (range != null) headers.set('Range', range);
    return fetch(upstream, { method: request.method, headers });
  }
};
