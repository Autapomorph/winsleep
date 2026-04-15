export interface NotificationTime {
  id: string;
  seconds: number;
}

export const serializeNotificationTimes = (times: NotificationTime[]): number[] => {
  return times.map(t => t.seconds);
};

export const deserializeNotificationTimes = (secondsArray: number[]): NotificationTime[] => {
  return secondsArray.map(seconds => ({
    id: crypto.randomUUID(),
    seconds,
  }));
};
