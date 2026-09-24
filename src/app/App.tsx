import { RouterProvider } from 'react-router';

import { ReleaseNotesModal } from '@/features/check-updates';
import { GlobalContextMenu } from '@/features/global-context-menu';
import { isMainWindow, useGlobalErrorTracking } from '@/shared/lib';
import { MainWindowInitializer } from './init';
import { HeadData } from './meta';
import { Providers } from './providers';
import { router } from './router';

import './styles/index.css';

export const App = () => {
  useGlobalErrorTracking();

  const isMain = isMainWindow();

  return (
    <Providers>
      <HeadData />
      <GlobalContextMenu />
      {isMain && <ReleaseNotesModal />}
      {isMain && <MainWindowInitializer />}
      <RouterProvider router={router} />
    </Providers>
  );
};
