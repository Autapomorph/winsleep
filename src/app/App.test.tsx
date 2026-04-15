import { render } from '@testing-library/react';

import { isMainWindow } from '@/shared/lib';
import { App } from './App';

vi.mock(import('react-router'), async importOriginal => ({
  ...(await importOriginal()),
  RouterProvider: () => <div data-testid="router-provider" />,
}));

vi.mock(import('@/features/check-updates'), async importOriginal => ({
  ...(await importOriginal()),
  ChangelogModal: () => <div data-testid="changelog-modal" />,
}));

vi.mock(import('@/features/global-context-menu'), async importOriginal => ({
  ...(await importOriginal()),
  GlobalContextMenu: () => <div data-testid="global-context-menu" />,
}));

vi.mock(import('@/shared/lib'), async importOriginal => ({
  ...(await importOriginal()),
  isMainWindow: vi.fn(),
  useGlobalErrorTracking: vi.fn(),
  useTabUnsuspend: vi.fn(),
}));

vi.mock(import('./init'), async importOriginal => ({
  ...(await importOriginal()),
  MainWindowInitializer: () => (<div data-testid="main-window-initializer" />) as unknown as null,
}));

vi.mock(import('./meta'), async importOriginal => ({
  ...(await importOriginal()),
  HeadData: () => null,
}));

vi.mock(import('./providers'), async importOriginal => ({
  ...(await importOriginal()),
  Providers: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));

vi.mock(import('./router'), async importOriginal => ({
  ...(await importOriginal()),
  router: {} as unknown as ReturnType<typeof import('react-router').createBrowserRouter>,
}));

describe('App', () => {
  test('renders correctly for main window', () => {
    vi.mocked(isMainWindow).mockReturnValue(true);

    const { getByTestId } = render(<App />);

    expect(getByTestId('changelog-modal')).toBeInTheDocument();
    expect(getByTestId('main-window-initializer')).toBeInTheDocument();
  });

  test('renders correctly for secondary window', () => {
    vi.mocked(isMainWindow).mockReturnValue(false);

    const { queryByTestId } = render(<App />);

    expect(queryByTestId('changelog-modal')).not.toBeInTheDocument();
    expect(queryByTestId('main-window-initializer')).not.toBeInTheDocument();
  });
});
