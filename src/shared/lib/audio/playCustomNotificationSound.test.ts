import { type Tone, playCustomNotificationSound } from './playCustomNotificationSound';
import { playTone } from './playTone';

vi.mock(import('./playTone'), () => ({
  playTone: vi.fn(),
}));

describe('playCustomNotificationSound', () => {
  const customTones: Tone[] = [
    // E5
    {
      freq: 659.25,
      startTime: 0,
      duration: 0.3,
    },

    // A5
    {
      freq: 880.0,
      startTime: 0 + 0.15,
      duration: 0.5,
    },
  ];

  test('creates AudioContext and calls playTone twice', () => {
    const mockAudioContext = {
      currentTime: 10,
    };

    const MockAudioContextConstructor = vi.fn().mockImplementation(function MockAudioContext() {
      return mockAudioContext;
    });

    vi.stubGlobal('AudioContext', MockAudioContextConstructor);

    expect(() => playCustomNotificationSound(customTones)).not.toThrow();

    expect(playTone).toHaveBeenNthCalledWith(1, mockAudioContext, 659.25, 10, 0.3);
    expect(playTone).toHaveBeenNthCalledWith(2, mockAudioContext, 880.0, 10.15, 0.5);
  });

  test('does not throw when AudioContext throws', () => {
    const MockAudioContextConstructor = vi.fn().mockImplementation(function MockAudioContext() {
      throw new Error('Web Audio not supported');
    });

    vi.stubGlobal('AudioContext', MockAudioContextConstructor);

    expect(() => playCustomNotificationSound(customTones)).not.toThrow();
    expect(playTone).not.toHaveBeenCalled();
  });
});
