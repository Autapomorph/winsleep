import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useSessionStore } from '@/entities/session';
import { LockToggle } from './LockToggle';

vi.mock(import('react-i18next'), async importOriginal => {
  const { createMockUseTranslation } = await import('@/tests/i18nMock');
  return {
    ...(await importOriginal()),
    useTranslation: createMockUseTranslation(),
  };
});

describe('LockToggle', () => {
  beforeEach(() => {
    useSessionStore.setState({ isLocked: false });
  });

  test('renders a button with aria-label', () => {
    render(<LockToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('calls toggleLock when clicked', async () => {
    render(<LockToggle />);
    expect(useSessionStore.getState().isLocked).toBe(false);

    await userEvent.click(screen.getByRole('button'));
    expect(useSessionStore.getState().isLocked).toBe(true);
  });
});
