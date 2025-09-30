import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

async function getAccountId() {
  const client = new STSClient();
  const command = new GetCallerIdentityCommand({});
  const response = await client.send(command);
  return response.Account;
}

export async function buildQueueUrl() {
  const accountId = await getAccountId();
  const region = 'eu-west-2';
  const queueName = 'nhs-main-nudge-inbound-event-queue';

  const queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;
  return queueUrl;
}
