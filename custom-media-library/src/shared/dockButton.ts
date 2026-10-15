import type CreativeEditorSDK from '@cesdk/cesdk-js';

/**
 * `onClick` and `isSelected` for a dock button that toggles a panel. Spread
 * them into a `ly.img.assetLibrary.dock` component so the button looks like
 * every other dock button.
 */
export function dockButtonFor(cesdk: CreativeEditorSDK, panelId: string) {
  return {
    onClick: () => {
      if (cesdk.ui.isPanelOpen(panelId)) {
        cesdk.ui.closePanel(panelId);
        return;
      }
      // Only one panel at a time on the left, like the built-in dock buttons.
      cesdk.ui
        .findAllPanels({ open: true, position: 'left' })
        .forEach((id) => cesdk.ui.closePanel(id));
      cesdk.ui.openPanel(panelId);
    },
    isSelected: () => cesdk.ui.isPanelOpen(panelId)
  };
}
