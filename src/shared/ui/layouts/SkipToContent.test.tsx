import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SkipToContent } from './SkipToContent';

vi.mock(import('react-i18next'), async importOriginal => {
  const { createMockUseTranslation } = await import('@/tests/i18nMock');
  return {
    ...(await importOriginal()),
    useTranslation: createMockUseTranslation(),
  };
});

describe('SkipToContent', () => {
  let mainElement: HTMLDivElement | null = null;

  afterEach(() => {
    if (mainElement) {
      mainElement.remove();
      mainElement = null;
    }
  });

  test('renders a button with skip-to-content label', () => {
    render(<SkipToContent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('focuses #main-content element when pressed', async () => {
    mainElement = document.createElement('div');
    mainElement.id = 'main-content';
    mainElement.tabIndex = -1;
    document.body.appendChild(mainElement);

    render(<SkipToContent />);

    await userEvent.click(screen.getByRole('button'));

    expect(document.activeElement).toBe(mainElement);
  });
});
