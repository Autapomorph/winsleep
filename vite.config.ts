import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';
import { Unhead } from '@unhead/react/vite';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const host = env.TAURI_DEV_HOST;
  const hmrHost = env.TAURI_DEV_HMR_HOST;
  const hmrPort = Number(env.TAURI_DEV_HMR_PORT);

  return {
    clearScreen: false,
    server: {
      port: 3000,
      strictPort: true,
      host: host || true,
      hmr: hmrHost
        ? {
            protocol: 'ws',
            host: hmrHost,
            port: hmrPort || 3001,
          }
        : undefined,
      watch: {
        ignored: ['**/src-tauri/**'],
      },
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      react(),
      tailwindcss(),
      Unhead(),
      svgr(),
      mode === 'development' &&
        checker({
          typescript: true,
          eslint: {
            lintCommand: 'eslint',
            useFlatConfig: true,
            dev: {
              logLevel: ['error'],
            },
          },
        }),
    ],
  };
});
