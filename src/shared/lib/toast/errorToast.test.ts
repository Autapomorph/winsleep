import i18n from 'i18next';
import { toast } from '@heroui/react';

import { createMockT } from '@/tests/i18nMock';
import { showErrorToast } from './errorToast';

const mockT = createMockT({
  'app.name': 'app.name',
  'common.errors.messages.defaultTitle': 'Default Title',
  'common.errors.messages.defaultMessage': 'Default Message',
});

vi.mock(import('@heroui/react'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    toast: Object.assign(original.toast, {
      danger: vi.fn(),
    }),
  };
});

describe('showErrorToast', () => {
  beforeEach(() => {
    vi.spyOn(i18n, 't').mockImplementation(key => mockT(key));
  });

  test('handles empty parameters and uses default error translations', () => {
    showErrorToast();
    expect(toast.danger).toHaveBeenCalledWith('Default Title', {
      description: 'Default Message',
      timeout: 6000,
    });
  });

  test('uses custom string title and description', () => {
    showErrorToast('Custom Title', 'Custom Description');
    expect(toast.danger).toHaveBeenCalledWith('Custom Title', {
      description: 'Custom Description',
      timeout: 6000,
    });
  });

  test('uses custom string title and no description', () => {
    showErrorToast('Custom Title');
    expect(toast.danger).toHaveBeenCalledWith('Custom Title', {
      description: undefined,
      timeout: 6000,
    });
  });

  test('handles selector functions for title', () => {
    showErrorToast(schema => (schema as { app: { name: string } }).app.name, 'Description', 3000);
    expect(toast.danger).toHaveBeenCalledWith('app.name', {
      description: 'Description',
      timeout: 3000,
    });
  });
});
