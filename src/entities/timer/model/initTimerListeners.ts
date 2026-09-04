import { typedListen } from '@/shared/api';
import { logger } from '@/shared/lib';
import { useTimerStore } from './timer.store';

export const initTimerListeners = () => {
  const isInitialized = useTimerStore.getState().isListenersInitialized;

  if (isInitialized) {
    return;
  }

  useTimerStore.setState({ isListenersInitialized: true }, false, 'timer/listeners-initialized');

  typedListen('timer-tick', event => {
    const state = useTimerStore.getState();

    if (state.timerState === 'running') {
      useTimerStore.setState({ remainingSeconds: event.payload }, false, 'timer/backend-tick');
    }
  }).catch(err => {
    logger.error(`Failed to register timer-tick listener: ${err}`);
  });

  typedListen('timer-complete', () => {
    const state = useTimerStore.getState();

    if (state.timerState === 'running') {
      logger.info('Timer completed naturally via backend signal');
      const { onCompleteCallback } = state;

      if (onCompleteCallback) {
        onCompleteCallback();
      }

      state.cancel();
    }
  }).catch(err => {
    logger.error(`Failed to register timer-complete listener: ${err}`);
  });
};
