import i18n, { type SelectorParam } from 'i18next';
import { toast } from '@heroui/react';

const WARNING_TOAST_TIMEOUT_MS = 6 * 1000;

export const showWarningToast = (
  keyOrTitle: SelectorParam | string,
  description?: string,
  timeout: number = WARNING_TOAST_TIMEOUT_MS,
) => {
  const title = typeof keyOrTitle === 'function' ? i18n.t(keyOrTitle) : keyOrTitle;

  toast.warning(title, {
    description,
    timeout,
  });
};
