/* eslint-disable no-console */
/*
 * Playwright setting up Auth -> https://playwright.dev/docs/auth
 */

import { test as setup } from '@playwright/test';
import {
  COMMAND_LAMBDA_NAME,
  CSI,
  SEND_MSG_URL_ENVAR,
} from 'constants/backend-constants';
import { getEnvironmentVariables } from 'helpers/lambda-envar-helpers';

setup('component test setup', async () => {
  console.log(`Targeting CSI: ${CSI}`);

  // Ensure send message is pointed at sandbox or override allowed
  const commandEnvars = await getEnvironmentVariables(COMMAND_LAMBDA_NAME);

  const isSendMessageTargetValid =
    // eslint-disable-next-line security/detect-object-injection
    commandEnvars[SEND_MSG_URL_ENVAR].toLowerCase().includes('sandbox');

  if (!isSendMessageTargetValid) {
    throw new Error(
      'The component tests can only run when the command processor lambda is pointing to a sandbox environment',
    );
  }
});
