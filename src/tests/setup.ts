import '@testing-library/jest-dom/vitest';
import { clearMocks, mockIPC, mockWindows } from '@tauri-apps/api/mocks';
import { afterEach, beforeEach, vi } from 'vitest';

vi.mock('@/shared/lib/logger/logger', () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(navigator, 'locks', {
  value: {
    request: vi.fn(() => Promise.resolve()),
  },
  writable: true,
  configurable: true,
});

beforeEach(() => {
  mockWindows('main', 'tray_menu');
  mockIPC(() => undefined);

  let store: Record<string, string> = {};

  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  });
});

afterEach(() => {
  clearMocks();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
