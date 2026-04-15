import i18n from 'i18next';
import { toast } from '@heroui/react';

import { createMockT } from '@/tests/i18nMock';
import { showSuccessToast } from './successToast';

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
      success: vi.fn(),
    }),
  };
});

describe('showSuccessToast', () => {
  beforeEach(() => {
    vi.spyOn(i18n, 't').mockImplementation(key => mockT(key));
  });

  test('uses custom string title and description', () => {
    showSuccessToast('Custom Title', 'Custom Description');
    expect(toast.success).toHaveBeenCalledWith('Custom Title', {
      description: 'Custom Description',
      timeout: 4000,
    });
  });

  test('handles selector functions for title', () => {
    showSuccessToast(schema => (schema as { app: { name: string } }).app.name, 'Description', 3000);
    expect(mockT).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('app.name', {
      description: 'Description',
      timeout: 3000,
    });
  });
});
