/* eslint-disable */
const { exec } = require('child_process');

// async wrapper around child_process.exec()
async function Exec(command, options) {
  const log = options?.log || process.env.DEBUG_EXEC === 'true';
  if (log) console.log(command);
  return new Promise((done, failed) => {
    exec(command, { ...options }, (err, stdout, stderr) => {
      if (log) {
        console.log(`Output from ${command} was:\n${stdout}`);
      }
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;

        failed(err);
        return;
      }
      done({ stdout, stderr });
    });
  });
}

module.exports = { Exec };
