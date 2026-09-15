import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import { useKeepAwakeStore } from '@/entities/keep-awake';
import { useTimerStore } from '@/entities/timer';
import { TimerEditModal } from './TimerEditModal';

vi.mock(import('react-i18next'), async importOriginal => {
  const { createMockUseTranslation } = await import('@/tests/i18nMock');
  return {
    ...(await importOriginal()),
    useTranslation: createMockUseTranslation(),
  };
});

class ResizeObserverMock {
  observe = vi.fn();

  unobserve = vi.fn();

  disconnect = vi.fn();
}

vi.mock('./DurationPickerPanel', () => ({
  DurationPickerPanel: ({
    onChangeHours,
    onChangeMinutes,
    onChangeSeconds,
  }: {
    onChangeHours: (h: number) => void;
    onChangeMinutes: (m: number) => void;
    onChangeSeconds: (s: number) => void;
  }) => (
    <div data-testid="duration-picker-panel">
      <button
        type="button"
        onClick={() => {
          onChangeHours(1);
          onChangeMinutes(30);
          onChangeSeconds(0);
        }}
      >
        Change Duration
      </button>
    </div>
  ),
}));

vi.mock('./TimestampPickerPanel', () => ({
  TimestampPickerPanel: ({
    onChange,
    onValidityChange,
  }: {
    onChange: (ts: number) => void;
    onValidityChange: (valid: boolean) => void;
  }) => (
    <div data-testid="timestamp-picker-panel">
      <button type="button" onClick={() => onChange(1750000000000)}>
        Change Timestamp
      </button>
      <button type="button" onClick={() => onValidityChange(false)}>
        Invalidate Timestamp
      </button>
    </div>
  ),
}));

describe('TimerEditModal', () => {
  const mockSetExactTime = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeAll(() => {
    window.ResizeObserver = ResizeObserverMock;
    globalThis.ResizeObserver = ResizeObserverMock;
    Element.prototype.getAnimations = vi.fn().mockReturnValue([]);
  });

  afterAll(() => {
    delete (Element.prototype as unknown as { getAnimations?: unknown }).getAnimations;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useTimerStore.setState({
      timerState: 'idle',
      timerMode: 'duration',
      targetDateTime: null,
      plannedSeconds: 300,
      remainingSeconds: 300,
    });
    useKeepAwakeStore.setState({
      isIndefiniteActive: false,
    });
  });

  test('submits duration mode calling setExactTime with updated values', async () => {
    render(
      <TimerEditModal
        isOpen
        currentSeconds={300}
        setExactTime={mockSetExactTime}
        onOpenChange={mockOnOpenChange}
      />,
    );

    await userEvent.click(screen.getByText('Change Duration'));

    const submitBtn = screen.getByRole('button', {
      name: /timer\.timerEditModal\.submitBtn\.text/,
    });
    await userEvent.click(submitBtn);

    expect(mockSetExactTime).toHaveBeenCalledWith(5400);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  test('submits timestamp mode calling setTargetDateTime and updating store state', async () => {
    useTimerStore.setState({
      timerState: 'running',
      timerMode: 'timestamp',
      targetDateTime: 1740000000000,
    });
    const setTargetDateTimeSpy = vi.spyOn(useTimerStore.getState(), 'setTargetDateTime');

    render(
      <TimerEditModal
        isOpen
        currentSeconds={300}
        setExactTime={mockSetExactTime}
        onOpenChange={mockOnOpenChange}
      />,
    );

    await userEvent.click(screen.getByText('Change Timestamp'));

    const submitBtn = screen.getByRole('button', {
      name: /timer\.timerEditModal\.submitBtn\.text/,
    });
    await userEvent.click(submitBtn);

    expect(setTargetDateTimeSpy).toHaveBeenCalledWith(1750000000000);
    expect(useTimerStore.getState().targetDateTime).toBe(1750000000000);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  test('transitions from indefinite keep-awake to running timestamp timer on submit', async () => {
    useKeepAwakeStore.setState({ isIndefiniteActive: true });
    const stopIndefiniteSpy = vi.spyOn(useKeepAwakeStore.getState(), 'stopIndefinite');
    const startSpy = vi.spyOn(useTimerStore.getState(), 'start');

    render(
      <TimerEditModal
        isOpen
        currentSeconds={0}
        setExactTime={mockSetExactTime}
        onOpenChange={mockOnOpenChange}
      />,
    );

    // Switch to timestamp tab
    fireEvent.click(
      screen.getByRole('tab', { name: /timer\.timerEditModal\.modes\.tabs\.title\.timestamp/ }),
    );

    await userEvent.click(screen.getByText('Change Timestamp'));

    const submitBtn = screen.getByRole('button', {
      name: /timer\.timerEditModal\.submitBtn\.text/,
    });
    await userEvent.click(submitBtn);

    expect(stopIndefiniteSpy).toHaveBeenCalled();
    expect(startSpy).toHaveBeenCalled();
    expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(false);
    expect(useTimerStore.getState().timerState).toBe('running');
    expect(useTimerStore.getState().timerMode).toBe('timestamp');
    expect(useTimerStore.getState().targetDateTime).toBe(1750000000000);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  test('disables submit button and prevents submission when timestamp is invalid', async () => {
    useTimerStore.setState({ timerMode: 'timestamp' });
    const setTargetDateTimeSpy = vi.spyOn(useTimerStore.getState(), 'setTargetDateTime');

    render(
      <TimerEditModal
        isOpen
        currentSeconds={300}
        setExactTime={mockSetExactTime}
        onOpenChange={mockOnOpenChange}
      />,
    );

    await userEvent.click(screen.getByText('Invalidate Timestamp'));

    const submitBtn = screen.getByRole('button', {
      name: /timer\.timerEditModal\.submitBtn\.text/,
    });
    expect(submitBtn).toBeDisabled();

    fireEvent.click(submitBtn);
    expect(setTargetDateTimeSpy).not.toHaveBeenCalled();
  });

  test('closes modal on cancel button click without saving', async () => {
    render(
      <TimerEditModal
        isOpen
        currentSeconds={300}
        setExactTime={mockSetExactTime}
        onOpenChange={mockOnOpenChange}
      />,
    );

    const cancelBtn = screen.getByRole('button', {
      name: /timer\.cancelBtn\.text/,
    });
    await userEvent.click(cancelBtn);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    expect(mockSetExactTime).not.toHaveBeenCalled();
  });
});
