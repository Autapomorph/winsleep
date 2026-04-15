export const playTone = (
  audioContext: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
) => {
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
