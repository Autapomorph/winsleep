import { type SetKeepAwakeCommandArgs, typedInvoke } from '@/shared/api';

export const setKeepAwake = async (options: SetKeepAwakeCommandArgs) => {
  await typedInvoke('set_keep_awake', options);
};

export const getKeepAwakeStatus = async (): Promise<boolean> => {
  return typedInvoke('get_keep_awake_status');
};
