import { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { useTranslation } from 'react-i18next';
import { Chip, Link, Surface } from '@heroui/react';
import { FaGithub } from 'react-icons/fa6';

import Logo from '@/assets/logo_full.svg?react';
import { GITHUB_REPO_URL } from '@/shared/config';
import { openExternalLink } from '@/shared/lib';

export const AboutSettings = () => {
  const { t } = useTranslation();
  const [version, setVersion] = useState('...');

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <h2 className="text-lg font-semibold text-foreground/80">
        {t($ => $.settings.sections.about.title)}
      </h2>

      {/* About Card */}
      <Surface variant="secondary" className="relative overflow-hidden rounded-2xl p-6">
        {/* Glow effect */}
        <div className="bg-primary/10 pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full blur-2xl" />

        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            {/* Logo container */}
            <div className="flex shrink-0 items-center justify-center rounded-2xl p-3">
              <Logo className="text-primary h-8 w-auto" />
            </div>

            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold tracking-wide text-foreground">WinSleep</span>

                <Link
                  href="##"
                  onPress={() => {
                    openExternalLink(`${GITHUB_REPO_URL}/releases/tag/${version}`).catch(() => {});
                  }}
                >
                  <Chip variant="primary" className="font-mono">
                    v{version}
                  </Chip>
                </Link>
              </div>

              <p className="text-muted-foreground mt-1 text-xs">
                {t($ => $.settings.sections.about.copyright)}
              </p>
            </div>
          </div>

          <div>
            {/* GitHub button link */}
            <Link
              href="##"
              onPress={() => {
                openExternalLink(GITHUB_REPO_URL).catch(() => {});
              }}
            >
              <Link.Icon className="mr-1.5 size-3">
                <FaGithub />
              </Link.Icon>

              <span>{t($ => $.settings.sections.about.github)}</span>
            </Link>
          </div>
        </div>
      </Surface>
    </div>
  );
};
