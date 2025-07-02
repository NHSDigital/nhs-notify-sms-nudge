import { createLogger } from '@comms/util-logger';
import {
  BatchWriteCommand,
  BatchWriteCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { promisify } from 'util';
import { dynamoDocumentClient } from './dynamoClient';

const sleep = promisify(setTimeout);

export async function deleteDynamoBatch(
  TableName: string,
  Keys: Record<string, string>[],
  maxRetries = 10,
  logger = createLogger()
): Promise<BatchWriteCommandOutput> {
  let remainingRequests: BatchWriteCommandOutput['UnprocessedItems'] = {
    [TableName]: Keys.map((item) => ({
      DeleteRequest: {
        Key: item,
      },
    })),
  };

  let retryAttempt = 0;
  let results: BatchWriteCommandOutput = {
    $metadata: {},
  };

  while (Keys.length && remainingRequests && retryAttempt <= maxRetries) {
    if (retryAttempt > 0) {
      // Ideally would use backoff from @comms/utils, but creates circular dependency
      const delaySeconds = 1.4 ** retryAttempt;
      logger.warn(
        `Attempt ${retryAttempt}: ${remainingRequests[TableName].length} unprocessed batch delete requests. Waiting ${delaySeconds} seconds before retrying`
      );

      await sleep(delaySeconds * 1000);
    }

    const command = new BatchWriteCommand({
      RequestItems: remainingRequests,
    });

    results = await dynamoDocumentClient.send(command);
    remainingRequests = undefined;

    if (results?.UnprocessedItems && results.UnprocessedItems[TableName]) {
      remainingRequests = results.UnprocessedItems;
    }
    retryAttempt += 1;
  }

  return results;
}
