const { getConfig } = require('@sms/config-jest/jest.config');

const componentName = '@sms/utils';
const config = getConfig({ packageRoot: '.', componentName });

module.exports = {
  ...config,
  coveragePathIgnorePatterns: [
    ...config.coveragePathIgnorePatterns,
    'testhelpers',
  ],
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!lodash-es)'],
  transform: { '\\.tsx?$': 'ts-jest' },
};
