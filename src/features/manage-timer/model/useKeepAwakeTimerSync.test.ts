import { act, renderHook } from '@testing-library/react';

import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { useKeepAwakeTimerSync } from './useKeepAwakeTimerSync';
import { setKeepAwake } from '../api/keepAwake';

vi.mock('../api/keepAwake', () => ({
  setKeepAwake: vi.fn().mockResolvedValue(undefined),
  getKeepAwakeStatus: vi.fn().mockResolvedValue(false),
}));

describe('useKeepAwakeTimerSync', () => {
  beforeEach(() => {
    useTimerStore.setState({ timerState: 'idle' });
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

  test('does not enable keep-awake if isPreventPCSleepDuringTimerEnabled is false', () => {
    useSettingsStore.setState({
      isPreventPCSleepDuringTimerEnabled: false,
    });

    renderHook(() => useKeepAwakeTimerSync());

    act(() => {
      useTimerStore.setState({ timerState: 'running' });
    });

    expect(setKeepAwake).not.toHaveBeenCalled();
  });

  test('releases keep-awake on unmount if it was running', () => {
    const { unmount } = renderHook(() => useKeepAwakeTimerSync());

    act(() => {
      useTimerStore.setState({ timerState: 'running' });
    });

    vi.mocked(setKeepAwake).mockClear();

    unmount();

    expect(setKeepAwake).toHaveBeenCalledWith({
      isEnabled: false,
      keepDisplayAwake: false,
    });
  });
});
