import { Timer } from '@/widgets/timer';
import { SettingsButton, useOpenSettingsHotkey } from '@/features/open-settings';
import { LockToggle } from '@/features/toggle-lock';
import { ThemeToggle } from '@/features/toggle-theme';
import { config } from '@/shared/config';
import { CrashTestButton } from '@/shared/ui';

export const HomePage = () => {
  useOpenSettingsHotkey();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Navbar */}
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 bg-background py-4">
        <SettingsButton />

        <div className="flex items-center gap-2">
          {config.isDev && <CrashTestButton />}
          <LockToggle />
          <ThemeToggle />
        </div>
      </div>

      {/* Content */}
      <div id="main-content" className="min-h-0 flex-1 overflow-y-auto outline-none" tabIndex={-1}>
        <div className="mx-auto flex min-h-0 max-w-2xl flex-col gap-6 pb-12">
          <Timer />
        </div>
      </div>
    </div>
  );
};
