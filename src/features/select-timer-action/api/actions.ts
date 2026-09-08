import {
  type RebootCommandArgs,
  type ShutdownCommandArgs,
  type SignoutCommandArgs,
  typedInvoke,
} from '@/shared/api';

export const pcSleep = async () => {
  await typedInvoke('pc_sleep');
};

export const pcHibernate = async () => {
  await typedInvoke('pc_hibernate');
};

export const pcShutdown = async (options?: ShutdownCommandArgs) => {
  await typedInvoke('pc_shutdown', options);
};

export const pcReboot = async (options?: RebootCommandArgs) => {
  await typedInvoke('pc_reboot', options);
};

export const pcLock = async () => {
  await typedInvoke('pc_lock');
};

export const pcSignout = async (options?: SignoutCommandArgs) => {
  await typedInvoke('pc_signout', options);
};
