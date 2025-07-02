import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDBStreamsClient } from '@aws-sdk/client-dynamodb-streams';
import { region } from '../locations';

export const getDynamoClient = (
  additionalOptions: Partial<DynamoDBClientConfig> = {}
) =>
  new DynamoDBClient({
    region: region(),
    retryMode: 'standard',
    maxAttempts: 10,
    ...additionalOptions,
  });

export const dynamoClient = getDynamoClient();

export const createDynamoDocumentClient = (
  providedDynamoClient: DynamoDBClient
) =>
  DynamoDBDocument.from(providedDynamoClient, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });

export const dynamoDocumentClient = createDynamoDocumentClient(dynamoClient);
export const dynamoStreamsClient = new DynamoDBStreamsClient({
  region: region(),
});
