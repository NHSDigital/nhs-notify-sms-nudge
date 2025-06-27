/*
 * Root configuration file for Jest unit tests
 */
const getConfig = ({ packageRoot = '.', componentName }) => ({
  rootDir: packageRoot,
  verbose: true,
  moduleDirectories: ['node_modules'],
  coverageReporters: ['clover', 'json', 'lcov', 'text', 'cobertura'],
  collectCoverageFrom: ['<rootDir>/src/**/*.[jt]s?(x)'],
  coveragePathIgnorePatterns: [
    '__test__',
    '/config/',
    '/container/',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  transformIgnorePatterns: ['node_modules'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/target/',
    '/test-config/',
  ],
  testEnvironment: '@comms/jest-circus-allure-environment/node',
  testEnvironmentOptions: {
    resultsDir: `${packageRoot}/target/reports/allure-results/`,
  },
  testRunner: 'jest-circus/runner',
  coverageDirectory: `<rootDir>/target/coverage/${componentName}`,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: `<rootDir>/target/reports/jest-junit`,
        outputName: `${componentName}-jest-junit.xml`,
      },
    ],
  ],
});

module.exports = {
  getConfig,
};
