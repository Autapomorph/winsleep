import { type ErrorInfo, type ReactNode, Component } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CrashTestButton } from './CrashTestButton';

vi.mock(import('react-i18next'), async importOriginal => {
  const { createMockUseTranslation } = await import('@/tests/i18nMock');
  return {
    ...(await importOriginal()),
    useTranslation: createMockUseTranslation(),
  };
});

vi.mock(import('@/shared/lib'), async importOriginal => ({
  ...(await importOriginal()),
  useAppHotkey: vi.fn(),
}));

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Suppress error output in test logs
  }

  render() {
    const { error } = this.state;
    const { children } = this.props;

    if (error) {
      return <div data-testid="error-boundary">{error.message}</div>;
    }

    return children;
  }
}

describe('CrashTestButton', () => {
  test('renders the crash button without crashing on mount', () => {
    render(
      <ErrorBoundary>
        <CrashTestButton />
      </ErrorBoundary>,
    );

    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('triggers an error boundary when button is clicked', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <CrashTestButton />
      </ErrorBoundary>,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });
});
