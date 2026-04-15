import { getCurrentWindow } from '@tauri-apps/api/window';

export const isMainWindow = () => {
  return getCurrentWindow().label === 'main';
};
