import { typedInvoke } from './typedInvoke';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ShutdownCommandArgs = {
  isForce?: boolean;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RebootCommandArgs = {
  isForce?: boolean;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SignoutCommandArgs = {
  isForce?: boolean;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SetKeepAwakeCommandArgs = {
  isEnabled: boolean;
  keepDisplayAwake?: boolean;
};

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
