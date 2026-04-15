import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { TimerDisplay } from './TimerDisplay';

vi.mock(import('react-i18next'), async importOriginal => {
  const { createMockUseTranslation } = await import('@/tests/i18nMock');
  return {
    ...(await importOriginal()),
    useTranslation: createMockUseTranslation(),
  };
});

vi.mock(import('./TimerEditModal'), async importOriginal => ({
  ...(await importOriginal()),
  TimerEditModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="timer-edit-modal" /> : <span />,
}));

const baseProps = {
  currentSeconds: 300,
  formattedTime: '05:00',
  increaseTime: vi.fn(),
  decreaseTime: vi.fn(),
  setExactTime: vi.fn(),
  isDecreaseAllowed: true,
  isIncreaseAllowed: true,
};

describe('TimerDisplay', () => {
  beforeEach(() => {
    useTimerStore.setState({ timerState: 'idle' });
    useSettingsStore.setState({ isCustomTimerStepsEnabled: false });
  });

  test('renders the formatted time', () => {
    render(<TimerDisplay {...baseProps} />);
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  test('decrease button is disabled when isDecreaseAllowed=false', () => {
    render(<TimerDisplay {...baseProps} isDecreaseAllowed={false} />);

    expect(
      screen.getByRole('button', { name: /timer\.decreaseTimeBtn\.aria\.label/ }),
    ).toBeDisabled();
  });

  test('increase button is disabled when isIncreaseAllowed=false', () => {
    render(<TimerDisplay {...baseProps} isIncreaseAllowed={false} />);

    expect(
      screen.getByRole('button', { name: /timer\.increaseTimeBtn\.aria\.label/ }),
    ).toBeDisabled();
  });

  test('both buttons are disabled when isLocked=true', () => {
    render(<TimerDisplay {...baseProps} isLocked />);

    expect(
      screen.getByRole('button', { name: /timer\.decreaseTimeBtn\.aria\.label/ }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /timer\.increaseTimeBtn\.aria\.label/ }),
    ).toBeDisabled();
  });

  test('clicking the time display opens the edit modal', async () => {
    render(<TimerDisplay {...baseProps} />);

    expect(screen.queryByTestId('timer-edit-modal')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /timer\.editTimeBtn\.aria\.label/ }));

    expect(screen.getByTestId('timer-edit-modal')).toBeInTheDocument();
  });

  test('time display does not open modal when isLocked=true', async () => {
    render(<TimerDisplay {...baseProps} isLocked />);

    await userEvent.click(screen.getByRole('button', { name: /timer\.editTimeBtn\.aria\.label/ }));

    expect(screen.queryByTestId('timer-edit-modal')).not.toBeInTheDocument();
  });
});
