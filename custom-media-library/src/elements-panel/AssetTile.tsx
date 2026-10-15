import type { AssetResult } from '@cesdk/cesdk-js';

export type TileLayout = 'grid' | 'list' | 'icons';

/** One asset in a panel: a thumbnail, or a row for audio. */
export function AssetTile({
  asset,
  layout,
  onClick
}: {
  asset: AssetResult;
  layout: TileLayout;
  onClick: () => void;
}) {
  const thumbUri = asset.meta?.thumbUri ?? asset.meta?.uri;

  if (layout === 'list') {
    return (
      <button type="button" className="asset list" onClick={onClick}>
        <span className="note">♪</span>
        <span className="meta">
          <span className="name">{asset.label}</span>
          <span className="artist">{String(asset.meta?.artist ?? '')}</span>
        </span>
        <span className="duration">{formatDuration(asset.meta?.duration)}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`asset ${layout}`}
      title={asset.label}
      onClick={onClick}
    >
      {thumbUri != null && (
        <img src={thumbUri} alt={asset.label} loading="lazy" />
      )}
      {asset.meta?.duration != null && (
        <span className="badge">{formatDuration(asset.meta.duration)}</span>
      )}
    </button>
  );
}

/** Asset durations are stored in seconds. */
function formatDuration(value: unknown): string {
  const seconds = Math.round(Number(value));
  if (!Number.isFinite(seconds)) return '';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
