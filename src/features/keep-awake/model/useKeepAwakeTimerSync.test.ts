import { act, renderHook } from '@testing-library/react';

import { useKeepAwakeStore } from '@/entities/keep-awake';
import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { useKeepAwakeTimerSync } from './useKeepAwakeTimerSync';
import { setKeepAwake } from '../api/keepAwake';

vi.mock('../api/keepAwake', () => ({
  setKeepAwake: vi.fn().mockResolvedValue(undefined),
}));

describe('useKeepAwakeTimerSync', () => {
  beforeEach(() => {
    useTimerStore.setState({ timerState: 'idle' });
    useSessionStore.setState({ timerAction: 'sleep' });
    useKeepAwakeStore.setState({ isIndefiniteActive: false, startedAt: null });
    useSettingsStore.setState({
      isPreventPCSleepDuringTimerEnabled: true,
      isPreventDisplaySleepDuringTimerEnabled: false,
    });
  });

  test('enables keep-awake when timer starts running with default settings', () => {
    renderHook(() => useKeepAwakeTimerSync());

    expect(setKeepAwake).not.toHaveBeenCalled();

    act(() => {
      useTimerStore.setState({ timerState: 'running' });
    });

    expect(setKeepAwake).toHaveBeenCalledWith({
      isEnabled: true,
      keepDisplayAwake: false,
    });
  });

  test('enables keep-awake when action is keep-awake even if isPreventPCSleepDuringTimerEnabled is false', () => {
    useSettingsStore.setState({
      isPreventPCSleepDuringTimerEnabled: false,
    });
    useSessionStore.setState({
      timerAction: 'keep-awake',
    });

    renderHook(() => useKeepAwakeTimerSync());

    act(() => {
      useTimerStore.setState({ timerState: 'running' });
    });

    expect(setKeepAwake).toHaveBeenCalledWith({
      isEnabled: true,
      keepDisplayAwake: false,
    });
  });

  test('enables keep-awake when isIndefiniteActive is true even if timer is idle', () => {
    renderHook(() => useKeepAwakeTimerSync());

    expect(setKeepAwake).not.toHaveBeenCalled();

    act(() => {
      useKeepAwakeStore.setState({ isIndefiniteActive: true });
    });

    expect(setKeepAwake).toHaveBeenCalledWith({
      isEnabled: true,
      keepDisplayAwake: false,
    });
  });

  test('includes display keep-awake when isPreventDisplaySleepDuringTimerEnabled is true', () => {
    useSettingsStore.setState({
      isPreventPCSleepDuringTimerEnabled: true,
      isPreventDisplaySleepDuringTimerEnabled: true,
    });

    renderHook(() => useKeepAwakeTimerSync());

    act(() => {
      useTimerStore.setState({ timerState: 'running' });
    });

    expect(setKeepAwake).toHaveBeenCalledWith({
      isEnabled: true,
      keepDisplayAwake: true,
    });
  });

  test('disables keep-awake when timer is paused or idle', () => {
    renderHook(() => useKeepAwakeTimerSync());

    act(() => {
      useTimerStore.setState({ timerState: 'running' });
    });
    expect(setKeepAwake).toHaveBeenLastCalledWith({
      isEnabled: true,
      keepDisplayAwake: false,
    });

    act(() => {
      useTimerStore.setState({ timerState: 'paused' });
    });
    expect(setKeepAwake).toHaveBeenLastCalledWith({
      isEnabled: false,
      keepDisplayAwake: false,
    });

    act(() => {
      useTimerStore.setState({ timerState: 'running' });
    });
    expect(setKeepAwake).toHaveBeenLastCalledWith({
      isEnabled: true,
      keepDisplayAwake: false,
    });

    act(() => {
      useTimerStore.setState({ timerState: 'idle' });
    });
    expect(setKeepAwake).toHaveBeenLastCalledWith({
      isEnabled: false,
      keepDisplayAwake: false,
    });
  });

  test('immediately enables keep-awake on mount if timer is already running', () => {
    useTimerStore.setState({ timerState: 'running' });

    renderHook(() => useKeepAwakeTimerSync());

    expect(setKeepAwake).toHaveBeenCalledTimes(1);
    expect(setKeepAwake).toHaveBeenCalledWith({
      isEnabled: true,
      keepDisplayAwake: false,
    });
  });

  test('immediately enables keep-awake on mount if indefinite mode is already active', () => {
    useKeepAwakeStore.setState({ isIndefiniteActive: true });

    renderHook(() => useKeepAwakeTimerSync());

    expect(setKeepAwake).toHaveBeenCalledTimes(1);
    expect(setKeepAwake).toHaveBeenCalledWith({
      isEnabled: true,
      keepDisplayAwake: false,
    });
  });

  test('does not call setKeepAwake repeatedly if target state has not changed (deduplication)', () => {
    renderHook(() => useKeepAwakeTimerSync());

    act(() => {
      useTimerStore.setState({ timerState: 'running' });
    });
    expect(setKeepAwake).toHaveBeenCalledTimes(1);

    // Simulate timer tick (timerState remains 'running', only remainingSeconds changes)
    act(() => {
      useTimerStore.setState({ remainingSeconds: 299 });
    });
    expect(setKeepAwake).toHaveBeenCalledTimes(1);
  });

  test('disables keep-awake when isIndefiniteActive changes from true to false', () => {
    useKeepAwakeStore.setState({ isIndefiniteActive: true });
    renderHook(() => useKeepAwakeTimerSync());

    expect(setKeepAwake).toHaveBeenLastCalledWith({
      isEnabled: true,
      keepDisplayAwake: false,
    });

    act(() => {
      useKeepAwakeStore.setState({ isIndefiniteActive: false });
    });

    expect(setKeepAwake).toHaveBeenLastCalledWith({
      isEnabled: false,
      keepDisplayAwake: false,
    });
  });

  test('includes display keep-awake in indefinite mode when isPreventDisplaySleepDuringTimerEnabled is true', () => {
    useSettingsStore.setState({
      isPreventDisplaySleepDuringTimerEnabled: true,
    });

    renderHook(() => useKeepAwakeTimerSync());

    act(() => {
      useKeepAwakeStore.setState({ isIndefiniteActive: true });
    });

    expect(setKeepAwake).toHaveBeenCalledWith({
      isEnabled: true,
      keepDisplayAwake: true,
    });
  });

  test('releases keep-awake on unmount if it was running', () => {
    const { unmount } = renderHook(() => useKeepAwakeTimerSync());

    act(() => {
      useTimerStore.setState({ timerState: 'running' });
    });

    vi.mocked(setKeepAwake).mockClear();

    unmount();

    expect(setKeepAwake).toHaveBeenCalledTimes(1);
    expect(setKeepAwake).toHaveBeenCalledWith({
      isEnabled: false,
      keepDisplayAwake: false,
    });
  });

  test('does not call setKeepAwake on unmount if it was not enabled', () => {
    const { unmount } = renderHook(() => useKeepAwakeTimerSync());

    unmount();

    expect(setKeepAwake).not.toHaveBeenCalled();
  });
});
