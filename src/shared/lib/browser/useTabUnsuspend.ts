import { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '../logger/logger';

export const useTabUnsuspend = () => {
  const [lockId] = useState(() => `prevent-suspense-weblock-${crypto.randomUUID()}`);
  const deferred = useRef(Promise.withResolvers());

  const resetDeferred = useCallback(() => {
    deferred.current.resolve(undefined);
    deferred.current = Promise.withResolvers();
  }, []);

  useEffect(() => {
    const listener = () => {
      if (!document.hidden) {
        resetDeferred();
      }

      navigator.locks
        .request(lockId, async () => {
          await deferred.current.promise;
        })
        .catch(error => logger.error(`useTabUnsuspend: lock request failed: ${error}`));
    };

    document.addEventListener('visibilitychange', listener);

    return () => {
      document.removeEventListener('visibilitychange', listener);
      resetDeferred();
    };
  }, [lockId, resetDeferred]);
};
