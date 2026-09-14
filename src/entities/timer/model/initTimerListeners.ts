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
};
