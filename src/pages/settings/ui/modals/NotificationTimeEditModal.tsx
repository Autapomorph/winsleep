import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Label, Modal, Surface } from '@heroui/react';

import { MAX_SECONDS } from '@/entities/timer';
import { getHMS, getTotalSeconds } from '@/shared/lib';
import { WheelPicker } from '@/shared/ui';

interface Props {
  isOpen: boolean;
  initialSeconds: number;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (seconds: number) => void;
}

export const NotificationTimeEditModal = ({
  isOpen,
  initialSeconds,
  onOpenChange,
  onSave,
}: Props) => {
  const { t } = useTranslation();

  const [h, setH] = useState(() => getHMS(initialSeconds).hours);
  const [m, setM] = useState(() => getHMS(initialSeconds).minutes);
  const [s, setS] = useState(() => getHMS(initialSeconds).seconds);

  const initialSecondsRef = useRef(initialSeconds);

  useEffect(() => {
    if (!isOpen) {
      initialSecondsRef.current = initialSeconds;
    }
  }, [isOpen, initialSeconds]);

  useEffect(() => {
    if (isOpen) {
      const { hours, minutes, seconds } = getHMS(initialSecondsRef.current);
      setH(hours);
      setM(minutes);
      setS(seconds);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const total = getTotalSeconds(h, m, s);
    const clamped = Math.min(total, MAX_SECONDS);
    onSave(clamped > 0 ? clamped : 1);
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement="center">
        <Modal.Dialog>
          <Modal.CloseTrigger />

          <Modal.Header>
            <Modal.Heading>
              {t(
                $ =>
                  $.settings.sections.notifications.groups.timePoints.notificationTime.editModal
                    .title,
              )}
            </Modal.Heading>
          </Modal.Header>

          <Modal.Body className="px-6 py-4">
            <form id="edit-notification-time-form" onSubmit={handleSubmit}>
              <Surface className="flex items-center justify-center gap-1 rounded-xl border border-border/50 p-4">
                {/* Hours */}
                <div className="flex flex-col items-center">
                  <WheelPicker
                    value={h}
                    min={0}
                    max={24}
                    isInfinite
                    ariaLabel={t($ => $.common.time.units.hour.full, { count: h })}
                    onChange={setH}
                  />
                  <Label className="text-muted-foreground mt-1 text-[9px] font-bold tracking-widest uppercase opacity-70">
                    {t($ => $.common.time.units.hour.full, { count: h })}
                  </Label>
                </div>

                <span className="-mt-6 font-mono text-2xl opacity-30 sm:text-3xl">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center">
                  <WheelPicker
                    value={m}
                    min={0}
                    max={59}
                    isInfinite
                    ariaLabel={t($ => $.common.time.units.minute.full, { count: m })}
                    onChange={setM}
                  />
                  <Label className="text-muted-foreground mt-1 text-[9px] font-bold tracking-widest uppercase opacity-70">
                    {t($ => $.common.time.units.minute.full, { count: m })}
                  </Label>
                </div>

                <span className="-mt-6 font-mono text-2xl opacity-30 sm:text-3xl">:</span>

                {/* Seconds */}
                <div className="flex flex-col items-center">
                  <WheelPicker
                    value={s}
                    min={0}
                    max={59}
                    isInfinite
                    ariaLabel={t($ => $.common.time.units.second.full, { count: s })}
                    onChange={setS}
                  />
                  <Label className="text-muted-foreground mt-1 text-[9px] font-bold tracking-widest uppercase opacity-70">
                    {t($ => $.common.time.units.second.full, { count: s })}
                  </Label>
                </div>
              </Surface>
            </form>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" slot="close">
              {t($ => $.timer.cancelBtn.text)}
            </Button>

            <Button type="submit" form="edit-notification-time-form" variant="primary">
              {t(
                $ =>
                  $.settings.sections.notifications.groups.timePoints.notificationTime.editModal
                    .submitBtn.text,
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
