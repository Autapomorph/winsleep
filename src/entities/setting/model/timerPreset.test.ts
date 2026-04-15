import { deserializeCustomTimerPresets, serializeCustomTimerPresets } from './timerPreset';

describe('timerPreset utilities', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('12345678-1234-1234-1234-1234567890ab');
  });

  test('correctly serializes CustomTimerPreset objects into seconds array', () => {
    const presets = [
      { id: '1', seconds: 60 },
      { id: '2', seconds: 120 },
    ];

    const result = serializeCustomTimerPresets(presets);

    expect(result).toEqual([60, 120]);
  });

  test('correctly deserializes seconds array into CustomTimerPreset objects', () => {
    const result = deserializeCustomTimerPresets([60, 120]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: '12345678-1234-1234-1234-1234567890ab', seconds: 60 });
    expect(result[1]).toEqual({ id: '12345678-1234-1234-1234-1234567890ab', seconds: 120 });
  });
});
