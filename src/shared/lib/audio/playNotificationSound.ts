import { logger } from '../logger/logger';

export const playNotificationSound = () => {
  try {
    const audioContext = new AudioContext();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    playTone(659.25, now, 0.3); // E5
    playTone(880.0, now + 0.15, 0.5); // A5
  } catch (error) {
    logger.error(`Failed to play notification sound: ${error}`);
  }
};
