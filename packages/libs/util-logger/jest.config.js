const { getConfig } = require('@sms/config-jest/jest.config');

const componentName = '@sms/util-logger';
const config = getConfig({ packageRoot: '.', componentName });

module.exports = {
  ...config,
  transform: { '\\.tsx?$': 'ts-jest' },
  coveragePathIgnorePatterns: [
    ...config.coveragePathIgnorePatterns,
    'src/index.ts',
  ],
};
