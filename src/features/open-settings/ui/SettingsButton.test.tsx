import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SettingsButton } from './SettingsButton';

const mockNavigate = vi.fn();

vi.mock(import('react-router'), async importOriginal => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}));

vi.mock(import('react-i18next'), async importOriginal => {
  const { createMockUseTranslation } = await import('@/tests/i18nMock');
  return {
    ...(await importOriginal()),
    useTranslation: createMockUseTranslation(),
  };
});

describe('SettingsButton', () => {
  test('navigates to /settings when clicked', async () => {
    render(<SettingsButton />);

    await userEvent.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });
});
