import { typedInvoke, typedListen } from '@/shared/api';
import { initializeSettings } from './init';
import { loadAndApplySettings } from './loadAndApplySettings';
import { useSettingsStore } from './settings.store';

vi.mock(import('@/shared/api'), () => ({
  typedInvoke: vi.fn().mockResolvedValue(undefined),
  typedListen: vi.fn().mockResolvedValue(vi.fn()),
}));

vi.mock(import('./loadAndApplySettings'), () => ({
  loadAndApplySettings: vi.fn().mockImplementation(() => Promise.resolve()),
}));

describe('initializeSettings', () => {
  test('performs initial settings load and listens to external file changes', async () => {
    await initializeSettings();

    // Verify initial load has been called
    expect(loadAndApplySettings).toHaveBeenCalledTimes(1);

    // Verify external change listener registration
    expect(typedListen).toHaveBeenCalledWith('settings-external-change', expect.any(Function));
    const externalChangeHandler = vi.mocked(typedListen).mock.calls[0][1] as () => Promise<void>;

    // Trigger external change event
    await externalChangeHandler();

    // loadAndApplySettings should have been triggered again on reload
    expect(loadAndApplySettings).toHaveBeenCalledTimes(2);
  });

  test('handles save settings on store changes', async () => {
    vi.mocked(typedInvoke).mockRejectedValueOnce(new Error('Save failed'));

    await initializeSettings();

    // Trigger store subscription manually by updating setting
    useSettingsStore.getState().setDefaultTimerSeconds(400);

    expect(typedInvoke).toHaveBeenCalledWith('save_settings', expect.any(Object));
  });

  test('handles failure when listening to settings external changes', async () => {
    vi.mocked(typedListen).mockRejectedValueOnce(new Error('Listen failed'));

    // Should catch listener registration error without crashing
    await expect(initializeSettings()).resolves.toBeUndefined();
  });
});
