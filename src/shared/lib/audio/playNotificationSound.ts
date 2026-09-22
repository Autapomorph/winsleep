import { DEFAULT_NOTIFICATION_SOUND } from '@/shared/config';
import { playTone } from './playTone';
import { logger } from '../logger/logger';

export interface Tone {
  freq: number;
  startTime: number;
  duration: number;
}

export const playNotificationSound = (tones: Tone[] = DEFAULT_NOTIFICATION_SOUND) => {
  try {
    const audioContext = new AudioContext();
    const now = audioContext.currentTime;

    let latestStopTime = -1;
    let lastOscillator: OscillatorNode | null = null;

    for (const { freq, startTime, duration } of tones) {
      const stopTime = now + startTime + duration;
      const osc = playTone(audioContext, freq, now + startTime, duration);

      if (stopTime > latestStopTime) {
        latestStopTime = stopTime;
        lastOscillator = osc;
      }
    }

    if (lastOscillator) {
      lastOscillator.onended = () => {
        audioContext.close?.().catch(error => {
          logger.error(`Failed to close AudioContext: ${error}`);
        });
      };
    } else {
      audioContext.close?.().catch(error => {
        logger.error(`Failed to close AudioContext: ${error}`);
      });
    }
  } catch (error) {
    logger.error(`Failed to play notification sound: ${error}`);
  }
};
