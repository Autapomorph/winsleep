import { DEFAULT_CUSTOM_NOTIFICATION_SOUND } from '@/shared/config';
import { playTone } from './playTone';
import { logger } from '../logger/logger';

export interface Tone {
  freq: number;
  startTime: number;
  duration: number;
}

export const playCustomNotificationSound = (tones: Tone[] = DEFAULT_CUSTOM_NOTIFICATION_SOUND) => {
  try {
    const audioContext = new AudioContext();
    const now = audioContext.currentTime;

    tones.forEach(({ freq, startTime, duration }) => {
      playTone(audioContext, freq, now + startTime, duration);
    });
  } catch (error) {
    logger.error(`Failed to play custom notification sound: ${error}`);
  }
};
