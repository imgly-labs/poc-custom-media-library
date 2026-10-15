// The panel renders inside the editor's shadow DOM, so page CSS does not reach
// it. The `--ubq-*` theme variables do, so the panel follows light and dark.
export const PANEL_CSS = /* css */ `
  .panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 4px 16px 16px;
    color: var(--ubq-foreground-default);
    font: 13px/1.4 var(--ubq-typography-body-m-font_family, Inter, sans-serif);
  }
  .search {
    box-sizing: border-box;
    width: 100%;
    height: 36px;
    padding: 0 12px;
    border: none;
    border-radius: 8px;
    background: var(--ubq-input-default, rgba(143, 143, 143, 0.12));
    color: inherit;
    font: inherit;
  }
  .section { display: flex; flex-direction: column; gap: 10px; }
  .header { display: flex; align-items: center; justify-content: space-between; }
  .title { margin: 0; font-size: 13px; font-weight: 600; }
  button { font: inherit; color: inherit; cursor: pointer; }
  .link {
    border: none;
    background: none;
    padding: 0;
    color: var(--ubq-foreground-light);
  }
  .link:hover { color: var(--ubq-foreground-default); }
  .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .action {
    height: 32px;
    border: none;
    border-radius: 8px;
    background: var(--ubq-interactive-default, white);
    box-shadow: var(--ubq-effect-shadow);
    font-size: 12px;
  }
  .action:hover { background: var(--ubq-interactive-hover); }
  .content.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .content.icons { display: flex; gap: 8px; flex-wrap: wrap; }
  .content.list { display: flex; flex-direction: column; gap: 6px; }
  .asset {
    position: relative;
    padding: 0;
    border: none;
    border-radius: 8px;
    overflow: hidden;
    background: var(--ubq-interactive-default, rgba(143, 143, 143, 0.12));
  }
  .asset:hover { outline: 2px solid var(--ubq-focus-default, #4c8bf5); }
  .asset img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .asset.grid { aspect-ratio: 1; }
  .asset.icons { width: 40px; height: 40px; background: none; }
  .asset.icons img { object-fit: contain; }
  .asset.list {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px;
    text-align: left;
    background: none;
  }
  .note {
    display: grid;
    place-items: center;
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 6px;
    background: var(--ubq-interactive-default, rgba(143, 143, 143, 0.12));
  }
  .meta { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .name { font-weight: 500; }
  .name, .artist { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .artist, .duration, .empty { color: var(--ubq-foreground-light); font-size: 11px; }
  .badge {
    position: absolute;
    left: 4px;
    bottom: 4px;
    padding: 1px 4px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 10px;
  }
  .empty { margin: 0; }
`;
