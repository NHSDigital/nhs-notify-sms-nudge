/* eslint-disable */
const { run } = require('./pre-install.lib');

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
