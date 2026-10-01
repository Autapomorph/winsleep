import { z } from 'zod';

const validationSchema = z.object({
  MODE: z.enum(['production', 'development', 'test']),
  DEV: z.boolean(),
  PROD: z.boolean(),
  SSR: z.boolean(),
  VERCEL_AUTOMATION_BYPASS_SECRET: z.string().optional(),
  VITE_PROXY_UPDATER_URL: z.string().optional(),
});

const validatedConfig = validationSchema.parse(import.meta.env);

export interface AppConfig {
  MODE: 'production' | 'development' | 'test';
  isSSR: boolean;
  isProd: boolean;
  isDev: boolean;
  isTest: boolean;
  isPortable: boolean;
  VERCEL_AUTOMATION_BYPASS_SECRET?: string;
  PROXY_UPDATER_URL?: string;
}

const getConfig = (): AppConfig => {
  return {
    MODE: validatedConfig.MODE,
    isSSR: validatedConfig.SSR,
    isProd: validatedConfig.PROD || validatedConfig.MODE === 'production',
    isDev: validatedConfig.DEV || validatedConfig.MODE === 'development',
    isTest: validatedConfig.MODE === 'test',
    isPortable: false,
    VERCEL_AUTOMATION_BYPASS_SECRET: validatedConfig.VERCEL_AUTOMATION_BYPASS_SECRET,
    PROXY_UPDATER_URL: validatedConfig.VITE_PROXY_UPDATER_URL,
  };
};

export const config = getConfig();
