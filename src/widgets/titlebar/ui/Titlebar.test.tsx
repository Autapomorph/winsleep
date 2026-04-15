import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { windowClose, windowMinimize } from '@/shared/api';
import { Titlebar } from './Titlebar';

vi.mock(import('react-i18next'), async importOriginal => {
  const { createMockUseTranslation } = await import('@/tests/i18nMock');
  return {
    ...(await importOriginal()),
    useTranslation: createMockUseTranslation(),
  };
});

vi.mock(import('@/shared/api'), async importOriginal => ({
  ...(await importOriginal()),
  windowMinimize: vi.fn().mockResolvedValue(undefined),
  windowClose: vi.fn().mockResolvedValue(undefined),
}));

vi.mock(import('@/features/check-updates'), async importOriginal => ({
  ...(await importOriginal()),
  UpdateButton: () => <span />,
}));

vi.mock(import('./menu/Menu'), async importOriginal => ({
  ...(await importOriginal()),
  Menu: () => <span />,
}));

vi.mock(import('@/assets/logo_full.svg?react'), () => ({
  default: () => <svg data-testid="logo" />,
}));

describe('Titlebar', () => {
  test('renders a header element', () => {
    render(<Titlebar />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  test('calls windowMinimize when minimize button is clicked', async () => {
    render(<Titlebar />);

    await userEvent.click(
      screen.getByRole('button', { name: /titlebar\.minimizeBtn\.aria\.label/ }),
    );

    expect(windowMinimize).toHaveBeenCalledTimes(1);
  });

  test('calls windowClose when close button is clicked', async () => {
    render(<Titlebar />);

    await userEvent.click(screen.getByRole('button', { name: /titlebar\.closeBtn\.aria\.label/ }));

    expect(windowClose).toHaveBeenCalledTimes(1);
  });

  test('maximize button is disabled', () => {
    render(<Titlebar />);

    expect(
      screen.getByRole('button', { name: /titlebar\.maximizeBtn\.aria\.label/ }),
    ).toBeDisabled();
  });
});
