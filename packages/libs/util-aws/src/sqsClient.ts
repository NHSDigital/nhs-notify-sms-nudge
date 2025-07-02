import { SQSClient, SQSClientConfig } from '@aws-sdk/client-sqs';
import { region } from './locations';

export function getSqsClient(additionalOptions: Partial<SQSClientConfig> = {}) {
  return new SQSClient({
    region: region(),
    retryMode: 'standard',
    maxAttempts: 5,
    ...additionalOptions,
  });
}

export const sqsClient = getSqsClient();
