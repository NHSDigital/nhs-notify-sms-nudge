export function buildQueueUrl(accountId: string | undefined) {
  const region = 'eu-west-2';
  const queueName = 'nhs-main-nudge-inbound-event-queue';

  return `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;
}
