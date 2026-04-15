import type { TFunction } from 'i18next';
import i18n from 'i18next';
import type { UseTranslationResponse } from 'react-i18next';
import { vi } from 'vitest';

export const createMockT = (customMockValues?: Record<string, string | number>) => {
  const getPathValue = (path: string[]): string => {
    const stringPath = path.join('.');
    if (customMockValues && stringPath in customMockValues) {
      return String(customMockValues[stringPath]);
    }
    return stringPath;
  };

  const createProxy = (path: string[] = []): unknown => {
    return new Proxy(
      {},
      {
        get(_, prop) {
          if (typeof prop === 'symbol') {
            if (prop === Symbol.toPrimitive) {
              return () => getPathValue(path);
            }
            return undefined;
          }
          if (prop === 'toString' || prop === 'valueOf') {
            return () => getPathValue(path);
          }
          return createProxy([...path, prop]);
        },
      },
    );
  };

  const mockFn = vi.fn((key: unknown, options?: { count?: number }) => {
    if (typeof key === 'function') {
      const proxy = createProxy();
      const result = (key as (schema: unknown) => unknown)(proxy);
      const stringResult = String(result);
      if (options && typeof options.count === 'number') {
        return `${stringResult}_plural_${options.count}`;
      }
      return stringResult;
    }
    return String(key);
  });

  return mockFn as unknown as TFunction;
};

export const createMockUseTranslation = (
  customMockValues?: Record<string, string | number>,
): (() => UseTranslationResponse<'translation', undefined>) => {
  const t = createMockT(customMockValues);
  const arr: [TFunction, typeof i18n, boolean] = [t, i18n, true];
  const response = Object.assign(arr, { t, i18n, ready: true });
  return () => response as UseTranslationResponse<'translation', undefined>;
};
