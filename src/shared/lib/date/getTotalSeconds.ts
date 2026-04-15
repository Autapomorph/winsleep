export const getTotalSeconds = (hours: number, minutes: number, seconds: number) => {
  return hours * 3600 + minutes * 60 + seconds;
};
