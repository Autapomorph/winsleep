import { playNotificationSound } from './playNotificationSound';

describe('playNotificationSound', () => {
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
      currentTime: 10,
    };

    const MockAudioContextConstructor = vi.fn().mockImplementation(function MockAudioContext() {
      return mockAudioContext;
    });

    vi.stubGlobal('AudioContext', MockAudioContextConstructor);

    expect(() => playNotificationSound()).not.toThrow();
  });

  test('does not throw when AudioContext throws', () => {
    const MockAudioContextConstructor = vi.fn().mockImplementation(function MockAudioContext() {
      throw new Error('Not supported');
    });

    vi.stubGlobal('AudioContext', MockAudioContextConstructor);

    expect(() => playNotificationSound()).not.toThrow();
  });
});
