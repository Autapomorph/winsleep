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
