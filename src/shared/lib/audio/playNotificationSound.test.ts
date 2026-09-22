import { type Tone, playNotificationSound } from './playNotificationSound';
import { playTone } from './playTone';

vi.mock(import('./playTone'), () => ({
  playTone: vi.fn(),
}));

describe('playNotificationSound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  test('creates AudioContext, calls playTone, and attaches onended to the last oscillator', () => {
    const mockOsc1 = { onended: null as (() => void) | null };
    const mockOsc2 = { onended: null as (() => void) | null };

    vi.mocked(playTone)
      .mockReturnValueOnce(mockOsc1 as unknown as OscillatorNode)
      .mockReturnValueOnce(mockOsc2 as unknown as OscillatorNode);

    const mockClose = vi.fn().mockResolvedValue(undefined);
    const mockAudioContext = {
      currentTime: 10,
      close: mockClose,
    };

    const MockAudioContextConstructor = vi.fn().mockImplementation(function MockAudioContext() {
      return mockAudioContext;
    });

    vi.stubGlobal('AudioContext', MockAudioContextConstructor);

    expect(() => playNotificationSound(customTones)).not.toThrow();

    expect(playTone).toHaveBeenNthCalledWith(1, mockAudioContext, 659.25, 10, 0.3);
    expect(playTone).toHaveBeenNthCalledWith(2, mockAudioContext, 880.0, 10.15, 0.5);

    // Osc1 (ends at 10.3) shouldn't have onended attached
    expect(mockOsc1.onended).toBeNull();

    // Osc2 (ends at 10.65) is the last oscillator, so onended must be set
    expect(mockOsc2.onended).toBeTypeOf('function');
    expect(mockClose).not.toHaveBeenCalled();

    // Trigger onended event
    mockOsc2.onended?.();

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  test('closes AudioContext immediately when tones array is empty', () => {
    const mockClose = vi.fn().mockResolvedValue(undefined);
    const mockAudioContext = {
      currentTime: 10,
      close: mockClose,
    };

    const MockAudioContextConstructor = vi.fn().mockImplementation(function MockAudioContext() {
      return mockAudioContext;
    });

    vi.stubGlobal('AudioContext', MockAudioContextConstructor);

    expect(() => playNotificationSound([])).not.toThrow();

    expect(playTone).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  test('handles rejection when audioContext.close fails', () => {
    const mockOsc = { onended: null as (() => void) | null };
    vi.mocked(playTone).mockReturnValue(mockOsc as unknown as OscillatorNode);

    const mockClose = vi.fn().mockRejectedValue(new Error('Failed to close'));
    const mockAudioContext = {
      currentTime: 10,
      close: mockClose,
    };

    const MockAudioContextConstructor = vi.fn().mockImplementation(function MockAudioContext() {
      return mockAudioContext;
    });

    vi.stubGlobal('AudioContext', MockAudioContextConstructor);

    expect(() => playNotificationSound(customTones)).not.toThrow();

    expect(() => mockOsc.onended?.()).not.toThrow();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  test('does not throw when AudioContext throws', () => {
    const MockAudioContextConstructor = vi.fn().mockImplementation(function MockAudioContext() {
      throw new Error('Web Audio not supported');
    });

    vi.stubGlobal('AudioContext', MockAudioContextConstructor);

    expect(() => playNotificationSound(customTones)).not.toThrow();
    expect(playTone).not.toHaveBeenCalled();
  });
});
