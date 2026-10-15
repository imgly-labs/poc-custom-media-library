/**
 * The "Elements" panel: a search field and one section per media type.
 *
 * Each section previews the first assets of its asset sources. "More" opens
 * the same library as the matching dock button. "Add File" uploads to your
 * storage, and "My Collection" opens the collection modal.
 */

import { useEffect, useState } from 'react';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { AssetLibraryDockComponent, AssetResult } from '@cesdk/cesdk-js';

import { uploadFromDisk } from '../shared/uploadFromDisk';
import type { MediaKind } from '../storage';
import { AssetTile, type TileLayout } from './AssetTile';
import { PANEL_CSS } from './elementsPanelStyles';

interface SectionConfig {
  title: string;
  /** Asset sources the preview shows. */
  sourceIds: string[];
  /** Key of the dock button whose library "More" opens. */
  dockKey: string;
  layout: TileLayout;
  previewCount: number;
  /** Media kind for "Add File" and "My Collection". Omit to hide both. */
  kind?: MediaKind;
}

const SECTIONS: SectionConfig[] = [
  {
    title: 'Images',
    sourceIds: ['ly.img.image'],
    dockKey: 'ly.img.image',
    layout: 'grid',
    previewCount: 3,
    kind: 'image'
  },
  {
    title: 'Videos',
    sourceIds: ['ly.img.video'],
    dockKey: 'ly.img.video',
    layout: 'grid',
    previewCount: 3,
    kind: 'video'
  },
  {
    title: 'Audio',
    sourceIds: ['ly.img.audio'],
    dockKey: 'ly.img.audio',
    layout: 'list',
    previewCount: 2,
    kind: 'audio'
  },
  {
    title: 'Stickers',
    sourceIds: ['ly.img.sticker'],
    dockKey: 'ly.img.sticker',
    layout: 'icons',
    previewCount: 5
  },
  {
    title: 'Shapes',
    sourceIds: ['ly.img.vector.shape'],
    dockKey: 'ly.img.vector.shape',
    layout: 'icons',
    previewCount: 4
  }
];

type SourcedAsset = AssetResult & { sourceId: string };

interface PanelProps {
  cesdk: CreativeEditorSDK;
  onOpenCollection: (kind: MediaKind) => void;
}

export function ElementsPanel({ cesdk, onOpenCollection }: PanelProps) {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), 250);
    return () => clearTimeout(timer);
  }, [input]);

  return (
    <div className="panel">
      <style>{PANEL_CSS}</style>
      <input
        className="search"
        type="search"
        placeholder="Search elements"
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      {SECTIONS.map((config) => (
        <Section
          key={config.dockKey}
          cesdk={cesdk}
          onOpenCollection={onOpenCollection}
          config={config}
          query={query}
        />
      ))}
    </div>
  );
}

function Section({
  cesdk,
  onOpenCollection,
  config,
  query
}: PanelProps & { config: SectionConfig; query: string }) {
  const assets = usePreviewAssets(cesdk, config, query);
  const { kind } = config;

  return (
    <section className="section">
      <div className="header">
        <h2 className="title">{config.title}</h2>
        <button
          type="button"
          className="link"
          onClick={() => openDockLibrary(cesdk, config.dockKey)}
        >
          More
        </button>
      </div>
      {kind != null && (
        <div className="actions">
          <button
            type="button"
            className="action"
            onClick={async () => {
              if (await uploadFromDisk(cesdk, kind)) onOpenCollection(kind);
            }}
          >
            + Add File
          </button>
          <button
            type="button"
            className="action"
            onClick={() => onOpenCollection(kind)}
          >
            My Collection
          </button>
        </div>
      )}
      <div className={`content ${config.layout}`}>
        {assets.length === 0 && <p className="empty">No results</p>}
        {assets.map((asset) => (
          <AssetTile
            key={`${asset.sourceId}/${asset.id}`}
            asset={asset}
            layout={config.layout}
            onClick={() => void cesdk.engine.asset.apply(asset.sourceId, asset)}
          />
        ))}
      </div>
    </section>
  );
}

/** Queries the section's sources, and again when one of them changes. */
function usePreviewAssets(
  cesdk: CreativeEditorSDK,
  config: SectionConfig,
  query: string
): SourcedAsset[] {
  const { engine } = cesdk;
  const [assets, setAssets] = useState<SourcedAsset[]>([]);
  const [revision, setRevision] = useState(0);

  useEffect(
    () =>
      engine.asset.onAssetSourceUpdated((sourceId) => {
        if (config.sourceIds.includes(sourceId)) setRevision((r) => r + 1);
      }),
    [engine, config.sourceIds]
  );

  useEffect(() => {
    // A newer search can finish first, so drop a stale result.
    let stale = false;
    Promise.all(
      config.sourceIds.map(async (sourceId) => {
        const result = await engine.asset.findAssets(sourceId, {
          query,
          page: 0,
          perPage: config.previewCount
        });
        return result.assets.map((asset) => ({ ...asset, sourceId }));
      })
    ).then((results) => {
      if (!stale) setAssets(results.flat().slice(0, config.previewCount));
    });
    return () => {
      stale = true;
    };
  }, [engine, config, query, revision]);

  return assets;
}

/**
 * Opens the library of a dock button. The dock button shows as active only
 * when the panel has its exact entries and title, so copy both from the dock.
 * The dock skips IDs that are not library entries, so skip them here too.
 */
function openDockLibrary(cesdk: CreativeEditorSDK, dockKey: string) {
  const dockButton = cesdk.ui
    .getComponentOrder({ in: 'ly.img.dock' })
    .find(
      (component): component is AssetLibraryDockComponent =>
        component.id === 'ly.img.assetLibrary.dock' && component.key === dockKey
    );
  if (dockButton == null) return;
  const entries = (dockButton.entries ?? []).filter(
    (entryId) => cesdk.ui.getAssetLibraryEntry(entryId) != null
  );
  cesdk.ui
    .findAllPanels({ open: true, position: 'left' })
    .forEach((id) => cesdk.ui.closePanel(id));
  cesdk.ui.openPanel('//ly.img.panel/assetLibrary', {
    payload: { entries, title: dockButton.label }
  });
}
