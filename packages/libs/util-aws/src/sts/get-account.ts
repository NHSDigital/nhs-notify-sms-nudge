import { GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { stsClient } from './sts-client';

export const getAccount = async () => {
  const { Account } = await stsClient.send(new GetCallerIdentityCommand({}));

  if (!Account) throw new Error('Current account could not be determined');

  return Account;
};
