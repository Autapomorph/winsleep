import { getCurrentWebview } from '@tauri-apps/api/webview';

export const setWebviewZoom = async (scaleFactor: number): Promise<void> => {
  try {
    const webview = getCurrentWebview();
    await webview.setZoom(scaleFactor);
  } catch {
    if (typeof document !== 'undefined') {
      (document.documentElement.style as unknown as { zoom: string }).zoom = String(scaleFactor);
    }
  }
};
