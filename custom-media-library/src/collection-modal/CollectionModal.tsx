/**
 * "My Collection" modal: filter the user's files, select several, and add
 * them to the scene in one step.
 *
 * It renders in the page, outside the editor, so it can cover the whole
 * editor and use the page's own CSS. It calls the storage directly, because
 * the date and favorites filters are not part of an asset source query.
 */

import { useEffect, useMemo, useState } from 'react';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { AssetResult } from '@cesdk/cesdk-js';

import { storageSourceId, type MediaKind, type MediaStorage } from '../storage';
import './CollectionModal.css';

const KIND_LABELS: Record<MediaKind, { option: string; noun: string[] }> = {
  image: { option: 'Image', noun: ['image', 'images'] },
  video: { option: 'Video', noun: ['video', 'videos'] },
  audio: { option: 'Audio', noun: ['audio file', 'audio files'] }
};

interface CollectionModalProps {
  cesdk: CreativeEditorSDK;
  storage: MediaStorage;
  initialKind: MediaKind;
  onClose: () => void;
}

export function CollectionModal({
  cesdk,
  storage,
  initialKind,
  onClose
}: CollectionModalProps) {
  const [kind, setKind] = useState(initialKind);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [assets, setAssets] = useState<AssetResult[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), 250);
    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    // A newer filter can finish first, so drop a stale result.
    let stale = false;
    storage
      .list(kind, {
        query,
        page: 0,
        perPage: 200,
        from: from ? new Date(`${from}T00:00:00`) : undefined,
        to: to ? new Date(`${to}T23:59:59`) : undefined,
        favoritesOnly
      })
      .then((result) => {
        if (!stale) setAssets(result.assets);
      });
    return () => {
      stale = true;
    };
  }, [storage, kind, query, from, to, favoritesOnly]);

  const groups = useMemo(() => groupByDate(assets), [assets]);

  const toggle = (id: string) =>
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );

  const [singular, plural] = KIND_LABELS[kind].noun;
  const count = `${selected.length} ${selected.length === 1 ? singular : plural}`;

  async function addSelected() {
    setAdding(true);
    try {
      // Applies in the order the user selected the files.
      for (const id of selected) {
        const asset = assets.find((a) => a.id === id);
        if (asset != null) {
          await cesdk.engine.asset.apply(storageSourceId(kind), asset);
        }
      }
      onClose();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="cm-backdrop" onClick={onClose}>
      <div
        className="cm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cm-header">
          <h2 id="cm-title">My Collection</h2>
          <button
            type="button"
            className="cm-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="cm-filters">
          <label className="cm-field">
            <span>Date</span>
            <span className="cm-range">
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
              />
            </span>
          </label>
          <label className="cm-field">
            <span>Type</span>
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as MediaKind);
                setSelected([]);
              }}
            >
              {(Object.keys(KIND_LABELS) as MediaKind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k].option}
                </option>
              ))}
            </select>
          </label>
          <div className="cm-field">
            <span>Favorites</span>
            <button
              type="button"
              className="cm-favorites"
              aria-pressed={favoritesOnly}
              onClick={() => setFavoritesOnly((on) => !on)}
            >
              {favoritesOnly ? '★' : '☆'} Favorites
            </button>
          </div>
          <label className="cm-field cm-search">
            <span>Search in prompt</span>
            <input
              type="search"
              placeholder="Find a prompt or file name"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </label>
        </div>

        <div className="cm-body">
          {groups.length === 0 && <p className="cm-empty">No files found.</p>}
          {groups.map(([title, items]) => (
            <section key={title}>
              <h3>{title}</h3>
              <div className="cm-grid">
                {items.map((asset) => (
                  <Tile
                    key={asset.id}
                    asset={asset}
                    selected={selected.includes(asset.id)}
                    onToggle={() => toggle(asset.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="cm-footer">
          <span>{count} selected</span>
          {selected.length > 0 && (
            <button
              type="button"
              className="cm-link"
              onClick={() => setSelected([])}
            >
              Clear selection
            </button>
          )}
          <span className="cm-spacer" />
          <button type="button" className="cm-link" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="cm-primary"
            disabled={selected.length === 0 || adding}
            onClick={() => void addSelected()}
          >
            + Add {count}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Tile({
  asset,
  selected,
  onToggle
}: {
  asset: AssetResult;
  selected: boolean;
  onToggle: () => void;
}) {
  const thumbUri = asset.meta?.thumbUri ?? asset.meta?.uri;
  const isAudio =
    asset.meta?.kind === 'audio' || asset.meta?.blockType?.includes('audio');
  return (
    <button
      type="button"
      className="cm-tile"
      aria-pressed={selected}
      title={asset.label}
      onClick={onToggle}
    >
      {isAudio || thumbUri == null ? (
        <span className="cm-audio">
          <span>♪</span>
          {asset.label}
        </span>
      ) : (
        <img src={thumbUri} alt={asset.label} loading="lazy" />
      )}
      <span className="cm-check">{selected ? '✓' : ''}</span>
    </button>
  );
}

/** Groups assets into Today, Yesterday, Last 7 days and Older. */
function groupByDate(assets: AssetResult[]): [string, AssetResult[]][] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const day = 24 * 60 * 60 * 1000;
  const groups: Record<string, AssetResult[]> = {
    Today: [],
    Yesterday: [],
    'Last 7 days': [],
    Older: []
  };
  for (const asset of assets) {
    const age =
      startOfToday.getTime() - Date.parse(String(asset.meta?.createdAt));
    if (age <= 0) groups.Today.push(asset);
    else if (age <= day) groups.Yesterday.push(asset);
    else if (age <= 7 * day) groups['Last 7 days'].push(asset);
    else groups.Older.push(asset);
  }
  return Object.entries(groups).filter(([, items]) => items.length > 0);
}
