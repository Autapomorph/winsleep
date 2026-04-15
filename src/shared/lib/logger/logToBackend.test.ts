import { consola } from 'consola';

import { typedInvoke } from '@/shared/api';
import { logToBackend } from './logToBackend';

vi.mock(import('@/shared/api'), () => ({
  typedInvoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock(import('consola'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    consola: Object.assign(original.consola, {
      error: vi.fn(),
    }),
  };
});

describe('logToBackend', () => {
  test('calls typedInvoke with level and message', () => {
    vi.mocked(typedInvoke).mockResolvedValueOnce(undefined);
    logToBackend('INFO', 'test message');
    expect(typedInvoke).toHaveBeenCalledWith('log_message', {
      level: 'INFO',
      message: 'test message',
    });
  });

  test('logs an error to consola if typedInvoke fails', async () => {
    vi.mocked(typedInvoke).mockRejectedValueOnce(new Error('Backend error'));
    logToBackend('ERROR', 'test message');

    // Allow microtasks (like the catch block) to resolve
    await Promise.resolve();

    expect(consola.error).toHaveBeenCalledWith('Failed to log to backend: Error: Backend error');
  });
});
