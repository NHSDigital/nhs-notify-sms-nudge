import {
  BatchWriteCommand,
  BatchWriteCommandOutput,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { createMockLogger } from '@comms/util-logger';
import { mockClient } from 'aws-sdk-client-mock';
import { deleteDynamoBatch } from '../../dynamodb';
import 'aws-sdk-client-mock-jest';

const dynamoClient = mockClient(DynamoDBDocumentClient);
const mockLogger = createMockLogger();

beforeEach(() => {
  dynamoClient.reset();
  mockLogger.reset();
  jest.resetAllMocks();
});

describe('deleteDynamoBatch', () => {
  const items = [
    {
      key1: 'value1a',
      key2: 'value2a',
    },
    {
      key1: 'value1b',
      key2: 'value2b',
    },
  ] satisfies Record<string, string>[];

  const requestItems = {
    'table-name': [
      {
        DeleteRequest: {
          Key: {
            key1: 'value1a',
            key2: 'value2a',
          },
        },
      },
      {
        DeleteRequest: {
          Key: {
            key1: 'value1b',
            key2: 'value2b',
          },
        },
      },
    ],
  } satisfies BatchWriteCommandOutput['UnprocessedItems'];

  test('deletes items', async () => {
    await deleteDynamoBatch('table-name', items, 10, mockLogger.logger);

    expect(dynamoClient).toHaveReceivedCommandWith(BatchWriteCommand, {
      RequestItems: requestItems,
    });
  });

  test('retries items', async () => {
    dynamoClient
      .on(BatchWriteCommand)
      .resolvesOnce({
        UnprocessedItems: {
          'table-name': [
            {
              DeleteRequest: {
                Key: {
                  key1: 'value1a',
                  key2: 'value2a',
                },
              },
            },
          ],
        },
      })
      .resolves({});

    const res = await deleteDynamoBatch(
      'table-name',
      items,
      10,
      mockLogger.logger
    );

    expect(dynamoClient).toHaveReceivedCommandTimes(BatchWriteCommand, 2);
    expect(dynamoClient).toHaveReceivedCommandWith(BatchWriteCommand, {
      RequestItems: {
        'table-name': [
          {
            DeleteRequest: {
              Key: {
                key1: 'value1a',
                key2: 'value2a',
              },
            },
          },
        ],
      },
    });

    expect(res.UnprocessedItems).toBeUndefined();
  });

  test('stops retries after max attempts', async () => {
    const failedItems = {
      'table-name': [
        {
          DeleteRequest: {
            Key: {
              key1: 'value1a',
              key2: 'value2a',
            },
          },
        },
      ],
    };
    dynamoClient.resolves({
      UnprocessedItems: failedItems,
    });

    const res = await deleteDynamoBatch(
      'table-name',
      items,
      2,
      mockLogger.logger
    );

    expect(dynamoClient).toHaveReceivedCommandTimes(BatchWriteCommand, 3);
    expect(res.UnprocessedItems).toEqual(failedItems);
  });
});
