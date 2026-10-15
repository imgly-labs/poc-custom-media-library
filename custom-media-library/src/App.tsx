/**
 * CE.SDK video editor with a custom Elements panel, a custom My Collection
 * panel and a My Collection modal, all backed by your own storage.
 *
 * @see https://img.ly/docs/cesdk/react/get-started/overview-e18f40/
 */

import { useEffect, useRef, useState } from 'react';
import CreativeEditorSDK from '@cesdk/cesdk-js';

import { CollectionModal } from './collection-modal/CollectionModal';
import { setupCollectionPanel } from './collection-panel/setupCollectionPanel';
import { setupElementsPanel } from './elements-panel/setupElementsPanel';
import { initVideoEditor } from './imgly';
import {
  connectStorage,
  createDemoStorage,
  type MediaKind,
  type MediaStorage
} from './storage';

// The CE.SDK assets must come from the page's own origin, see vite.config.ts.
const CESDK_ASSETS_URL = new URL('/cesdk-assets/', location.href).href;

const SCENE_URL =
  'https://staticimgly.com/imgly/cesdk-web-examples-data/1.83.0/starterkit-video-editor/assets/templates/lunar-video-default/scene.scene';

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<{
    cesdk: CreativeEditorSDK;
    storage: MediaStorage;
  }>();
  const [modalKind, setModalKind] = useState<MediaKind | null>(null);

  useEffect(() => {
    let cesdk: CreativeEditorSDK | undefined;
    let disposed = false;

    getLicense()
      .then((license) =>
        CreativeEditorSDK.create(containerRef.current!, {
          baseURL: CESDK_ASSETS_URL,
          license,
          userId: 'custom-media-library-user'
        })
      )
      .then(async (instance) => {
        // StrictMode unmounts once before create() resolves.
        if (disposed) {
          instance.dispose();
          return;
        }
        cesdk = instance;

        await initVideoEditor(instance);

        // 1. Your storage. Replace the demo with your backend:
        //    const storage = createHttpStorage('https://your-api.example.com');
        const storage = createDemoStorage(instance);
        connectStorage(instance, storage);

        // 2. The custom panels. Elements can open the My Collection modal.
        setupElementsPanel(instance, { onOpenCollection: setModalKind });
        setupCollectionPanel(instance);

        setEditor({ cesdk: instance, storage });

        await instance.load(SCENE_URL);
      })
      .catch((error) => {
        console.error('Failed to initialize CE.SDK:', error);
      });

    return () => {
      disposed = true;
      cesdk?.dispose();
    };
  }, []);

  return (
    <>
      <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
      {editor != null && modalKind != null && (
        <CollectionModal
          cesdk={editor.cesdk}
          storage={editor.storage}
          initialKind={modalKind}
          onClose={() => setModalKind(null)}
        />
      )}
    </>
  );
}

/**
 * Your license key from `.env` (`VITE_CESDK_LICENSE`). On img.ly Labs, the
 * host serves a license at `/__labs/cesdk-license` instead. Without either,
 * the editor runs as a trial with a watermark.
 */
async function getLicense(): Promise<string | undefined> {
  try {
    const response = await fetch('/__labs/cesdk-license');
    // Vite dev answers unknown paths with index.html, hence the type check.
    if (
      response.ok &&
      response.headers.get('Content-Type')?.startsWith('text/plain')
    ) {
      return (await response.text()).trim() || undefined;
    }
  } catch {
    // Not on Labs.
  }
  return import.meta.env.VITE_CESDK_LICENSE;
}
