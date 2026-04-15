import { typedInvoke } from '@/shared/api';

export const pcSleep = async () => {
  await typedInvoke('pc_sleep');
};

export const pcHibernate = async () => {
  await typedInvoke('pc_hibernate');
};

export const pcShutdown = async () => {
  await typedInvoke('pc_shutdown');
};

export const pcReboot = async () => {
  await typedInvoke('pc_reboot');
};

export const pcLock = async () => {
  await typedInvoke('pc_lock');
};

export const pcSignout = async () => {
  await typedInvoke('pc_signout');
};
