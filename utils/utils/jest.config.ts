import type { Config } from 'jest';

export const baseJestConfig: Config = {
  preset: 'ts-jest',

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: './.reports/unit/coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'babel',

  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: -10,
    },
  },

  coveragePathIgnorePatterns: ['/__tests__/'],
  transform: { '^.+\\.ts$': 'ts-jest' },
  testPathIgnorePatterns: ['.build'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],

  // Use this configuration option to add custom reporters to Jest
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Test Report',
        outputPath: './.reports/unit/test-report.html',
        includeFailureMsg: true,
      },
    ],
  ],

  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
};

const utilsJestConfig = {
  ...baseJestConfig,

  testEnvironment: 'node',

  coveragePathIgnorePatterns: [
    ...(baseJestConfig.coveragePathIgnorePatterns ?? []),
    'sqs-client.ts',
    'lambda-client.ts',
    'ssm-client.ts',
    's3-client.ts',
  ],

  moduleDirectories: ['node_modules', 'src'],
};

export default utilsJestConfig;
