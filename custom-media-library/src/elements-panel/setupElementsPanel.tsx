/**
 * Custom "Elements" panel.
 *
 * The video editor already has an Elements dock button. This keeps the button,
 * with its icon and label, and only points it at a custom panel.
 *
 * The panel is a React component, registered with
 * `cesdk.ui.unstable_registerCustomPanel`. That API is experimental: it may
 * change or be removed in a future CE.SDK version. It is used here because
 * the design needs a layout that builder components cannot produce: per
 * section "Add File" and "My Collection" buttons and a 3-tile preview. For a
 * panel that builder components can describe, use the stable
 * `cesdk.ui.registerPanel`, as `../collection-panel` does.
 */

import { createRoot } from 'react-dom/client';
import type CreativeEditorSDK from '@cesdk/cesdk-js';

import { dockButtonFor } from '../shared/dockButton';
import type { MediaKind } from '../storage';
import { ElementsPanel } from './ElementsPanel';

export const ELEMENTS_PANEL_ID = 'custom.elements';

export function setupElementsPanel(
  cesdk: CreativeEditorSDK,
  options: { onOpenCollection: (kind: MediaKind) => void }
): void {
  // 1. Mount the React component when the panel opens. CE.SDK hands over a
  //    plain DOM element inside its shadow DOM, so page CSS does not reach it.
  cesdk.i18n.setTranslations({
    en: { [`panel.${ELEMENTS_PANEL_ID}`]: 'Elements' }
  });
  cesdk.ui.unstable_registerCustomPanel(ELEMENTS_PANEL_ID, (element) => {
    const root = createRoot(element);
    root.render(
      <ElementsPanel
        cesdk={cesdk}
        onOpenCollection={options.onOpenCollection}
      />
    );
    return () => root.unmount();
  });

  // 2. Point the existing dock button (key 'ly.img.elements') at it.
  cesdk.ui.updateOrderComponent(
    { in: 'ly.img.dock', match: { key: 'ly.img.elements' } },
    dockButtonFor(cesdk, ELEMENTS_PANEL_ID)
  );
}
