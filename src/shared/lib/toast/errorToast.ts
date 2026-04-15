import i18n, { type SelectorParam } from 'i18next';
import { toast } from '@heroui/react';

const ERROR_TOAST_TIMEOUT_MS = 6000;

export const showErrorToast = (
  keyOrTitle?: SelectorParam | string,
  description?: string,
  timeout: number = ERROR_TOAST_TIMEOUT_MS,
) => {
  let title = '';

  if (typeof keyOrTitle === 'function') {
    title = i18n.t(keyOrTitle);
  } else if (typeof keyOrTitle === 'string') {
    title = keyOrTitle;
  } else {
    title = i18n.t($ => $.common.errors.messages.defaultTitle);
  }

  const fallbackMsg = i18n.t($ => $.common.errors.messages.defaultMessage);
  const finalDescription = description ?? (keyOrTitle ? undefined : fallbackMsg);

  toast.danger(title, {
    description: finalDescription,
    timeout,
  });
};
