/* eslint-disable */
const { Exec } = require('./exec');
const { readFileSync } = require('fs');
const homedir = require('os').homedir();

let taskNo = 0;
function progress(message) {
  const totalTasks = 4; // increase this manually when new tasks are added
  taskNo += 1;
  console.log(` (${taskNo}/${totalTasks}) ${message}`);
}

function sanitize(token) {
  // github runners add ANSI characters for colour/styles.
  const ansiCharsRegex =
    /[\u001B\u009B][#();?[]*(?:\d{1,4}(?:;\d{0,4})*)?[\d<=>A-ORZcf-nqry]/g;

  return token.replace(ansiCharsRegex, '');
}

function tryParseJson(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error(
      `Unable to parse json '${value}' '${typeof value}' '${
        value.length
      }' '${Buffer.from(value)}' . Error was: ${error}`
    );
    return {};
  }
}

function tryParseJWTHeader(token) {
  try {
    if (!token) {
      return {};
    }
    const cleanToken = sanitize(token).trim();
    if (!cleanToken || cleanToken === 'undefined') {
      return {};
    }
    const [base64Header] = cleanToken.split('.');
    const header = Buffer.from(base64Header, 'base64');
    return tryParseJson(header.toString());
  } catch (error) {
    console.error(`Unable to parse token ${token}. Error was: ${error}`);
    return {};
  }
}

function getExpiryTime(authToken) {
  const { exp = 0 } = tryParseJWTHeader(authToken);
  const expiryTimeInSeconds = Number.parseInt(exp);
  return expiryTimeInSeconds * 1000;
}

function parseAuthConfig() {
  const configMap = {};
  try {
    const config = readFileSync(`${homedir}/.npmrc`, 'utf-8').split('\n');
    config.forEach((line) => {
      const parts = line.split('=');
      configMap[parts[0]] = parts[1];
    });
  } catch (error) {
    console.error(
      `Unable to find user level .npmrc. Assuming no token available.`
    );
  }
  return configMap;
}

function isAccessTokenExpired(currentTimeInMillis, authTokenKey, authConfig) {
  const authToken = authConfig[authTokenKey];
  const exp = getExpiryTime(authToken);
  progress(`code artifact token expires at: ${exp} which is ${new Date(exp)}`);
  const earlyExipryInveral = 15 * 60 * 1000; // avoid token expiring soon after we run
  return currentTimeInMillis - earlyExipryInveral > exp;
}

async function run(currentTimeInMillis = Date.now()) {
  const AWS_CA_AUTH_NPM_TOKEN_KEY =
    '//comms-886194799418.d.codeartifact.eu-west-2.amazonaws.com/npm/npm-mirror/:_authToken';

  const AWS_CA_AUTH_PUBLISHED_TOKEN_KEY =
    '//comms-886194799418.d.codeartifact.eu-west-2.amazonaws.com:443/npm/private-published/:_authToken';

  const AWS_CA_AUTH_STAGING_TOKEN_KEY =
    '//comms-886194799418.d.codeartifact.eu-west-2.amazonaws.com/npm/private-staging/:_authToken';

  progress('setting up npm repo config to use AWS Code Artifact');

  const authConfig = parseAuthConfig();

  if (
    await isAccessTokenExpired(
      currentTimeInMillis,
      AWS_CA_AUTH_NPM_TOKEN_KEY,
      authConfig
    )
  ) {
    // check we have npm version 8 or later
    const npmVersion = (await Exec(`npm --version`)).stdout.trim();
    const npmMajorVersion = Number.parseInt(
      /(\d+)\.\d+\.\d+/.exec(npmVersion)[1]
    );
    if (!(npmMajorVersion >= 8)) {
      console.error(`ERROR: you need npm version 8.

      You need npm version 8 on the path for this script to work. You have ${npmVersion}

      Please correct this on your machine...

      Upgrading on *nix (OSX, Linux, etc.)
      Try: npm install -g npm@latest

      Upgrading on Windows
      See https://docs.npmjs.com/try-the-latest-stable-version-of-npm for more information

      If you are using asdf, run 'asdf reshim' after upgrading, or upgrading fails.
      `);
      throw new Error('Needs NPM version 8');
    }

    let canUseExistingAuthToken = false;

    const command = [
      'aws codeartifact get-authorization-token',
      '--query authorizationToken',
      '--domain comms',
      '--output text',
      '--domain-owner 886194799418',
    ];

    const validAccounts = [
      '736102632839', // test
      '257995483745', // dev
      '637423498933', // dev2
      '886194799418', // mgmt
      '422073736876', // mdev
    ];

    try {
      const { stdout: stsSTDOUT, stderr: stsSTDERR } = await Exec(
        'aws sts get-caller-identity'
      );
      const { Account = '' } = tryParseJson(stsSTDOUT);

      if (validAccounts.includes(Account) && !stsSTDERR) {
        canUseExistingAuthToken = true;
      }
    } catch {
      // ignore, as we expect this command to fail, if an appropriate role has not already been selected
      // TODO: might be better to just check for the codeartifact permission
    }

    if (!canUseExistingAuthToken) {
      command.push('--profile comms-mgr-mgmt-admin --region eu-west-2');
    }

    const { stdout: authToken } = await Exec(command.join(' '));
    progress('retrieved auth token from AWS code artifacts');

    await Exec(
      `npm config --location user set ${AWS_CA_AUTH_STAGING_TOKEN_KEY} ${authToken}`
    );

    await Exec(
      `npm config --location user set ${AWS_CA_AUTH_PUBLISHED_TOKEN_KEY} ${authToken}`
    );

    await Exec(
      `npm config --location user set ${AWS_CA_AUTH_NPM_TOKEN_KEY} ${authToken}`
    );

    progress('auth token has been set in your ~/.npmrc');
  } else {
    progress('token exists and has not expired');
  }
}

module.exports = { run };
