import { loadAndApplySettings } from './loadAndApplySettings';
import { useSettingsStore } from './settings.store';

const { mockLoadSettings, mockSetIsTrayModeEnabled } = vi.hoisted(() => ({
  mockLoadSettings: vi.fn(),
  mockSetIsTrayModeEnabled: vi.fn().mockResolvedValue(undefined),
}));

vi.mock(import('@/shared/api'), () => ({
  typedInvoke: vi.fn().mockImplementation((cmd: string, args?: unknown) => {
    if (cmd === 'load_settings') {
      return mockLoadSettings() as Promise<unknown>;
    }

    if (cmd === 'set_is_tray_mode_enabled') {
      return mockSetIsTrayModeEnabled(args) as Promise<unknown>;
    }

    return Promise.resolve();
  }),
}));

describe('loadAndApplySettings', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
  });

  test('saves current settings immediately if loaded data is null (file not found)', async () => {
    mockLoadSettings.mockResolvedValueOnce(null);

    const onLoadingChange = vi.fn();
    const saveSettings = vi.fn();

    await loadAndApplySettings(onLoadingChange, saveSettings);

    expect(onLoadingChange).toHaveBeenCalledWith(true);
    expect(onLoadingChange).toHaveBeenCalledWith(false);
    expect(saveSettings).toHaveBeenCalledWith(expect.any(Object));
  });

  test('applies loaded settings, syncs tray mode, and does not save if version matches', async () => {
    const onLoadingChange = vi.fn();
    const saveSettings = vi.fn();
    const loadedData = {
      version: 0,
      defaultTimerSeconds: 450,
      isTrayModeEnabled: true,
    };

    mockLoadSettings.mockResolvedValueOnce(loadedData);

    await loadAndApplySettings(onLoadingChange, saveSettings);

    expect(useSettingsStore.getState().defaultTimerSeconds).toBe(450);
    expect(saveSettings).not.toHaveBeenCalled();
    expect(mockSetIsTrayModeEnabled).toHaveBeenCalledWith({ isEnabled: true });
  });

  test('saves settings if loaded settings version is older than CURRENT_SETTINGS_VERSION', async () => {
    const onLoadingChange = vi.fn();
    const saveSettings = vi.fn();
    // CURRENT_SETTINGS_VERSION is 0. If data version is -1, it should trigger saveSettings.
    const loadedData = {
      version: -1,
      defaultTimerSeconds: 500,
    };

    mockLoadSettings.mockResolvedValueOnce(loadedData);

    await loadAndApplySettings(onLoadingChange, saveSettings);

    expect(useSettingsStore.getState().defaultTimerSeconds).toBe(500);
    expect(saveSettings).toHaveBeenCalled();
  });

  test('catches and logs load errors internally without throwing', async () => {
    const onLoadingChange = vi.fn();
    const saveSettings = vi.fn();

    mockLoadSettings.mockRejectedValueOnce(new Error('Load error'));

    await expect(loadAndApplySettings(onLoadingChange, saveSettings)).resolves.not.toThrow();
  });

  test('does not throw when tray mode synchronization fails', async () => {
    const onLoadingChange = vi.fn();
    const saveSettings = vi.fn();
    const loadedData = {
      version: 0,
      isTrayModeEnabled: true,
    };

    mockLoadSettings.mockResolvedValueOnce(loadedData);
    mockSetIsTrayModeEnabled.mockRejectedValueOnce(new Error('Tray sync failed'));

    await expect(loadAndApplySettings(onLoadingChange, saveSettings)).resolves.not.toThrow();
  });
});
