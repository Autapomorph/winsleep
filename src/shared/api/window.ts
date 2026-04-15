import { getCurrentWindow } from '@tauri-apps/api/window';

export const windowMinimize = async () => {
  await getCurrentWindow().minimize();
};

export const windowClose = async () => {
  await getCurrentWindow().close();
};
