import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TimerControls } from './TimerControls';

vi.mock(import('react-i18next'), async importOriginal => {
  const { createMockUseTranslation } = await import('@/tests/i18nMock');
  return {
    ...(await importOriginal()),
    useTranslation: createMockUseTranslation(),
  };
});

const baseProps = {
  timerMode: 'duration' as const,
  onStart: vi.fn(),
  onPause: vi.fn(),
  onResume: vi.fn(),
  onCancel: vi.fn(),
};

describe('TimerControls', () => {
  test('renders Start button when idle', () => {
    render(<TimerControls {...baseProps} timerState="idle" />);

    expect(
      screen.getByRole('button', { name: /timer\.startBtn\.aria\.label/ }),
    ).toBeInTheDocument();
  });

  test('calls onStart when Start button is pressed in idle state', async () => {
    render(<TimerControls {...baseProps} timerState="idle" />);

    await userEvent.click(screen.getByRole('button', { name: /timer\.startBtn\.aria\.label/ }));

    expect(baseProps.onStart).toHaveBeenCalledTimes(1);
  });

  test('renders Pause button when running', () => {
    render(<TimerControls {...baseProps} timerState="running" />);

    expect(
      screen.getByRole('button', { name: /timer\.pauseBtn\.aria\.label/ }),
    ).toBeInTheDocument();
  });

  test('calls onPause when Pause button is pressed in running state', async () => {
    render(<TimerControls {...baseProps} timerState="running" />);

    await userEvent.click(screen.getByRole('button', { name: /timer\.pauseBtn\.aria\.label/ }));

    expect(baseProps.onPause).toHaveBeenCalledTimes(1);
  });

  test('renders Resume button when paused', () => {
    render(<TimerControls {...baseProps} timerState="paused" />);

    expect(
      screen.getByRole('button', { name: /timer\.resumeBtn\.aria\.label/ }),
    ).toBeInTheDocument();
  });

  test('calls onResume when Resume button is pressed in paused state', async () => {
    render(<TimerControls {...baseProps} timerState="paused" />);

    await userEvent.click(screen.getByRole('button', { name: /timer\.resumeBtn\.aria\.label/ }));

    expect(baseProps.onResume).toHaveBeenCalledTimes(1);
  });

  test('Cancel button is disabled when idle', () => {
    render(<TimerControls {...baseProps} timerState="idle" />);

    expect(screen.getByRole('button', { name: /timer\.cancelBtn\.aria\.label/ })).toBeDisabled();
  });

  test('Cancel button is enabled when running', () => {
    render(<TimerControls {...baseProps} timerState="running" />);

    expect(
      screen.getByRole('button', { name: /timer\.cancelBtn\.aria\.label/ }),
    ).not.toBeDisabled();
  });

  test('calls onCancel when Cancel button is pressed', async () => {
    render(<TimerControls {...baseProps} timerState="running" />);

    await userEvent.click(screen.getByRole('button', { name: /timer\.cancelBtn\.aria\.label/ }));

    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('hides Pause button when running in timestamp mode', () => {
    render(<TimerControls {...baseProps} timerState="running" timerMode="timestamp" />);

    expect(
      screen.queryByRole('button', { name: /timer\.pauseBtn\.aria\.label/ }),
    ).not.toBeInTheDocument();
  });

  test('disables Pause, Resume, and Cancel buttons when isLocked is true, but leaves Start enabled', () => {
    // Start enabled when idle & locked
    const { rerender } = render(<TimerControls {...baseProps} timerState="idle" isLocked />);
    expect(screen.getByRole('button', { name: /timer\.startBtn\.aria\.label/ })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /timer\.cancelBtn\.aria\.label/ })).toBeDisabled();

    // Pause disabled when running & locked
    rerender(<TimerControls {...baseProps} timerState="running" isLocked />);
    expect(screen.getByRole('button', { name: /timer\.pauseBtn\.aria\.label/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /timer\.cancelBtn\.aria\.label/ })).toBeDisabled();

    // Resume disabled when paused & locked
    rerender(<TimerControls {...baseProps} timerState="paused" isLocked />);
    expect(screen.getByRole('button', { name: /timer\.resumeBtn\.aria\.label/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /timer\.cancelBtn\.aria\.label/ })).toBeDisabled();
  });
});
