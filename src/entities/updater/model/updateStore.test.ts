import { relaunch } from '@tauri-apps/plugin-process';
import { type Update, check } from '@tauri-apps/plugin-updater';

import { MOCK_CHANGELOG, MOCK_VERSION } from './mockUpdate';
import { useUpdateStore } from './updateStore';

let mockIsDev = false;

vi.mock(import('@tauri-apps/plugin-process'), () => ({
  relaunch: vi.fn(() => Promise.resolve()),
}));

vi.mock(import('@tauri-apps/plugin-updater'), () => ({
  check: vi.fn(),
}));

vi.mock(import('@tauri-apps/plugin-os'), () => ({
  platform: vi.fn(() => 'windows'),
  arch: vi.fn(() => 'x86_64'),
}));

vi.mock(import('@/shared/config'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    config: {
      ...original.config,
      get isDev() {
        return mockIsDev;
      },
    },
  };
});

vi.mock(import('@/shared/lib'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    showErrorToast: vi.fn(),
    delay: (ms: number, signal?: AbortSignal) => {
      if (ms === 25) {
        return Promise.resolve();
      }

      return original.delay(ms, signal).catch(err => {
        if (err instanceof Error && err.name === 'AbortError') {
          throw err;
        }

        if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
          const abortErr = new Error('Aborted');
          abortErr.name = 'AbortError';
          throw abortErr;
        }

        throw err;
      });
    },
  };
});

describe('updateStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockIsDev = false;
    useUpdateStore.getState().resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should initialize with default state', () => {
    const state = useUpdateStore.getState();

    expect(state.status).toBe('idle');
    expect(state.updateInfo).toBeNull();
    expect(state.downloadProgress).toBe(0);
    expect(state.errorMessage).toBeNull();
    expect(state.isChangelogOpen).toBe(false);
  });

  test('should handle checkUpdates when no update is available', async () => {
    vi.mocked(check).mockResolvedValueOnce(null);

    await useUpdateStore.getState().checkUpdates();

    const state = useUpdateStore.getState();

    expect(state.status).toBe('upToDate');
    expect(state.updateInfo).toBeNull();
  });

  test('should handle checkUpdates error', async () => {
    vi.mocked(check).mockRejectedValueOnce(new Error('Network error'));

    await useUpdateStore.getState().checkUpdates();

    const state = useUpdateStore.getState();

    expect(state.status).toBe('error');
    expect(state.errorMessage).toBe('Network error');
  });

  test('should skip checkUpdates if status is already checking or downloading', async () => {
    useUpdateStore.setState({ status: 'checking' });
    await useUpdateStore.getState().checkUpdates();
    expect(check).not.toHaveBeenCalled();

    useUpdateStore.setState({ status: 'downloading' });
    await useUpdateStore.getState().checkUpdates();
    expect(check).not.toHaveBeenCalled();
  });

  test('should run downloadAndInstall during installUpdate', async () => {
    const mockDownloadAndInstall = vi.fn(async onEvent => {
      if (onEvent) {
        onEvent({ event: 'Started', data: { contentLength: 100 } });
        onEvent({ event: 'Progress', data: { chunkLength: 50 } });
        onEvent({ event: 'Finished', data: {} });
        // Cover fallback branch
        onEvent({ event: 'UnknownEvent', data: {} });
      }
    });

    const mockUpdate = {
      version: '2.1.0',
      downloadAndInstall: mockDownloadAndInstall,
    };

    vi.mocked(check).mockResolvedValueOnce(
      mockUpdate as unknown as Awaited<ReturnType<typeof check>>,
    );

    // checkUpdates calls installUpdate in background, wait for it
    await useUpdateStore.getState().checkUpdates();
    // Flush microtasks
    await vi.advanceTimersByTimeAsync(0);

    const state = useUpdateStore.getState();
    expect(state.status).toBe('readyToRestart');
    expect(state.downloadProgress).toBe(100);
  });

  test('should ignore installUpdate if no updateInfo or already downloading', async () => {
    useUpdateStore.setState({ updateInfo: null, status: 'idle' });
    await useUpdateStore.getState().installUpdate();
    expect(useUpdateStore.getState().status).toBe('idle');

    useUpdateStore.setState({ updateInfo: {} as unknown as Update, status: 'downloading' });
    await useUpdateStore.getState().installUpdate();
    expect(useUpdateStore.getState().status).toBe('downloading');
  });

  test('should handle installUpdate failure and capture errors', async () => {
    const mockDownloadAndInstall = vi.fn(async () => {
      throw new Error('Disk full');
    });

    const mockUpdate = {
      version: '2.1.0',
      downloadAndInstall: mockDownloadAndInstall,
    };

    useUpdateStore.setState({ updateInfo: mockUpdate as unknown as Update, status: 'idle' });
    await useUpdateStore.getState().installUpdate();

    const state = useUpdateStore.getState();
    expect(state.status).toBe('error');
    expect(state.errorMessage).toBe('Disk full');
  });

  test('should open and close changelog', () => {
    useUpdateStore.getState().openChangelog('2.0.0');
    expect(useUpdateStore.getState().isChangelogOpen).toBe(true);
    expect(useUpdateStore.getState().changelogVersion).toBe('2.0.0');

    useUpdateStore.getState().closeChangelog();
    expect(useUpdateStore.getState().isChangelogOpen).toBe(false);
    expect(useUpdateStore.getState().changelogVersion).toBeNull();
  });

  test('should trigger relaunch in production mode', async () => {
    mockIsDev = false;
    await useUpdateStore.getState().relaunchApp();
    expect(relaunch).toHaveBeenCalled();
  });

  test('should bypass relaunch in dev mode and reload location', async () => {
    mockIsDev = true;
    const originalLocation = window.location;
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: { reload: mockReload },
    });

    try {
      await useUpdateStore.getState().relaunchApp();
      expect(relaunch).not.toHaveBeenCalled();
      expect(mockReload).toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'location', {
        writable: true,
        configurable: true,
        value: originalLocation,
      });
    }
  });

  test('handles simulated mock updates and aborts correctly', async () => {
    const store = useUpdateStore.getState();

    // Trigger mock update (simulate checking...)
    const mockPromise = store.triggerMockUpdate();

    expect(useUpdateStore.getState().status).toBe('checking');

    // Run check duration (3s check simulation)
    await vi.advanceTimersByTimeAsync(3000);

    // Wait for promise resolution
    await mockPromise;

    // Since download steps are mocked to resolve instantly, the status goes straight to readyToRestart!
    expect(useUpdateStore.getState().status).toBe('readyToRestart');

    // Calling triggerMockUpdate when not idle resets the store immediately
    await useUpdateStore.getState().triggerMockUpdate();
    expect(useUpdateStore.getState().status).toBe('idle');
  });

  test('handles abort error during triggerMockUpdate', async () => {
    const store = useUpdateStore.getState();

    const mockPromise = store.triggerMockUpdate();

    // Abort early
    store.resetStore();

    await vi.advanceTimersByTimeAsync(3000);
    await mockPromise;

    expect(useUpdateStore.getState().status).toBe('idle');
  });

  test('should initialize with default changelog state', () => {
    const state = useUpdateStore.getState();
    expect(state.changelog).toBe('');
    expect(state.isChangelogLoading).toBe(false);
    expect(state.changelogError).toBeNull();
  });

  test('should open changelog and trigger fetchChangelog', async () => {
    const fetchSpy = vi
      .spyOn(useUpdateStore.getState(), 'fetchChangelog')
      .mockImplementation(async () => {});

    useUpdateStore.getState().openChangelog('1.0.0');

    expect(useUpdateStore.getState().isChangelogOpen).toBe(true);
    expect(useUpdateStore.getState().changelogVersion).toBe('1.0.0');
    expect(fetchSpy).toHaveBeenCalledWith('1.0.0');

    fetchSpy.mockRestore();
  });

  test('should fetch mock changelog', async () => {
    const fetchPromise = useUpdateStore.getState().fetchChangelog(MOCK_VERSION);

    expect(useUpdateStore.getState().isChangelogLoading).toBe(true);
    expect(useUpdateStore.getState().changelogError).toBeNull();

    await vi.advanceTimersByTimeAsync(3000);
    await fetchPromise;

    const state = useUpdateStore.getState();
    expect(state.isChangelogLoading).toBe(false);
    expect(state.changelog).toBe(MOCK_CHANGELOG);
  });

  test('should fetch git release notes successfully', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ body: 'Release body text' }), { status: 200 }),
      );

    await useUpdateStore.getState().fetchChangelog('v1.2.3');

    const state = useUpdateStore.getState();
    expect(state.isChangelogLoading).toBe(false);
    expect(state.changelog).toBe('Release body text');
    expect(state.changelogError).toBeNull();

    fetchSpy.mockRestore();
  });

  test('should handle git release notes fetch failure on both primary and proxy', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 404 }));

    await useUpdateStore.getState().fetchChangelog('v1.2.3');

    const state = useUpdateStore.getState();
    expect(state.isChangelogLoading).toBe(false);
    expect(state.changelogError).toContain('404');

    fetchSpy.mockRestore();
  });

  test('should fallback to proxy when primary GitHub API release notes fetch fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async url => {
      if (typeof url === 'string' && url.includes('api.github.com')) {
        return new Response(null, { status: 500 });
      }

      return new Response(JSON.stringify({ notes: 'Proxy release notes' }), { status: 200 });
    });

    await useUpdateStore.getState().fetchChangelog('v1.2.3');

    const state = useUpdateStore.getState();
    expect(state.isChangelogLoading).toBe(false);
    expect(state.changelog).toBe('Proxy release notes');
    expect(state.changelogError).toBeNull();

    fetchSpy.mockRestore();
  });
});
