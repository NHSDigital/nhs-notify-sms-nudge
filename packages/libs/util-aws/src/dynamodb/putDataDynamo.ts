import {
  PutCommand,
  BatchWriteCommand,
  UpdateCommand,
  QueryCommandInput,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import chunk from 'lodash/chunk';
import pLimit from 'p-limit';
import { createLogger } from '@comms/util-logger';
import {
  createDynamoDocumentClient,
  dynamoDocumentClient,
} from './dynamoClient';

export const putDataDynamo = async (
  TableName: string,
  Item: Record<string, unknown>
) => {
  const command = new PutCommand({
    TableName,
    Item,
  });

  return dynamoDocumentClient.send(command);
};
const DYNAMODB_MAX_BATCH_SIZE = 25;
export const putDataDynamoBatch = async <T extends Record<string, unknown>>(
  TableName: string,
  Items: T[],
  {
    maxAttempts = 10,
    maxConcurrency = 60,
    maxBackoffMs = 20_000,
    logger = createLogger(),
  } = {}
) => {
  const shouldRetry = (remaining: unknown[], attempts: number) =>
    remaining.length > 0 && attempts < maxAttempts;

  const limit = pLimit(maxConcurrency);

  const unprocessed: T[] = [];

  await Promise.all(
    chunk(Items, DYNAMODB_MAX_BATCH_SIZE).map((batch) =>
      limit(async () => {
        let remaining = [...batch];

        for (
          let attempts = 0;
          shouldRetry(remaining, attempts);
          attempts += 1
        ) {
          try {
            const result = await dynamoDocumentClient.send(
              new BatchWriteCommand({
                RequestItems: {
                  [TableName]: remaining.map((item) => ({
                    PutRequest: { Item: item },
                  })),
                },
              })
            );

            remaining = (result.UnprocessedItems?.[TableName] || []).map(
              (item) => item.PutRequest?.Item as T
            );

            if (shouldRetry(remaining, attempts)) {
              await new Promise((resolve) => {
                setTimeout(
                  resolve,
                  Math.min(maxBackoffMs, 500 * 2 ** (attempts - 1))
                );
              });
            }
          } catch (err) {
            logger.error({ err });
            break;
          }
        }

        unprocessed.push(...remaining);
      })
    )
  );

  return unprocessed;
};

export const updateDataDynamo = async (
  TableName: string,
  Key: Record<string, string>,
  updates: Record<string, string | string[]>
) => {
  const updateEntries = Object.entries(updates);
  const command = new UpdateCommand({
    TableName,
    Key,
    UpdateExpression: `SET ${updateEntries
      .map((_, i) => `#fieldToUpdate${i} = :newValue${i}`)
      .join(', ')}`,
    ExpressionAttributeValues: Object.fromEntries<string | string[] | number>(
      updateEntries.map((update, i) => [`:newValue${i}`, update[1]] as const)
    ),
    ExpressionAttributeNames: Object.fromEntries<string>(
      updateEntries.map(
        (update, i) => [`#fieldToUpdate${i}`, update[0]] as const
      )
    ),
  });

  return dynamoDocumentClient.send(command);
};

export const removeDataDynamo = async (
  TableName: string,
  Key: Record<string, string>,
  fieldsToRemove: string[]
) => {
  const command = new UpdateCommand({
    TableName,
    Key,
    UpdateExpression: `REMOVE ${fieldsToRemove
      .map((_, i) => `#fieldToRemove${i}`)
      .join(', ')}`,
    ExpressionAttributeNames: Object.fromEntries<string>(
      fieldsToRemove.map((field, i) => [`#fieldToRemove${i}`, field] as const)
    ),
  });

  return dynamoDocumentClient.send(command);
};

export const paginateDynamo = async <T>(
  input: QueryCommandInput,
  maxSize?: number,
  providedDynamoClient?: DynamoDBClient
) => {
  let params: QueryCommandInput = { ...input };
  let items: T[] = [];
  const dynamoClient = providedDynamoClient
    ? createDynamoDocumentClient(providedDynamoClient)
    : dynamoDocumentClient;

  do {
    const { Items, LastEvaluatedKey } = await dynamoClient.send(
      new QueryCommand(params)
    );

    items = [...items, ...(Items as T[])];
    params = { ...params, ExclusiveStartKey: LastEvaluatedKey };
  } while (params.ExclusiveStartKey && (!maxSize || items.length < maxSize));

  return maxSize ? items.slice(0, maxSize) : items;
};
