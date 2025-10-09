import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

export async function getAccountId() {
  const client = new STSClient();
  const command = new GetCallerIdentityCommand({});
  const response = await client.send(command);
  return response.Account;
}
