import { playTone } from './playTone';

describe('playTone', () => {
  test('creates oscillator, configures it, and plays the tone', () => {
    const mockOscillator = {
      type: '',
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    const mockAudioContext = {
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
      destination: {},
    } as unknown as AudioContext;

    playTone(mockAudioContext, 440, 10, 0.5);

    expect(mockOscillator.type).toBe('sine');
    expect(mockOscillator.frequency.value).toBe(440);
    expect(mockOscillator.connect).toHaveBeenCalledWith(mockGain);
    expect(mockOscillator.start).toHaveBeenCalledWith(10);
    expect(mockOscillator.stop).toHaveBeenCalledWith(10.5);

    expect(mockGain.gain.setValueAtTime).toHaveBeenCalledWith(0, 10);
    expect(mockGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.3, 10.05);
    expect(mockGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, 10.5);
    expect(mockGain.connect).toHaveBeenCalledWith(mockAudioContext.destination);
  });
});
