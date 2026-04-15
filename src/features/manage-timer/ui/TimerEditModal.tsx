import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Tabs } from '@heroui/react';

import { type TimerMode, useTimerStore } from '@/entities/timer';
import { SHORTCUT_SCOPES } from '@/shared/config';
import { getHMS, getTotalSeconds, useHotkeysScope } from '@/shared/lib';
import { DurationPickerPanel } from './DurationPickerPanel';
import { TimestampPickerPanel } from './TimestampPickerPanel';

interface Props {
  isOpen: boolean;
  currentSeconds: number;
  setExactTime: (seconds: number) => void;
  onOpenChange: (isOpen: boolean) => void;
}

export const TimerEditModal = ({ isOpen, onOpenChange, currentSeconds, setExactTime }: Props) => {
  const { t } = useTranslation();

  const {
    timerState,
    timerMode,
    targetDateTime,
    onCompleteCallback,
    setTimerMode,
    setTargetDateTime,
    cancel,
    start,
  } = useTimerStore(
    useShallow(state => ({
      timerState: state.timerState,
      timerMode: state.timerMode,
      targetDateTime: state.targetDateTime,
      onCompleteCallback: state.onCompleteCallback,
      setTimerMode: state.setTimerMode,
      setTargetDateTime: state.setTargetDateTime,
      cancel: state.cancel,
      start: state.start,
    })),
  );

  const [activeTab, setActiveTab] = useState<TimerMode>(timerMode);

  const [h, setH] = useState(() => getHMS(currentSeconds).hours);
  const [m, setM] = useState(() => getHMS(currentSeconds).minutes);
  const [s, setS] = useState(() => getHMS(currentSeconds).seconds);

  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(targetDateTime);
  const [isTimestampValid, setIsTimestampValid] = useState(true);

  const currentSecondsRef = useRef(currentSeconds);

  const measureRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  useHotkeysScope(SHORTCUT_SCOPES.TIMER, !isOpen);

  useEffect(() => {
    const element = measureRef.current;

    if (!isOpen) {
      return undefined;
    }

    if (!element) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContentHeight(entry.target.getBoundingClientRect().height);
      }
    });

    resizeObserver.observe(element);
    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      currentSecondsRef.current = currentSeconds;
    }
  }, [isOpen, currentSeconds]);

  useEffect(() => {
    if (isOpen) {
      const { hours, minutes, seconds } = getHMS(currentSecondsRef.current);

      setH(hours);
      setM(minutes);
      setS(seconds);
      setActiveTab(timerMode);
      setSelectedTimestamp(targetDateTime);
    }
  }, [isOpen, timerMode, targetDateTime]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setContentHeight(null);
    }

    onOpenChange(open);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isModeChanging = timerMode !== activeTab;
    const wasActive = timerState !== 'idle';

    if (wasActive && isModeChanging) {
      cancel();
    }

    if (activeTab === 'duration') {
      setTimerMode('duration');
      setExactTime(getTotalSeconds(h, m, s));
    } else {
      if (!isTimestampValid || selectedTimestamp === null) {
        return;
      }

      setTimerMode('timestamp');
      setTargetDateTime(selectedTimestamp);
    }

    if (wasActive && isModeChanging && onCompleteCallback) {
      start(onCompleteCallback);
    }

    setContentHeight(null);
    onOpenChange(false);
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Container placement="center">
        <Modal.Dialog className="max-h-full">
          <Modal.CloseTrigger />

          <Modal.Header>
            <Modal.Heading className="flex flex-col gap-1">
              {t($ => $.timer.timerEditModal.title)}
            </Modal.Heading>
          </Modal.Header>

          <Modal.Body className="px-6 py-4">
            <form id="edit-timer-form" onSubmit={handleSubmit}>
              <div
                className="overflow-hidden transition-[height] duration-250 ease-in-out"
                style={{
                  height: contentHeight !== null ? `${contentHeight}px` : 'auto',
                }}
              >
                <div ref={measureRef}>
                  <Tabs
                    className="w-full"
                    selectedKey={activeTab}
                    onSelectionChange={key => setActiveTab(key as TimerMode)}
                  >
                    <Tabs.ListContainer>
                      <Tabs.List aria-label={t($ => $.timer.timerEditModal.modes.tabs.aria.label)}>
                        <Tabs.Tab id="duration">
                          {t($ => $.timer.timerEditModal.modes.tabs.title.duration)}
                          <Tabs.Indicator />
                        </Tabs.Tab>

                        <Tabs.Tab id="timestamp">
                          {t($ => $.timer.timerEditModal.modes.tabs.title.timestamp)}
                          <Tabs.Indicator />
                        </Tabs.Tab>
                      </Tabs.List>
                    </Tabs.ListContainer>

                    <Tabs.Panel id="duration">
                      <DurationPickerPanel
                        hours={h}
                        minutes={m}
                        seconds={s}
                        onChangeHours={setH}
                        onChangeMinutes={setM}
                        onChangeSeconds={setS}
                      />
                    </Tabs.Panel>

                    <Tabs.Panel id="timestamp">
                      <TimestampPickerPanel
                        key={isOpen ? 'open' : 'closed'}
                        initialTargetDateTime={targetDateTime}
                        onChange={setSelectedTimestamp}
                        onValidityChange={setIsTimestampValid}
                      />
                    </Tabs.Panel>
                  </Tabs>
                </div>
              </div>
            </form>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" slot="close">
              {t($ => $.timer.cancelBtn.text)}
            </Button>

            <Button
              type="submit"
              variant="primary"
              isDisabled={activeTab === 'timestamp' && !isTimestampValid}
              form="edit-timer-form"
            >
              {t($ => $.timer.timerEditModal.submitBtn.text)}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
