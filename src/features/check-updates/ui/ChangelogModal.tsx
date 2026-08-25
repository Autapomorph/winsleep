import { type PropsWithChildren, type ReactNode, useEffect } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button, Link, Modal, Spinner } from '@heroui/react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { FaGithub, FaTriangleExclamation } from 'react-icons/fa6';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { MOCK_VERSION, STORAGE_HAS_UPDATED_TO_KEY, useUpdateStore } from '@/entities/updater';
import { GITHUB_REPO_URL } from '@/shared/config';
import { logger, openExternalLink } from '@/shared/lib';

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

export const ChangelogModal = () => {
  const { t } = useTranslation();
  const {
    isChangelogOpen,
    changelogVersion,
    changelog,
    isChangelogLoading,
    changelogError,
    closeChangelog,
    openChangelog,
    fetchChangelog,
  } = useUpdateStore(
    useShallow(state => ({
      isChangelogOpen: state.isChangelogOpen,
      changelogVersion: state.changelogVersion,
      changelog: state.changelog,
      isChangelogLoading: state.isChangelogLoading,
      changelogError: state.changelogError,
      closeChangelog: state.closeChangelog,
      openChangelog: state.openChangelog,
      fetchChangelog: state.fetchChangelog,
    })),
  );

  const version = changelogVersion ?? '';
  const releaseUrl = `${GITHUB_REPO_URL}/releases/tag`;

  let modalContent: ReactNode;

  useEffect(() => {
    const init = async () => {
      try {
        const currentVersion = await getVersion();
        const pendingVersion = localStorage.getItem(STORAGE_HAS_UPDATED_TO_KEY);

        if (pendingVersion) {
          localStorage.removeItem(STORAGE_HAS_UPDATED_TO_KEY);

          const normalizedPending = pendingVersion.replace(/^v/, '');
          const normalizedCurrent = currentVersion.replace(/^v/, '');

          if (normalizedPending === normalizedCurrent || pendingVersion === MOCK_VERSION) {
            openChangelog(pendingVersion);
          }
        }
      } catch (err) {
        localStorage.removeItem(STORAGE_HAS_UPDATED_TO_KEY);
        logger.error(`Initialization error: ${err}`);
      }
    };

    init().catch(() => {});
  }, [openChangelog]);

  if (isChangelogLoading) {
    modalContent = (
      <div className="flex min-h-40 flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-muted-foreground text-sm">{t($ => $.changelogModal.loading)}</p>
      </div>
    );
  }

  if (changelogError) {
    modalContent = (
      <div className="my-2 flex flex-col items-center gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-6 text-center">
        <div className="rounded-full bg-danger/10 p-3 text-danger">
          <FaTriangleExclamation size={24} />
        </div>

        <h3 className="text-base font-bold text-foreground">
          {t($ => $.changelogModal.error.title)}
        </h3>

        <p className="max-w-xs text-xs leading-relaxed text-muted">
          {t($ => $.changelogModal.error.description)}
        </p>

        <Button
          variant="secondary"
          onPress={() => {
            fetchChangelog(version).catch(() => {});
          }}
        >
          {t($ => $.changelogModal.error.retryBtn.text)}
        </Button>
      </div>
    );
  }

  if (!isChangelogLoading && !changelogError) {
    modalContent = (
      <div>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {changelog}
        </ReactMarkdown>
      </div>
    );
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeChangelog();
    }
  };

  return (
    <Modal.Backdrop isOpen={isChangelogOpen} onOpenChange={handleOpenChange}>
      <Modal.Container placement="center" size="cover">
        <Modal.Dialog>
          <Modal.CloseTrigger />

          <Modal.Header>
            <Modal.Heading className="text-xl font-bold">
              {t($ => $.changelogModal.title)}
            </Modal.Heading>

            {version && (
              <span className="font-mono text-xs font-semibold">
                {t($ => $.changelogModal.version, { version })}
              </span>
            )}
          </Modal.Header>

          <Modal.Body className="px-6 py-4">{modalContent}</Modal.Body>

          <Modal.Footer className="flex items-center justify-end gap-8 border-t px-6 py-4">
            <Link
              href="##"
              onPress={() => {
                openExternalLink(`${releaseUrl}/${version}`).catch(() => {});
              }}
            >
              <Link.Icon className="mr-1.5 size-3">
                <FaGithub />
              </Link.Icon>

              <span>{t($ => $.changelogModal.viewOnGithub)}</span>

              <Link.Icon className="ml-1.5 size-3">
                <FaExternalLinkAlt />
              </Link.Icon>
            </Link>

            <Button variant="primary" slot="close">
              {t($ => $.changelogModal.closeBtn.text)}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
