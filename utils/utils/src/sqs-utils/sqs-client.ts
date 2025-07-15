import { SQSClient, SQSClientConfig } from '@aws-sdk/client-sqs';

const region = process.env.AWS_REGION || 'eu-west-2';

export function getSqsClient(additionalOptions: Partial<SQSClientConfig> = {}) {
  return new SQSClient({
    region,
    retryMode: 'standard',
    maxAttempts: 5,
    ...additionalOptions,
  });
}

export const sqsClient = getSqsClient();
