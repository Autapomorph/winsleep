import { initializeAppState } from '@/entities/app-state';
import { initializeSettings } from '@/entities/setting';
import { initializeI18n } from '@/shared/config';
import { initializePortable, isMainWindow } from '@/shared/lib';
import { bootstrap } from './bootstrap';

vi.mock(import('@/entities/app-state'), () => ({
  initializeAppState: vi.fn(),
}));

vi.mock(import('@/entities/setting'), () => ({
  initializeSettings: vi.fn(),
}));

vi.mock(import('@/shared/config'), () => ({
  initializeI18n: vi.fn(),
}));

vi.mock(import('@/shared/lib'), () => ({
  initializePortable: vi.fn(),
  isMainWindow: vi.fn(),
}));

describe('bootstrap', () => {
  test('initializes all services for main window', async () => {
    vi.mocked(isMainWindow).mockReturnValue(true);

    await bootstrap();

    expect(initializePortable).toHaveBeenCalledTimes(1);
    expect(initializeI18n).toHaveBeenCalledTimes(1);
    expect(initializeSettings).toHaveBeenCalledTimes(1);
    expect(initializeAppState).toHaveBeenCalledTimes(1);
  });

  test('skips settings and app state initialization for secondary window', async () => {
    vi.mocked(isMainWindow).mockReturnValue(false);

    await bootstrap();

    expect(initializePortable).toHaveBeenCalledTimes(1);
    expect(initializeI18n).toHaveBeenCalledTimes(1);
    expect(initializeSettings).not.toHaveBeenCalled();
    expect(initializeAppState).not.toHaveBeenCalled();
  });

  test('respects explicit isMain argument', async () => {
    vi.mocked(isMainWindow).mockReturnValue(true);

    await bootstrap(false);

    expect(initializePortable).toHaveBeenCalledTimes(1);
    expect(initializeI18n).toHaveBeenCalledTimes(1);
    expect(initializeSettings).not.toHaveBeenCalled();
    expect(initializeAppState).not.toHaveBeenCalled();
  });
});
