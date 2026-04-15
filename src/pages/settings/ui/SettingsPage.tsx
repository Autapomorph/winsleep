import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button, Separator, Surface } from '@heroui/react';
import { FaArrowLeft } from 'react-icons/fa6';

import { SHORTCUT_SCOPES, SHORTCUTS } from '@/shared/config';
import { useAppHotkey, useHotkeysScope, useScrollSpy } from '@/shared/lib';
import { SettingsNavigation } from './layout/SettingsNavigation';
import { AboutSettings } from './sections/about/AboutSettings';
import { DebugSettings } from './sections/debug/DebugSettings';
import { GeneralSettings } from './sections/general/GeneralSettings';
import { HotkeysSettings } from './sections/hotkeys/HotkeysSettings';
import { NotificationSettings } from './sections/notifications/NotificationSettings';
import { TimerActionSettings } from './sections/timer-action/TimerActionSettings';
import { TimerSettings } from './sections/timer/TimerSettings';
import { SETTINGS_SECTIONS } from '../model/navigation';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionIds = useMemo(() => SETTINGS_SECTIONS.map(s => s.id), []);
  const [activeSectionId, setManualActiveId] = useScrollSpy(sectionIds, 120, scrollContainerRef);

  useHotkeysScope(SHORTCUT_SCOPES.SETTINGS);
  useAppHotkey(SHORTCUTS.SETTINGS.BACK, () => navigate('/'));

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      setManualActiveId(id);
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.focus({ preventScroll: true });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Navbar */}
      <div className="mx-auto flex min-h-0 w-full max-w-3xl shrink-0 items-center justify-start gap-4 bg-background py-4">
        {/* Back button */}
        <Button
          isIconOnly
          variant="ghost"
          onPress={() => navigate('/')}
          aria-label={t($ => $.settings.backBtn.aria.label)}
        >
          <FaArrowLeft fontSize={20} />
        </Button>

        {/* Title */}
        <h1 className="text-2xl font-bold">{t($ => $.settings.title)}</h1>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="flex shrink-0 bg-background/50 px-2 py-4">
          <SettingsNavigation activeId={activeSectionId} onItemClick={scrollToSection} />
          <Separator orientation="vertical" />
        </aside>

        {/* Content */}
        <div
          id="main-content"
          className="min-h-0 flex-1 overflow-y-auto scroll-smooth outline-none"
          ref={scrollContainerRef}
          tabIndex={-1}
        >
          <div className="mx-auto flex min-h-0 max-w-2xl flex-col gap-6 px-6 pt-4 pb-12">
            <section id="action" tabIndex={-1} className="scroll-mt-4 outline-none">
              <Surface className="rounded-2xl p-6">
                <TimerActionSettings />
              </Surface>
            </section>

            <section id="timer" tabIndex={-1} className="scroll-mt-4 outline-none">
              <Surface className="rounded-2xl p-6">
                <TimerSettings />
              </Surface>
            </section>

            <section id="notifications" tabIndex={-1} className="scroll-mt-4 outline-none">
              <Surface className="rounded-2xl p-6">
                <NotificationSettings />
              </Surface>
            </section>

            <section id="general" tabIndex={-1} className="scroll-mt-4 outline-none">
              <Surface className="rounded-2xl p-6">
                <GeneralSettings />
              </Surface>
            </section>

            <section id="hotkeys" tabIndex={-1} className="scroll-mt-4 outline-none">
              <Surface className="rounded-2xl p-6">
                <HotkeysSettings />
              </Surface>
            </section>

            <section id="debug" tabIndex={-1} className="scroll-mt-4 outline-none">
              <Surface className="rounded-2xl p-6">
                <DebugSettings />
              </Surface>
            </section>

            <section id="about" tabIndex={-1} className="scroll-mt-4 outline-none">
              <Surface className="rounded-2xl p-6">
                <AboutSettings />
              </Surface>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
