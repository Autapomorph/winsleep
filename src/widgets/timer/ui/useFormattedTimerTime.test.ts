import { renderHook } from '@testing-library/react';

import * as sharedLib from '@/shared/lib';
import { useFormattedTimerTime } from './useFormattedTimerTime';

vi.mock(import('react-i18next'), async importOriginal => {
  const { createMockUseTranslation } = await import('@/tests/i18nMock');
  return {
    ...(await importOriginal()),
    useTranslation: createMockUseTranslation({
      'timer.timerDisplay.today': 'Сегодня',
      'timer.timerDisplay.tomorrow': 'Завтра',
    }),
  };
});

describe('useFormattedTimerTime', () => {
  test('formats standard duration seconds', () => {
    const { result } = renderHook(() =>
      useFormattedTimerTime({
        currentSeconds: 90,
        timerMode: 'duration',
        targetDateTime: null,
        timerState: 'idle',
      }),
    );

    expect(result.current).toBe('1:30');
  });

  test('formats duration with days if >= 1 day', () => {
    const { result } = renderHook(() =>
      useFormattedTimerTime({
        currentSeconds: 86400 * 2,
        timerMode: 'duration',
        targetDateTime: null,
        timerState: 'idle',
      }),
    );

    expect(result.current).toContain('2');
  });

  test('formats timestamp mode for running timer under 1 day as time string', () => {
    const now = new Date('2026-09-12T12:00:00Z').getTime();
    vi.spyOn(sharedLib, 'useNow').mockReturnValue(now);

    const { result } = renderHook(() =>
      useFormattedTimerTime({
        currentSeconds: 3600,
        timerMode: 'timestamp',
        targetDateTime: now + 3600 * 1000,
        timerState: 'running',
      }),
    );

    expect(result.current).toBe('1:00:00');
  });

  test('formats timestamp mode as today when idle and target is today', () => {
    const now = new Date('2026-09-12T12:00:00Z').getTime();
    vi.spyOn(sharedLib, 'useNow').mockReturnValue(now);

    const { result } = renderHook(() =>
      useFormattedTimerTime({
        currentSeconds: 7200,
        timerMode: 'timestamp',
        targetDateTime: now + 7200 * 1000,
        timerState: 'idle',
      }),
    );

    expect(result.current).toBe('Сегодня');
  });

  test('formats timestamp mode as tomorrow when idle and target is tomorrow', () => {
    const now = new Date('2026-09-12T12:00:00Z').getTime();
    vi.spyOn(sharedLib, 'useNow').mockReturnValue(now);

    const tomorrow = new Date('2026-09-13T12:00:00Z').getTime();

    const { result } = renderHook(() =>
      useFormattedTimerTime({
        currentSeconds: 86400,
        timerMode: 'timestamp',
        targetDateTime: tomorrow,
        timerState: 'idle',
      }),
    );

    expect(result.current).toBe('Завтра');
  });
});
