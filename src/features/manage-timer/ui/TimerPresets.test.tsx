import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useSettingsStore } from '@/entities/setting';
import { TimerPresets } from './TimerPresets';

vi.mock(import('@/shared/config'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    DEFAULT_TIMER_PRESETS: [0, 60, 300],
  };
});

vi.mock(import('react-i18next'), async importOriginal => {
  const { createMockUseTranslation } = await import('@/tests/i18nMock');
  return {
    ...(await importOriginal()),
    useTranslation: createMockUseTranslation(),
  };
});

describe('TimerPresets', () => {
  beforeEach(() => {
    useSettingsStore.setState({ customTimerPresets: [] });
  });

  test('renders one button per default preset', () => {
    render(<TimerPresets setExactTime={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  test('calls setExactTime with the preset seconds value when clicked', async () => {
    const setExactTime = vi.fn();
    render(<TimerPresets setExactTime={setExactTime} />);

    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[1]);

    expect(setExactTime).toHaveBeenCalledTimes(1);
    expect(setExactTime).toHaveBeenCalledWith(60);
  });

  test('all preset buttons are disabled when isLocked=true', () => {
    render(<TimerPresets setExactTime={vi.fn()} isLocked />);

    screen.getAllByRole('button').forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });

  test('preset buttons are enabled when isLocked=false', () => {
    render(<TimerPresets setExactTime={vi.fn()} isLocked={false} />);

    screen.getAllByRole('button').forEach(btn => {
      expect(btn).not.toBeDisabled();
    });
  });

  test('renders one extra button for each custom preset added via settings store', () => {
    useSettingsStore.setState({
      customTimerPresets: [
        { id: 'custom-1', seconds: 9999 },
        { id: 'custom-2', seconds: 8888 },
      ],
    });

    render(<TimerPresets setExactTime={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  test('calls setExactTime with 0 when the "now" preset is clicked', async () => {
    const setExactTime = vi.fn();
    render(<TimerPresets setExactTime={setExactTime} />);

    await userEvent.click(screen.getAllByRole('button')[0]);

    expect(setExactTime).toHaveBeenCalledWith(0);
  });
});
