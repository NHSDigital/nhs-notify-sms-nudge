import { defineConfig } from '@playwright/test';
import baseConfig from 'config/playwright.config';

export default defineConfig({
  ...baseConfig,

  timeout: 120_000, // 30 seconds in the playwright default
  expect: {
    timeout: 10_000, // default is 5 seconds. After creating and previewing sometimes the load is slow on a cold start
  },
  projects: [
    {
      name: 'component',
      testMatch: '*.component.spec.ts',
      teardown: 'component:teardown',
    },
    {
      name: 'component:teardown',
      testMatch: 'component.teardown.ts',
    },
  ],
});
