const { getConfig } = require('@comms/config-jest/jest.config');

const componentName = '@sms/util-retry';
const config = getConfig({ packageRoot: '.', componentName });

module.exports = {
  ...config,
  transform: { '\\.tsx?$': 'ts-jest' },
};
