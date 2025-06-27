const base = require('./base');

module.exports = {
  ...base,
  globals: {
    __ENV: 'readonly',
    __VU: 'readonly',
    __ITER: 'readonly',
  },
  settings: {
    'import/core-modules': [
      'k6',
      'k6/encoding',
      'k6/http',
      'k6/crypto',
      'k6/html',
      'k6/metrics',
      'k6/data',
      'https://jslib.k6.io/url/1.0.0/index.js',
      'https://jslib.k6.io/k6-summary/0.0.1/index.js',
    ],
  },
  rules: {
    ...base.rules,
    'no-unused-expressions': ['error', { allowShortCircuit: true }],
    'import/extensions': ['error', 'ignorePackages', { ts: 'never' }],
    'no-underscore-dangle': [
      'error',
      {
        allow: ['__ENV', '__VU', '__ITER'],
      },
    ],
  },
};
