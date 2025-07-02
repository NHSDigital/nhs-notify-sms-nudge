import {
  AssumeRoleCommand,
  AssumeRoleCommandInput,
  AssumeRoleCommandOutput,
} from '@aws-sdk/client-sts';

import { stsClient } from './sts-client';

export function assumeRole(
  input: AssumeRoleCommandInput
): Promise<AssumeRoleCommandOutput> {
  return stsClient.send(new AssumeRoleCommand(input));
}
