const { getConfig } = require('@sms/config-jest/jest.config');
const { name: componentName } = require('./package.json');

const config = getConfig({ packageRoot: '.', componentName });

module.exports = {
  ...config,
  transform: { '\\.tsx?$': 'ts-jest' },
  coveragePathIgnorePatterns: [
    ...config.coveragePathIgnorePatterns,
    'index.ts',
  ],
};
