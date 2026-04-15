import type { TFunction } from 'i18next';
import i18n from 'i18next';
import { act, renderHook } from '@testing-library/react';

import type { SupportedLocale } from '@/shared/config';
import { useDevLanguageShortcut } from './lib/useDevLanguageShortcut';

vi.mock(import('@/shared/config'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    SUPPORTED_LOCALES: [
      { key: 'en-US', originalName: 'English', englishName: 'English' },
      { key: 'ru-RU', originalName: 'Русский', englishName: 'Russian' },
      { key: 'es-ES', originalName: 'Español', englishName: 'Spanish' },
    ] as unknown as SupportedLocale[],
  };
});

vi.mock(import('react-i18next'), async importOriginal => {
  const { createMockUseTranslation } = await import('@/tests/i18nMock');
  const original = await importOriginal();
  return {
    ...original,
    useTranslation: () => {
      const res = createMockUseTranslation()();
      return res;
    },
  };
});

let capturedAppHotkeyCallback: (() => void) | undefined;
vi.mock(import('@/shared/lib'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    useAppHotkey: (_shortcut: unknown, callback: Parameters<typeof original.useAppHotkey>[1]) => {
      capturedAppHotkeyCallback = callback as () => void;
    },
  };
});

describe('useDevLanguageShortcut hook', () => {
  beforeEach(() => {
    vi.spyOn(i18n, 'changeLanguage').mockImplementation(() => {
      return Promise.resolve(vi.fn() as unknown as TFunction);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('cycles through mocked languages on dev hotkey trigger', () => {
    const { rerender } = renderHook(() => {
      return useDevLanguageShortcut();
    });

    expect(capturedAppHotkeyCallback).toBeDefined();

    // 1. Current language: en-US -> next: ru-RU
    i18n.resolvedLanguage = 'en-US';

    rerender();
    act(() => {
      capturedAppHotkeyCallback!();
    });

    expect(i18n.changeLanguage).toHaveBeenCalledWith('ru-RU');

    // 2. Current language: ru-RU -> next: es-ES
    i18n.resolvedLanguage = 'ru-RU';

    rerender();
    act(() => {
      capturedAppHotkeyCallback!();
    });

    expect(i18n.changeLanguage).toHaveBeenLastCalledWith('es-ES');

    // 3. Current language: es-ES -> next: en-US
    i18n.resolvedLanguage = 'es-ES';

    rerender();
    act(() => {
      capturedAppHotkeyCallback!();
    });

    expect(i18n.changeLanguage).toHaveBeenLastCalledWith('en-US');
  });
});
