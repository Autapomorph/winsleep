import i18n, { type SelectorParam } from 'i18next';
import { toast } from '@heroui/react';

const INFO_TOAST_TIMEOUT_MS = 4 * 1000;

export const showInfoToast = (
  keyOrTitle: SelectorParam | string,
  description?: string,
  timeout: number = INFO_TOAST_TIMEOUT_MS,
) => {
  const title = typeof keyOrTitle === 'function' ? i18n.t(keyOrTitle) : keyOrTitle;

  toast.info(title, {
    description,
    timeout,
  });
};
