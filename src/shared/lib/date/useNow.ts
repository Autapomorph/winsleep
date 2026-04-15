import { useEffect, useState } from 'react';

import { getDateNow } from './getDateNow';

export const useNow = (): number => {
  const [now, setNow] = useState(() => getDateNow());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(getDateNow());
    }, 1000);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  return now;
};
