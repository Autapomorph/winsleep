import { configDefaults, coverageConfigDefaults, defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default defineConfig(async () => {
  const baseConfig =
    typeof viteConfig === 'function'
      ? await viteConfig({ mode: 'test', command: 'serve' })
      : viteConfig;

  return mergeConfig(
    baseConfig,
    defineConfig({
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/tests/setup.ts',
        include: [...configDefaults.include],
        exclude: [...configDefaults.exclude, '**/dist/**', '**/src-tauri/**'],
        coverage: {
          provider: 'v8',
          reporter: [...coverageConfigDefaults.reporter],
          include: ['src/**/*'],
          exclude: [
            'src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
            'src/tests/setup.ts',
            'src/@types/**',
            'src/main.tsx',
          ],
        },
      },
    }),
  );
});
