const base = require('./base');

module.exports = {
  ...base,
  rules: {
    ...base.rules,
    // Allow ForOfStatement as we are running in node not the browser
    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
    ],
    'no-await-in-loop': 0,
  },
};
