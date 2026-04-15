import { useHead } from '@unhead/react';
import { render } from '@testing-library/react';

import { head } from './head';
import { HeadData } from './HeadData';

vi.mock(import('@unhead/react'), () => ({
  useHead: vi.fn(),
}));

vi.mock(import('react-i18next'), async importOriginal => {
  const { createMockUseTranslation } = await import('@/tests/i18nMock');
  return {
    ...(await importOriginal()),
    useTranslation: () => {
      const res = createMockUseTranslation({
        'app.name': 'Title',
        'app.description': 'Description',
      })();
      res.i18n.resolvedLanguage = 'en-US';
      return res;
    },
  };
});

describe('HeadData and head exports', () => {
  test('defines the head instance from head.ts', () => {
    expect(head).toBeDefined();
  });

  test('calls useHead with correct title, description and lang attributes', () => {
    render(<HeadData />);

    expect(useHead).toHaveBeenCalledWith({
      htmlAttrs: {
        lang: 'en-US',
      },
      title: 'Title',
      meta: [
        {
          name: 'description',
          content: 'Description',
        },
      ],
    });
  });
});
