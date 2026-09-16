// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type LogMessageCommandArgs = {
  level: string;
  message: string;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ReadLogsCommandArgs = {
  offset?: number;
  limit?: number;
};

export interface LogChunk {
  data: string;
  hasMore: boolean;
}
