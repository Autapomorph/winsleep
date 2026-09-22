import { type SetKeepAwakeCommandArgs, typedInvoke } from '@/shared/api';

export const setKeepAwake = async (options: SetKeepAwakeCommandArgs) => {
  await typedInvoke('set_keep_awake', options);
};
