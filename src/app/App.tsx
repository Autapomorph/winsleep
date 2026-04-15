import { RouterProvider } from 'react-router';

import { ChangelogModal } from '@/features/check-updates';
import { GlobalContextMenu } from '@/features/global-context-menu';
import { useTimerListeners } from '@/entities/timer';
import { isMainWindow, useGlobalErrorTracking, useTabUnsuspend } from '@/shared/lib';
import { MainWindowInitializer } from './init';
import { HeadData } from './meta';
import { Providers } from './providers';
import { router } from './router';

import './styles/index.css';

export const App = () => {
  useGlobalErrorTracking();
  useTabUnsuspend();
  useTimerListeners();

  const isMain = isMainWindow();

  return (
    <Providers>
      <HeadData />
      <GlobalContextMenu />
      {isMain && <ChangelogModal />}
      {isMain && <MainWindowInitializer />}
      <RouterProvider router={router} />
    </Providers>
  );
};
