export function buildQueueUrl(
  accountId: string | undefined,
  environment: string,
) {
  const region = 'eu-west-2';
  const queueName = `nhs-${environment}-nudge-inbound-event-queue`;

  return `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;
}
