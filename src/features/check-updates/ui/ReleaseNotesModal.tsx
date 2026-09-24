import { type Key, type PropsWithChildren, type ReactNode, useEffect } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button, Chip, cn, Link, ListBox, Modal, Select, Spinner } from '@heroui/react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { FaGithub, FaTriangleExclamation } from 'react-icons/fa6';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { MOCK_VERSION, STORAGE_LAST_SEEN_VERSION_KEY, useUpdateStore } from '@/entities/updater';
import { config, DEFAULT_LOCALE, GITHUB_REPO_URL, RELEASE_NOTES_TAGS } from '@/shared/config';
import {
  compareSemver,
  formatReleaseDate,
  isReleaseNotesTag,
  logger,
  openExternalLink,
} from '@/shared/lib';

const markdownComponents = {
  h1: ({ children }: PropsWithChildren) => (
    <h1 className="border-divider/40 mt-5 mb-2 border-b pb-1 text-xl font-bold text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }: PropsWithChildren) => (
    <h2 className="mt-4 mb-2 text-lg font-semibold text-foreground/90">{children}</h2>
  ),
  h3: ({ children }: PropsWithChildren) => (
    <h3 className="mt-3 mb-1 text-base font-semibold text-foreground/80">{children}</h3>
  ),
  ul: ({ children }: PropsWithChildren) => (
    <ul className="my-2 list-disc space-y-1.5 pl-5">{children}</ul>
  ),
  li: ({ children }: PropsWithChildren) => (
    <li className="text-sm leading-relaxed text-foreground/85">{children}</li>
  ),
  p: ({ children }: PropsWithChildren) => (
    <p className="my-2 text-sm leading-relaxed text-foreground/80">{children}</p>
  ),
  code: ({ children }: PropsWithChildren) => (
    <code className="bg-content2 border-divider/50 text-primary rounded-md border px-1.5 py-0.5 font-mono text-[13px]">
      {children}
    </code>
  ),
  strong: ({ children }: PropsWithChildren) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  a: ({ href, children }: PropsWithChildren & { href?: string }) => (
    <Link
      href="##"
      onPress={() => {
        if (href) {
          openExternalLink(href).catch(() => {});
        }
      }}
    >
      {children}
    </Link>
  ),
};

const getReleaseNotesTagClassName = (tag: string) => {
  const normalizedTag = tag.toLowerCase();

  switch (normalizedTag) {
    case RELEASE_NOTES_TAGS.NEW:
      return cn(
        'border-green-400/15 bg-green-200 text-green-800 dark:border-green-300/15 dark:bg-green-500/15 dark:text-green-400',
      );
    case RELEASE_NOTES_TAGS.IMPROVED:
      return cn(
        'border-purple-400/15 bg-purple-200 text-purple-800 dark:border-purple-300/15 dark:bg-purple-500/15 dark:text-purple-400',
      );
    case RELEASE_NOTES_TAGS.FIXED:
      return cn(
        'border-cyan-400/15 bg-cyan-200 text-cyan-800 dark:border-cyan-300/15 dark:bg-cyan-500/15 dark:text-cyan-400',
      );
    default:
      return cn(
        'border-neutral-400/15 bg-neutral-100 text-neutral-800 dark:border-neutral-300/15 dark:bg-neutral-600/15 dark:text-neutral-200',
      );
  }
};

export const ReleaseNotesModal = () => {
  const { t, i18n } = useTranslation();
  const {
    isReleaseNotesOpen,
    releaseNotesVersion,
    releaseNotes,
    releaseNotesMeta,
    availableVersions,
    isReleaseNotesLoading,
    releaseNotesError,
    closeReleaseNotes,
    openReleaseNotes,
    fetchReleaseNotes,
  } = useUpdateStore(
    useShallow(state => ({
      isReleaseNotesOpen: state.isReleaseNotesOpen,
      releaseNotesVersion: state.releaseNotesVersion,
      releaseNotes: state.releaseNotes,
      releaseNotesMeta: state.releaseNotesMeta,
      availableVersions: state.availableVersions,
      isReleaseNotesLoading: state.isReleaseNotesLoading,
      releaseNotesError: state.releaseNotesError,
      closeReleaseNotes: state.closeReleaseNotes,
      openReleaseNotes: state.openReleaseNotes,
      fetchReleaseNotes: state.fetchReleaseNotes,
    })),
  );

  const version = releaseNotesVersion ?? '';
  const releaseUrl = `${GITHUB_REPO_URL}/releases/tag`;

  const versionsToDisplay = Array.from(
    new Set(
      [...(config.isDev ? [MOCK_VERSION] : []), ...availableVersions, version].filter(Boolean),
    ),
  ).sort((a, b) => compareSemver(a, b, { pinnedTop: config.isDev ? MOCK_VERSION : undefined }));

  let modalContent: ReactNode;

  useEffect(() => {
    const init = async () => {
      try {
        const currentVersion = await getVersion();
        const lastSeenVersion = localStorage.getItem(STORAGE_LAST_SEEN_VERSION_KEY);

        const normalizedCurrent = currentVersion.replace(/^v/, '');
        const normalizedLastSeen = lastSeenVersion ? lastSeenVersion.replace(/^v/, '') : null;

        if (normalizedLastSeen && compareSemver(normalizedCurrent, normalizedLastSeen, 'asc') > 0) {
          openReleaseNotes(normalizedCurrent);
        } else if (!lastSeenVersion) {
          localStorage.setItem(STORAGE_LAST_SEEN_VERSION_KEY, normalizedCurrent);
        }
      } catch (err) {
        logger.error(`Initialization error: ${err}`);
      }
    };

    init().catch(() => {});
  }, [openReleaseNotes]);

  const handleVersionChange = (val: Key | null) => {
    if (val !== null && val !== version) {
      fetchReleaseNotes(String(val)).catch(() => {});
    }
  };

  if (isReleaseNotesLoading) {
    modalContent = (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6">
        <Spinner size="lg" />
        <p className="text-muted-foreground text-sm">{t($ => $.releaseNotesModal.loading)}</p>
      </div>
    );
  }

  if (releaseNotesError) {
    modalContent = (
      <div className="flex flex-1 flex-col items-center justify-center py-6">
        <div className="my-2 flex flex-col items-center gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-6 text-center">
          <div className="rounded-full bg-danger/10 p-3 text-danger">
            <FaTriangleExclamation size={24} />
          </div>

          <h3 className="text-base font-bold text-foreground">
            {t($ => $.releaseNotesModal.error.title)}
          </h3>

          <p className="max-w-xs text-xs leading-relaxed text-muted">
            {t($ => $.releaseNotesModal.error.description)}
          </p>

          <Button
            variant="secondary"
            onPress={() => {
              fetchReleaseNotes(version).catch(() => {});
            }}
          >
            {t($ => $.releaseNotesModal.error.retryBtn.text)}
          </Button>
        </div>
      </div>
    );
  }

  if (!isReleaseNotesLoading && !releaseNotesError) {
    modalContent = (
      <div>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {releaseNotes}
        </ReactMarkdown>
      </div>
    );
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeReleaseNotes();

      getVersion()
        .then(currentVersion => {
          localStorage.setItem(STORAGE_LAST_SEEN_VERSION_KEY, currentVersion.replace(/^v/, ''));
        })
        .catch(() => {});
    }
  };

  let versionSelector: ReactNode = null;

  if (versionsToDisplay.length > 1) {
    versionSelector = (
      <Select
        variant="secondary"
        value={version}
        placeholder={t($ => $.releaseNotesModal.selectVersion)}
        onChange={handleVersionChange}
        aria-label={t($ => $.releaseNotesModal.selectVersion)}
      >
        <Select.Trigger className="font-mono text-xs font-semibold">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>

        <Select.Popover>
          <ListBox>
            {versionsToDisplay.map(v => (
              <ListBox.Item key={v} id={v} textValue={v}>
                v{v}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    );
  } else if (version) {
    versionSelector = (
      <span className="font-mono text-xs font-semibold">
        {t($ => $.releaseNotesModal.version, { version })}
      </span>
    );
  }

  const formattedReleaseDate = releaseNotesMeta?.releasedAt
    ? formatReleaseDate(releaseNotesMeta.releasedAt, i18n.language)
    : null;
  const hasMeta = Boolean(formattedReleaseDate) || (releaseNotesMeta?.tags?.length ?? 0) > 0;

  const renderReleaseNotesTagChip = (tag: string) => {
    const normalizedTag = tag.toLowerCase();
    const label = isReleaseNotesTag(normalizedTag)
      ? t($ => $.releaseNotesModal.tags[normalizedTag], {
          lng: DEFAULT_LOCALE,
          defaultValue: tag,
        })
      : tag;

    return (
      <Chip key={tag} className={cn('border', getReleaseNotesTagClassName(tag))} size="sm">
        {label}
      </Chip>
    );
  };

  return (
    <Modal.Backdrop isOpen={isReleaseNotesOpen} onOpenChange={handleOpenChange}>
      <Modal.Container placement="center" size="cover">
        <Modal.Dialog>
          <Modal.CloseTrigger />

          <Modal.Header className="flex flex-col gap-1.5">
            <Modal.Heading className="flex items-center gap-4 text-xl font-bold">
              {t($ => $.releaseNotesModal.title)}
              {versionSelector}
            </Modal.Heading>

            {hasMeta && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {formattedReleaseDate && (
                  <span className="text-xs text-muted">{formattedReleaseDate}</span>
                )}

                {releaseNotesMeta?.tags?.map(renderReleaseNotesTagChip)}
              </div>
            )}
          </Modal.Header>

          <Modal.Body className="flex flex-col px-6 py-4">{modalContent}</Modal.Body>

          <Modal.Footer className="flex items-center justify-end gap-8 border-t px-6 py-4">
            <Link
              href="##"
              onPress={() => {
                const targetUrl =
                  version === MOCK_VERSION
                    ? `${GITHUB_REPO_URL}/releases`
                    : `${releaseUrl}/${version}`;
                openExternalLink(targetUrl).catch(() => {});
              }}
            >
              <Link.Icon className="mr-1.5 size-3">
                <FaGithub />
              </Link.Icon>

              <span>{t($ => $.releaseNotesModal.viewOnGithub)}</span>

              <Link.Icon className="ml-1.5 size-3">
                <FaExternalLinkAlt />
              </Link.Icon>
            </Link>

            <Button variant="primary" slot="close">
              {t($ => $.releaseNotesModal.closeBtn.text)}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
