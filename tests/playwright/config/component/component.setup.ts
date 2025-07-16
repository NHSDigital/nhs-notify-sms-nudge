/* eslint-disable no-console */
/*
 * Playwright setting up Auth -> https://playwright.dev/docs/auth
 */

import { test as setup } from '@playwright/test';
import {
  COMMAND_LAMBDA_NAME,
  CSI,
  FORCE_SANDBOX,
  SANDBOX_URL,
  SEND_MSG_URL_ENVAR,
} from 'constants/backend-constants';
import { getEnvironmentVariables } from 'helpers/lambda-envar-helpers';

setup('component test setup', async () => {
  // component test setup

  console.log(`Targeting CSI: ${CSI}`);

  // Ensure send message is pointed at sandbox or override allowed
  const commandEnvars = await getEnvironmentVariables(COMMAND_LAMBDA_NAME);

  const isSendMessageTargetValid =
    // eslint-disable-next-line security/detect-object-injection
    !FORCE_SANDBOX || commandEnvars[SEND_MSG_URL_ENVAR] === SANDBOX_URL;

  if (!isSendMessageTargetValid) {
    throw new Error(
      'process.env.FORCE_SANDBOX is true, but command processor lambda configuration does not target sandbox',
    );
  }
});
