import { useEffect } from 'react';
import { useHotkeysContext } from 'react-hotkeys-hook';

export const useHotkeysScope = (scope: string, isActive = true) => {
  const { enableScope, disableScope } = useHotkeysContext();

  useEffect(() => {
    if (isActive) {
      enableScope(scope);
      return () => {
        disableScope(scope);
      };
    }

    disableScope(scope);
    return () => {
      enableScope(scope);
    };
  }, [scope, isActive, enableScope, disableScope]);
};
