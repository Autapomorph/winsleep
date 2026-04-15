import { createPortal } from 'react-dom';
import { Outlet } from 'react-router';

import { SkipToContent } from './SkipToContent';

interface Props {
  titlebar?: React.ReactNode;
}

export const MainLayout = ({ titlebar }: Props) => {
  const titlebarRoot = document.getElementById('titlebar-root');

  return (
    <div className="flex h-full flex-col">
      {titlebarRoot &&
        createPortal(
          <>
            <SkipToContent />
            {titlebar}
          </>,
          titlebarRoot,
        )}

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto flex min-h-0 w-full flex-1 flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
