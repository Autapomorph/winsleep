import { createBrowserRouter, Navigate, Outlet } from 'react-router';

import { HomePage } from '@/pages/home';
import { SettingsPage } from '@/pages/settings';
import { TrayMenuPage } from '@/pages/tray-menu';
import { PageErrorBoundary } from '@/widgets/page-error-boundary';
import { Titlebar } from '@/widgets/titlebar';
import { MainLayout } from '@/shared/ui';

export const router = createBrowserRouter([
  {
    path: '/tray-menu',
    element: <TrayMenuPage />,
  },
  {
    element: <MainLayout titlebar={<Titlebar />} />,
    children: [
      {
        element: <Outlet />,
        ErrorBoundary: PageErrorBoundary,
        children: [
          {
            path: '/',
            element: <HomePage />,
          },
          {
            path: '/settings',
            element: <SettingsPage />,
          },
          {
            path: '*',
            element: <Navigate to="/" replace />,
          },
        ],
      },
    ],
  },
]);
