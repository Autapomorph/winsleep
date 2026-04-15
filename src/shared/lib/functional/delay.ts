/**
 * Promisified setTimeout that supports cancellation via AbortSignal.
 *
 * @param ms Delay duration in milliseconds
 * @param signal Optional AbortSignal to cancel the delay
 * @returns Promise that resolves after the delay, or rejects with an AbortError if cancelled
 */
export const delay = (ms: number, signal?: AbortSignal): Promise<void> => {
  return new Promise((resolve, reject) => {
    let timer: number | undefined;

    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal?.addEventListener('abort', onAbort);
  });
};
