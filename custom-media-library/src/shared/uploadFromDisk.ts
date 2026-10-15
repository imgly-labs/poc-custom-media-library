import type CreativeEditorSDK from '@cesdk/cesdk-js';

import type { MediaKind } from '../storage';
import { storageSourceId } from '../storage';

/**
 * Lets the user pick a file and uploads it through the `uploadFile` action,
 * which `connectStorage` points at your storage. Returns whether it worked.
 */
export async function uploadFromDisk(
  cesdk: CreativeEditorSDK,
  kind: MediaKind
): Promise<boolean> {
  const file = await cesdk.utils.loadFile({
    accept: `${kind}/*`,
    returnType: 'File'
  });
  const notification = cesdk.ui.showNotification({
    type: 'loading',
    message: `Uploading ${file.name} …`,
    duration: 'infinite'
  });
  try {
    await cesdk.actions.run('uploadFile', file, () => {}, {
      sourceId: storageSourceId(kind)
    });
    return true;
  } catch (error) {
    console.error(error);
    cesdk.ui.showNotification({
      type: 'error',
      message: `Could not upload ${file.name}`
    });
    return false;
  } finally {
    cesdk.ui.dismissNotification(notification);
  }
}
